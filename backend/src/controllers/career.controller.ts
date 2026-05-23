import { Request, Response } from 'express';
import Roadmap from '../models/Roadmap';
import ResumeAnalysis from '../models/ResumeAnalysis';
import User from '../models/User';
import MentorSession from '../models/MentorSession';
import IntelligenceEvent from '../models/IntelligenceEvent';
import { reqUser } from '../middleware/auth';
import { computeCareerIntelligence } from '../services/careerIntelligence/readinessEngine';
import { TOPIC_REGISTRY, getOrderedTopics } from '../services/careerIntelligence/topicNormalizer';
import { triggerPassiveNarration } from '../services/careerIntelligence/careerIntelligence.service';
import axios from 'axios';
import logger from '../services/logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

// Roadmap validation: enforce proper topic ordering and difficulty progression
const RECOMMENDED_PROGRESSION = getOrderedTopics().map(t => t.key);

const validateAndSortWeeklyPlan = (weeks: any[]): any[] => {
  return weeks.map((week, i) => ({
    ...week,
    week: i + 1,
    difficulty: i < 2 ? 'Easy' : i < 5 ? 'Mixed' : i < 9 ? 'Medium' : 'Hard',
    problems: Math.max(5, Math.min(15, week.problems || 8)),
    mockInterviews: i < 2 ? 0 : i < 5 ? 1 : 2,
  }));
};

/** GET /career/intelligence — Main data fetch, deterministic computation */
export const getCareerIntelligence = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Graceful migration logic
    if (user.careerProfile?.initialized && (!user.careerStrategies || user.careerStrategies.length === 0)) {
      user.careerStrategies = [{
        targetCompany: user.careerProfile.targetCompany || 'Unknown',
        targetRole: user.careerProfile.targetRole || 'Software Engineer',
        mode: 'faang_sprint',
        dailyHours: user.careerProfile.dailyHoursAvailable || 2,
        state: 'active',
        createdAt: new Date(),
      }] as any;
      await user.save();
      // Have to fetch again to get the inserted _id
      user.activeStrategyId = user.careerStrategies[0]._id.toString();
      await user.save();
    }

    const activeStrategy = user.careerStrategies?.find(s => s._id.toString() === user.activeStrategyId) 
                        || user.careerStrategies?.[0];

    // Compute or use cached readiness (cache for 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const shouldRecompute = !user.readinessLastComputed || user.readinessLastComputed < oneHourAgo;

    let intelligence;
    if (shouldRecompute) {
      intelligence = await computeCareerIntelligence(userId);
      // Cache to DB
      await User.findByIdAndUpdate(userId, {
        interviewReadinessScore: intelligence.readiness.overall,
        careerState: intelligence.careerState,
        readinessLastComputed: new Date(),
      });
    } else {
      intelligence = await computeCareerIntelligence(userId);
    }

    // Trigger passive narration in background (No empty states policy)
    triggerPassiveNarration(userId).catch(e => logger.warn('Failed to trigger passive narration', e));

    // Get existing roadmap
    const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });

    res.json({
      intelligence,
      careerProfile: user.careerProfile, // legacy
      activeStrategy,
      careerStrategies: user.careerStrategies,
      roadmap,
      user: {
        name: user.name,
        xp: user.xp,
        streak: user.streak,
        careerState: user.careerState || intelligence.careerState,
        interviewReadinessScore: user.interviewReadinessScore,
      }
    });
  } catch (error: any) {
    logger.error(`[CareerController] getCareerIntelligence error: ${error.message}`);
    res.status(500).json({ message: 'Failed to compute career intelligence', error: error.message });
  }
};

/** POST /career/profile/init — Save onboarding answers + generate initial roadmap */
export const initializeCareerProfile = async (req: Request, res: Response) => {
  let createdRoadmapId: string | null = null;
  const userId = reqUser(req);
  
  try {
    // 1. Mark processing atomically
    await User.findByIdAndUpdate(userId, { 'careerProfile.initializationStatus': 'processing' });

    const {
      targetRole, targetCompany, currentYear, dailyHoursAvailable, weakTopics, strongTopics, persona,
      practiceFrequency, platformsUsed, highestDifficulty, calibrationAnswers
    } = req.body;

    // Evaluate Calibration MCQs to derive hidden score
    let score = 0;
    if (calibrationAnswers?.q1 === 'O(log n)') score++;
    if (calibrationAnswers?.q2 === 'Sliding Window') score++;
    if (calibrationAnswers?.q3 === 'Two keys hashing to the same bucket') score++;

    // Map to synthetic comfort values for AI service compat
    const dsaComfort = Math.max(1, Math.min(10, score * 2.5 + (highestDifficulty === 'Hard' ? 3 : highestDifficulty === 'Medium' ? 1.5 : 0)));

    // 2. Generate roadmap via AI
    const initResponse = await axios.post(`${AI_SERVICE_URL}/career/profile/init`, {
      targetRole, targetCompany, currentYear, dsaComfort,
      systemDesignComfort: 3, dailyHoursAvailable, weakTopics, strongTopics,
      persona: persona || 'faang_engineer',
    });

    const initData = typeof initResponse.data.result === 'string'
      ? JSON.parse(initResponse.data.result)
      : initResponse.data.result;

    const weeklyPlan = validateAndSortWeeklyPlan(initData.weeklyPlan || []);

    await Roadmap.deleteMany({ user: userId });

    const newRoadmap = new Roadmap({
      user: userId,
      title: initData.title || `${targetRole} Acceleration Plan`,
      targetRole: targetRole || 'Software Engineer',
      targetCompany: targetCompany || '',
      persona: persona || 'faang_engineer',
      phases: initData.phases || [],
      weeklyPlan,
      skillGaps: initData.skillGaps || [],
      adaptiveSignals: {
        velocityScore: dsaComfort * 1.5,
        strugglingTopics: weakTopics,
        completedWeeks: [],
        regenerationCount: 0,
      }
    });
    await newRoadmap.save();
    createdRoadmapId = newRoadmap._id as unknown as string;

    // 3. Create initial strategy
    const newStrategy = {
      targetCompany: targetCompany || 'Unknown',
      targetRole: targetRole || 'Software Engineer',
      mode: persona === 'faang_engineer' ? 'faang_sprint' : 'startup_builder',
      dailyHours: dailyHoursAvailable || 2,
      state: 'active' as const,
      createdAt: new Date(),
      whyStrategyChanged: 'Initial system calibration strategy based on evidence'
    };

    // 4. Emit Intelligence Events (SYSTEM fact)
    await IntelligenceEvent.create({
      user: userId,
      type: 'optimization_detected', // using existing type enum for now, will map later
      eventType: 'SYSTEM',
      title: 'Career OS Initialized',
      description: `Established baseline readiness based on ${score}/3 calibration score and behavioral signals. Confidence: LOW.`,
      severity: 'low'
    });

    // 5. Compute Intelligence (baseline)
    const intelligence = await computeCareerIntelligence(userId);

    // 6. Commit final user state (Transaction complete)
    const finalUser = await User.findByIdAndUpdate(userId, {
      careerProfile: {
        targetRole: targetRole || 'Software Engineer',
        targetCompany: targetCompany || '',
        currentYear: currentYear || 'junior',
        dailyHoursAvailable: dailyHoursAvailable || 2,
        weakTopics: weakTopics || [],
        strongTopics: strongTopics || [],
        initialized: true,
        savedStep: 5,
        version: 2,
        practiceFrequency,
        platformsUsed,
        highestDifficulty,
        initializationStatus: 'completed'
      },
      interviewReadinessScore: intelligence.readiness.overall,
      careerState: intelligence.careerState,
      readinessLastComputed: new Date(),
      $push: { careerStrategies: newStrategy }
    }, { new: true });
    
    if (finalUser && finalUser.careerStrategies && finalUser.careerStrategies.length > 0) {
      finalUser.activeStrategyId = finalUser.careerStrategies[finalUser.careerStrategies.length - 1]._id?.toString();
      await finalUser.save();
    }

    res.json({ roadmap: newRoadmap, intelligence, profile: finalUser?.careerProfile });
  } catch (error: any) {
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : '';
    logger.error(`[CareerController] initializeCareerProfile error: ${error.message} - ${errorDetails}`);
    // Rollback
    await User.findByIdAndUpdate(userId, { 'careerProfile.initializationStatus': 'failed' });
    if (createdRoadmapId) {
      await Roadmap.findByIdAndDelete(createdRoadmapId);
    }
    res.status(500).json({ message: 'Failed to initialize career profile', error: error.message, details: error.response?.data });
  }
};

/** POST /career/profile/save-progress — Save partial onboarding progress */
export const saveOnboardingProgress = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const { step, data } = req.body;
    await User.findByIdAndUpdate(userId, {
      'careerProfile.savedStep': step,
      ...Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [`careerProfile.${k}`, v])
      ),
    });
    res.json({ saved: true, step });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to save progress' });
  }
};

/** GET /career/roadmap — Fetch current roadmap */
export const getRoadmap = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });
    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch roadmap' });
  }
};

/** POST /career/roadmap/generate — Legacy generate (keep for backwards compat) */
export const generateUserRoadmap = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const intelligence = await computeCareerIntelligence(userId);
    const profile = user.careerProfile;

    const initResponse = await axios.post(`${AI_SERVICE_URL}/career/profile/init`, {
      targetRole: profile?.targetRole || user.role,
      targetCompany: profile?.targetCompany || '',
      currentYear: profile?.currentYear || 'junior',
      dsaComfort: (profile as any)?.dsaComfort || 5,
      systemDesignComfort: (profile as any)?.systemDesignComfort || 3,
      dailyHoursAvailable: (profile as any)?.dailyHoursAvailable || 2,
      weakTopics: intelligence.strugglingTopics.slice(0, 5),
      strongTopics: intelligence.strongTopics.slice(0, 3),
      persona: 'faang_engineer',
    });

    const initData = typeof initResponse.data.result === 'string'
      ? JSON.parse(initResponse.data.result)
      : initResponse.data.result;

    const weeklyPlan = validateAndSortWeeklyPlan(initData.weeklyPlan || []);
    const newRoadmap = new Roadmap({
      user: userId,
      title: initData.title || 'Personalized Growth Plan',
      targetRole: profile?.targetRole || user.role,
      phases: initData.phases || [],
      weeklyPlan,
      skillGaps: initData.skillGaps || [],
      adaptiveSignals: {
        velocityScore: 5,
        strugglingTopics: intelligence.strugglingTopics,
        completedWeeks: [],
        regenerationCount: 0,
      }
    });
    await newRoadmap.save();
    res.json(newRoadmap);
  } catch (error: any) {
    logger.error(`[CareerController] generateUserRoadmap error: ${error.message}`);
    res.status(500).json({ message: 'Failed to generate roadmap' });
  }
};

/** POST /career/roadmap/adapt — Append+Adapt roadmap (NEVER replaces completed weeks) */
export const adaptRoadmap = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!roadmap) return res.status(404).json({ message: 'No roadmap found. Initialize first.' });

    const intelligence = await computeCareerIntelligence(userId);
    const completedWeeks = roadmap.adaptiveSignals?.completedWeeks || [];
    const maxCompletedWeek = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0;
    const nextWeek = maxCompletedWeek + 1;

    // Get current week plans that haven't been completed
    const frozenWeeks = roadmap.weeklyPlan.filter(w => completedWeeks.includes(w.week));
    const adaptableWeeks = roadmap.weeklyPlan.filter(w => !completedWeeks.includes(w.week));

    const adaptResponse = await axios.post(`${AI_SERVICE_URL}/career/roadmap/adaptive`, {
      targetRole: roadmap.targetRole,
      targetCompany: roadmap.targetCompany,
      persona: roadmap.persona || 'faang_engineer',
      startingFromWeek: nextWeek,
      currentWeeks: adaptableWeeks,
      performanceDelta: intelligence.performanceDelta,
      strugglingTopics: intelligence.strugglingTopics,
      strongTopics: intelligence.strongTopics,
      readinessScore: intelligence.readiness.overall,
    });

    const adaptData = typeof adaptResponse.data.result === 'string'
      ? JSON.parse(adaptResponse.data.result)
      : adaptResponse.data.result;

    // Validate new weeks
    const newWeeks = validateAndSortWeeklyPlan(
      (adaptData.weeklyPlan || []).map((w: any, i: number) => ({ ...w, week: nextWeek + i }))
    );

    // Merge: frozen weeks stay, new weeks replace adaptable ones
    const mergedPlan = [
      ...frozenWeeks,
      ...newWeeks,
    ].sort((a, b) => a.week - b.week);

    await Roadmap.findByIdAndUpdate(roadmap._id, {
      weeklyPlan: mergedPlan,
      'adaptiveSignals.lastAdaptedAt': new Date(),
      'adaptiveSignals.strugglingTopics': intelligence.strugglingTopics,
      $inc: { 'adaptiveSignals.regenerationCount': 1 },
    });

    const updated = await Roadmap.findById(roadmap._id);
    res.json({ roadmap: updated, intelligence });
  } catch (error: any) {
    logger.error(`[CareerController] adaptRoadmap error: ${error.message}`);
    res.status(500).json({ message: 'Failed to adapt roadmap', error: error.message });
  }
};

/** POST /career/roadmap/complete-week — Mark a week as completed (freeze it) */
export const completeWeek = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const { weekNumber } = req.body;
    const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });
    if (!roadmap) return res.status(404).json({ message: 'No roadmap found' });

    await Roadmap.findByIdAndUpdate(roadmap._id, {
      $addToSet: { 'adaptiveSignals.completedWeeks': weekNumber },
      $set: { [`weeklyPlan.${weekNumber - 1}.completedAt`]: new Date() },
    });

    res.json({ success: true, completedWeek: weekNumber });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to mark week as complete' });
  }
};

/** POST /career/mentor/chat — AI Mentor with memory and persona */
export const chatWithMentor = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const { message, persona = 'faang_engineer' } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Load or create mentor session for this persona
    let session = await MentorSession.findOne({ user: userId, persona }).sort({ createdAt: -1 });

    // Compute live intelligence for context
    const intelligence = await computeCareerIntelligence(userId);

    const contextSnapshot = {
      overallReadiness: intelligence.readiness.overall,
      careerState: intelligence.careerState,
      targetRole: user.careerProfile?.targetRole || user.role,
      targetCompany: user.careerProfile?.targetCompany || 'FAANG',
      weakTopics: intelligence.strugglingTopics.slice(0, 5).map(t => TOPIC_REGISTRY[t]?.label || t),
      strongTopics: intelligence.strongTopics.slice(0, 3).map(t => TOPIC_REGISTRY[t]?.label || t),
      streak: user.streak,
      weeksToReadiness: intelligence.weeksToReadiness,
      performanceDelta: intelligence.performanceDelta,
    };

    if (!session) {
      session = new MentorSession({ user: userId, persona, messages: [], contextSnapshot });
    } else {
      session.contextSnapshot = contextSnapshot;
    }

    // Add user message to memory
    session.messages.push({ role: 'user', content: message, timestamp: new Date() });

    // Build conversation history for AI (last 10 messages for context window)
    const recentHistory = session.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Call AI with full context
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/career/mentor/v2`, {
      persona,
      message,
      history: recentHistory,
      context: contextSnapshot,
    });

    const mentorData = typeof aiResponse.data.mentorResponse === 'string'
      ? JSON.parse(aiResponse.data.mentorResponse)
      : aiResponse.data.mentorResponse;

    // Save mentor reply to memory
    session.messages.push({
      role: 'mentor',
      content: mentorData.reply || mentorData,
      timestamp: new Date()
    });
    await session.save();

    res.json({
      mentorResponse: mentorData,
      sessionId: session._id,
      messageCount: session.messages.length,
    });
  } catch (error: any) {
    logger.error(`[CareerController] chatWithMentor error: ${error.message}`);
    res.status(500).json({ message: 'Mentor communication failed', error: error.message });
  }
};

/** GET /career/today — Generate or fetch today's operational checklist */
export const getTodayFocus = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If we already generated tasks for today, return them
    if (user.dailyFocus?.date && user.dailyFocus.date.getTime() === today.getTime()) {
      return res.json({ dailyFocus: user.dailyFocus });
    }

    // Otherwise, generate a new daily focus using the AI Service
    const intelligence = await computeCareerIntelligence(userId);
    const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/career/today/generate`, {
      targetRole: user.careerProfile?.targetRole || user.role,
      strugglingTopics: intelligence.strugglingTopics,
      currentRoadmapWeek: roadmap?.weeklyPlan.find(w => !roadmap.adaptiveSignals.completedWeeks.includes(w.week)) || null,
      availableMinutes: (user.careerProfile?.dailyHoursAvailable || 2) * 60,
    });

    const focusData = typeof aiResponse.data.result === 'string'
      ? JSON.parse(aiResponse.data.result)
      : aiResponse.data.result;

    const newDailyFocus = {
      date: today,
      tasks: focusData.tasks || [],
    };

    await User.findByIdAndUpdate(userId, { dailyFocus: newDailyFocus });

    res.json({ dailyFocus: newDailyFocus });
  } catch (error: any) {
    logger.error(`[CareerController] getTodayFocus error: ${error.message}`);
    res.status(500).json({ message: 'Failed to generate today focus', error: error.message });
  }
};

/** POST /career/today/complete — Mark daily task as complete and grant XP */
export const completeTodayTask = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const { taskId } = req.body;
    
    const user = await User.findById(userId);
    if (!user || !user.dailyFocus) return res.status(404).json({ message: 'User or daily focus not found' });

    const taskIndex = user.dailyFocus.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });

    // Mark completed
    user.dailyFocus.tasks[taskIndex].completed = true;
    user.xp += 15; // fixed XP for daily tasks for now

    await user.save();

    // Optionally log an event if all tasks are done
    const allDone = user.dailyFocus.tasks.every(t => t.completed);
    if (allDone) {
      await IntelligenceEvent.create({
        user: userId,
        type: 'milestone',
        description: 'Completed all daily focus tasks!',
        delta: '+45 XP',
      });
    }

    res.json({ success: true, xp: user.xp, dailyFocus: user.dailyFocus });
  } catch (error: any) {
    logger.error(`[CareerController] completeTodayTask error: ${error.message}`);
    res.status(500).json({ message: 'Failed to complete task', error: error.message });
  }
};

/** GET /career/activity — Fetch recent intelligence events */
export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const events = await IntelligenceEvent.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, activity: events });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch activity feed' });
  }
};

/** POST /career/strategy/preview — Deterministic Strategic Preview */
export const previewStrategyShift = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { newMode } = req.body;
    
    const activeStrategy = user.careerStrategies?.find(s => s._id?.toString() === user.activeStrategyId) 
                        || user.careerStrategies?.[0];
    const currentModeKey = activeStrategy?.mode || 'faang_sprint';

    const CareerModeRegistry = require('../constants/careerModes').CareerModeRegistry;
    const currentMode = CareerModeRegistry[currentModeKey] || CareerModeRegistry['faang_sprint'];
    const targetMode = CareerModeRegistry[newMode] || CareerModeRegistry['faang_sprint'];

    // Calculate deltas
    const deltas = {
      dsa: targetMode.readinessWeights.dsa - currentMode.readinessWeights.dsa,
      optimization: targetMode.readinessWeights.optimization - currentMode.readinessWeights.optimization,
      interviews: targetMode.readinessWeights.interviews - currentMode.readinessWeights.interviews,
      resume: targetMode.readinessWeights.resume - currentMode.readinessWeights.resume,
      systemDesign: (targetMode.readinessWeights.systemDesign || 0) - (currentMode.readinessWeights.systemDesign || 0),
    };

    res.json({
      success: true,
      targetMode: targetMode.name,
      description: targetMode.description,
      primaryFocus: targetMode.primaryFocus,
      deltas,
    });
  } catch (error: any) {
    logger.error(`[CareerController] previewStrategyShift error: ${error.message}`);
    res.status(500).json({ message: 'Failed to preview strategy shift', error: error.message });
  }
};

/** POST /career/strategy/shift — Apply a new strategy, archiving the old one */
export const shiftStrategy = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { targetCompany, targetRole, newMode, whyStrategyChanged } = req.body;

    // Archive current active strategy
    const activeIdx = user.careerStrategies?.findIndex(s => s._id?.toString() === user.activeStrategyId) ?? -1;
    if (activeIdx !== -1 && user.careerStrategies) {
      user.careerStrategies[activeIdx].state = 'archived';
      user.careerStrategies[activeIdx].archivedAt = new Date();
      (user.careerStrategies[activeIdx] as any).peakReadiness = user.interviewReadinessScore || 0;
    }

    // Add new strategy
    const newStrategy = {
      targetCompany: targetCompany || 'Unknown',
      targetRole: targetRole || 'Software Engineer',
      mode: newMode || 'faang_sprint',
      dailyHours: 2,
      state: 'active' as const,
      createdAt: new Date(),
      whyStrategyChanged: whyStrategyChanged || 'User pivoted strategy via Strategy Center'
    };

    user.careerStrategies = user.careerStrategies || [];
    user.careerStrategies.push(newStrategy as any);
    await user.save();

    // Set active
    user.activeStrategyId = user.careerStrategies[user.careerStrategies.length - 1]._id?.toString();
    await user.save();

    res.json({ success: true, activeStrategyId: user.activeStrategyId });
  } catch (error: any) {
    logger.error(`[CareerController] shiftStrategy error: ${error.message}`);
    res.status(500).json({ message: 'Failed to shift strategy', error: error.message });
  }
};

/** GET /career/dna — Fetch Engineering DNA Profile data */
export const getDNAProfile = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure we have some cached AI reflection
    if (!user.aiReflection) {
      user.aiReflection = "System is gathering initial execution telemetry to form a reliable baseline of your behavioral traits. Continue practicing to generate an AI Reflection.";
      await user.save();
    }

    const events = await IntelligenceEvent.find({ user: userId }).sort({ createdAt: -1 }).lean();
    
    // Extract intelligence 
    const { computeCareerIntelligence } = require('../services/careerIntelligence/readinessEngine');
    const intel = await computeCareerIntelligence(userId);

    res.json({
      success: true,
      user: {
        careerState: user.careerState,
        activeStrategyId: user.activeStrategyId,
        careerStrategies: user.careerStrategies,
        aiReflection: user.aiReflection,
        xp: user.xp || 0,
        behavioralTelemetry: user.behavioralTelemetry || {
          hintDependency: 'Medium',
          recoveryAbility: 'Medium',
          persistence: 'Medium',
          panicSignals: 'Insufficient data',
          interviewStability: 'Medium',
          confidence: 'LOW',
          evidenceCount: 0
        }
      },
      intelligence: intel,
      events: events
    });
  } catch (error: any) {
    logger.error(`[CareerController] getDNAProfile error: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch DNA profile', error: error.message });
  }
};
