import { Request, Response } from 'express';
import Roadmap from '../models/Roadmap';
import CodingProblem from '../models/CodingProblem';
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
import { getCuratedProblems } from '../constants/problemBank';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

// Roadmap validation: enforce proper topic ordering and difficulty progression
const RECOMMENDED_PROGRESSION = getOrderedTopics().map(t => t.key);

// Company-specific topic weighting — what matters most for each company
const COMPANY_WEIGHTS: Record<string, string[]> = {
  google:    ['dynamic_programming', 'graphs', 'trees', 'arrays', 'binary_search'],
  meta:      ['graphs', 'arrays', 'dynamic_programming', 'sliding_window', 'trees'],
  amazon:    ['trees', 'dynamic_programming', 'arrays', 'hashing', 'system_design'],
  microsoft: ['trees', 'arrays', 'dynamic_programming', 'linked_list', 'system_design'],
  apple:     ['arrays', 'trees', 'dynamic_programming', 'sliding_window', 'hashing'],
  nvidia:    ['dynamic_programming', 'graphs', 'trees', 'system_design', 'arrays'],
  default:   ['arrays', 'hashing', 'trees', 'dynamic_programming', 'graphs'],
};

function getCompanyTopicPriority(targetCompany: string): string[] {
  const key = (targetCompany || '').toLowerCase();
  for (const [company, weights] of Object.entries(COMPANY_WEIGHTS)) {
    if (key.includes(company)) return weights;
  }
  return COMPANY_WEIGHTS['default'];
}

/**
 * Build a week's problem list with a clear priority hierarchy:
 * 1. Problems from our own CodingProblem DB (user stays in product)
 * 2. Fill remaining slots from the curated bank (real verified LeetCode problems)
 * Selection is weighted by company focus + weak topics.
 */
async function resolveWeekProblems(
  week: any,
  weekIndex: number,
  targetCompany: string,
  weakTopics: string[]
): Promise<string[]> {
  const TARGET = 14;
  const result: string[] = [];
  const seen = new Set<string>();

  // Build topic list weighted by company priority + weak topics
  const companyPriority = getCompanyTopicPriority(targetCompany);
  const weekTopics: string[] = [
    ...(week.topics || []),
    ...companyPriority.slice(0, 3),
    ...weakTopics.slice(0, 2),
  ];

  // --- Step 1: Pull from our own CodingProblem DB ---
  try {
    const difficultyMap: Record<string, string[]> = {
      'Easy':   ['Easy'],
      'Mixed':  ['Easy', 'Medium'],
      'Medium': ['Medium'],
      'Hard':   ['Medium', 'Hard'],
    };
    const targetDifficulties = difficultyMap[week.difficulty] || ['Easy', 'Medium'];

    const dbProblems = await CodingProblem.find({
      difficulty: { $in: targetDifficulties },
      $or: weekTopics.map(t => ({ tags: { $regex: t, $options: 'i' } }))
        .concat(weekTopics.map(t => ({ category: { $regex: t, $options: 'i' } }))),
    }).select('title').limit(TARGET).lean();

    for (const p of dbProblems) {
      if (!seen.has(p.title)) {
        seen.add(p.title);
        result.push(`[HireIQ] ${p.title}`);
      }
    }
  } catch (e) {
    logger.warn(`CodingProblem DB query failed for week ${weekIndex + 1}: ${e}`);
  }

  // --- Step 2: Fill remaining with curated bank ---
  if (result.length < TARGET) {
    const bankProblems = getCuratedProblems(weekTopics, weekIndex, []);
    for (const p of bankProblems) {
      if (result.length >= TARGET) break;
      if (!seen.has(p)) {
        seen.add(p);
        result.push(p);
      }
    }
  }

  return result.slice(0, TARGET);
}

const validateAndSortWeeklyPlan = async (
  weeks: any[],
  targetWeekCount: number,
  targetCompany: string,
  weakTopics: string[]
): Promise<any[]> => {
  let validated = await Promise.all(weeks.map(async (week, i) => {
    const specificProblems = await resolveWeekProblems(week, i, targetCompany, weakTopics);
    return {
      ...week,
      week: i + 1,
      difficulty: week.difficulty || (i < 2 ? 'Easy' : i < 5 ? 'Mixed' : i < 9 ? 'Medium' : 'Hard'),
      problems: specificProblems.length,
      mockInterviews: i < 2 ? 0 : i < 5 ? 1 : 2,
      specificProblems,
    };
  }));
  
  if (targetWeekCount && targetWeekCount > 0) {
    // Slice if AI generated too many
    if (validated.length > targetWeekCount) {
      validated = validated.slice(0, targetWeekCount);
    } 
    // Pad if AI generated too few
    else if (validated.length < targetWeekCount && validated.length > 0) {
      const lastWeek = validated[validated.length - 1];
      const diff = targetWeekCount - validated.length;
      for (let j = 0; j < diff; j++) {
        const weekIdx = validated.length;
        const paddedProblems = await resolveWeekProblems(
          { ...lastWeek, difficulty: 'Hard' }, weekIdx, targetCompany, weakTopics
        );
        validated.push({
          ...lastWeek,
          week: weekIdx + 1,
          focus: `${lastWeek.focus} (Advanced)`,
          problems: paddedProblems.length,
          mockInterviews: 2,
          difficulty: 'Hard',
          specificProblems: paddedProblems,
        });
      }
    }
  }

  return validated;
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
        behavioralTelemetry: intelligence.behavioralTelemetry,
        archetype: intelligence.archetype,
        growthVelocity: intelligence.growthVelocity,
        $push: { trophies: { $each: intelligence.newTrophies } }
      });
      
      if (intelligence.newTrophies.length > 0) {
        for (const trophy of intelligence.newTrophies) {
           await IntelligenceEvent.create({
             user: userId,
             type: 'achievement',
             eventType: 'SYSTEM',
             title: `Trophy Unlocked: ${trophy.title}`,
             description: trophy.description,
             severity: 'milestone'
           });
        }
      }
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
        interviewReadinessScore: intelligence.readiness?.overall || user.interviewReadinessScore,
        careerBrain: user.careerBrain,
        behavioralTelemetry: intelligence.behavioralTelemetry || user.behavioralTelemetry,
        archetype: intelligence.archetype || user.archetype,
        growthVelocity: intelligence.growthVelocity || user.growthVelocity,
        trophies: user.trophies || []
      }
    });
  } catch (error: any) {
    logger.error(`[CareerController] getCareerIntelligence error: ${error.message}`);
    res.status(500).json({ message: 'Failed to compute career intelligence', error: error.message });
  }
};

/** POST /career/reset — Completely wipe user's career OS state to restart */
export const resetCareerProgress = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    
    // Clear user stats and flags
    await User.findByIdAndUpdate(userId, {
      $set: {
        'careerProfile.initialized': false,
        'careerProfile.initializationStatus': 'pending',
        'careerProfile.savedStep': 0,
        careerStrategies: [],
        interviewReadinessScore: 0,
        careerState: 'Explorer',
        topicMastery: new Map(),
        xp: 0,
        streak: 0,
        solvedProblems: []
      },
      $unset: {
        activeStrategyId: "",
        dailyFocus: "",
        readinessLastComputed: "",
        aiReflection: "",
        behavioralTelemetry: ""
      }
    });

    // Wipe related collections
    const IntelligenceEvent = require('../models/IntelligenceEvent').default;
    const Roadmap = require('../models/Roadmap').default;
    const Interview = require('../models/Interview').default;
    const CodingSubmission = require('../models/CodingSubmission').default;
    const ActivityLog = require('../models/ActivityLog').default;

    await IntelligenceEvent.deleteMany({ user: userId });
    await Roadmap.deleteMany({ user: userId });
    await Interview.deleteMany({ user: userId });
    await CodingSubmission.deleteMany({ user: userId });
    await ActivityLog.deleteMany({ user: userId }); // Phase 4: Cross-Feature Validation

    res.json({ success: true, message: 'Career OS progress reset' });
  } catch (error: any) {
    logger.error(`[CareerController] resetCareerProgress error: ${error.message}`);
    res.status(500).json({ message: 'Failed to reset progress', error: error.message });
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
      targetRole, dreamCompany, backupCompany, timeline, currentYear, dailyHoursAvailable, 
      weakTopics, strongTopics, persona, practiceFrequency, platformsUsed, highestDifficulty, 
      calibrationScore
    } = req.body;

    // We rely on frontend's calculated calibrationScore (0 to 3) since questions are dynamic now
    const score = calibrationScore || 0;

    // Map to synthetic comfort values for AI service compat
    const dsaComfort = Math.max(1, Math.min(10, score * 2.5 + (highestDifficulty === 'Hard' ? 3 : highestDifficulty === 'Medium' ? 1.5 : 0)));



    // 2. Compute exact target week count to enforce AI timeline constraints
    let targetWeekCount = 12;
    const tl = (timeline || '').toLowerCase();
    if (tl.includes('month')) {
      const match = tl.match(/(\d+)/);
      if (match) targetWeekCount = parseInt(match[1]) * 4;
    }
    if (tl.includes('week')) {
      const match = tl.match(/(\d+)/);
      if (match) targetWeekCount = parseInt(match[1]);
    }
    targetWeekCount = Math.min(52, Math.max(1, targetWeekCount));

    // 3. Generate roadmap via AI
    let initData: any = {};
    try {
      const initResponse = await axios.post(`${AI_SERVICE_URL}/career/profile/init`, {
        targetRole, targetCompany: dreamCompany, timeline, currentYear, dsaComfort,
        systemDesignComfort: 3, dailyHoursAvailable, weakTopics, strongTopics,
        persona: persona || 'faang_engineer',
        targetWeekCount
      }, { timeout: 45000 });

      initData = typeof initResponse.data.result === 'string'
        ? JSON.parse(initResponse.data.result)
        : initResponse.data.result;
    } catch (aiError) {
      logger.warn(`AI Roadmap generation failed. ${aiError}`);
      throw new Error('Failed to generate career roadmap');
    }

    const weeklyPlan = await validateAndSortWeeklyPlan(
      initData.weeklyPlan || [],
      targetWeekCount,
      dreamCompany || '',
      weakTopics || []
    );

    await Roadmap.deleteMany({ user: userId });

    const newRoadmap = new Roadmap({
      user: userId,
      title: initData.title || `${targetRole} Acceleration Plan`,
      targetRole: targetRole || 'Software Engineer',
      targetCompany: dreamCompany || '',
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
      targetCompany: dreamCompany || 'Unknown',
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

    const careerBrain = {
      skillGraph: initData.skillGraph || {},
      confidenceProfile: initData.confidenceProfile || { level: 'LOW', reason: 'Initial diagnostic.' },
      readinessBreakdown: initData.readinessBreakdown || { components: [], total: 0 },
      advisorPersona: persona || 'faang_engineer'
    };

    // 6. Commit final user state (Transaction complete)
    const finalUser = await User.findByIdAndUpdate(userId, {
      careerBrain,
      careerProfile: {
        targetRole: targetRole || 'Software Engineer',
        dreamCompany: dreamCompany || '',
        backupCompany: backupCompany || '',
        timeline: timeline || '12 months',
        targetCompany: dreamCompany || '', // legacy
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

    res.json({ roadmap: newRoadmap, intelligence, profile: finalUser?.careerProfile, careerBrain: finalUser?.careerBrain });
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

    const weeklyPlan = await validateAndSortWeeklyPlan(
      initData.weeklyPlan || [],
      12, // targetWeekCount
      profile?.targetCompany || '',
      intelligence.strugglingTopics.slice(0, 5)
    );
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
    const newWeeks = await validateAndSortWeeklyPlan(
      (adaptData.weeklyPlan || []).map((w: any, i: number) => ({ ...w, week: nextWeek + i })),
      12,
      roadmap.targetCompany || '',
      intelligence.strugglingTopics.slice(0, 5)
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

    // Cache is valid ONLY if: same day AND tasks exist AND at least one solve task is present
    // (if no solve task exists, cache is from before deterministic injection — regenerate)
    const hasCachedSolveTask = user.dailyFocus?.tasks?.some((t: any) => t.type === 'solve');
    const roadmapForCache = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
    const activeWeekForCache = (roadmapForCache as any)?.weeklyPlan?.find(
      (w: any) => !(roadmapForCache as any)?.adaptiveSignals?.completedWeeks?.includes(w.week)
    );
    const hasSpecificProblems = activeWeekForCache?.specificProblems?.length > 0;

    if (
      user.dailyFocus?.date &&
      user.dailyFocus.date.getTime() === today.getTime() &&
      user.dailyFocus.tasks &&
      user.dailyFocus.tasks.length > 0 &&
      (!hasSpecificProblems || hasCachedSolveTask)  // only use cache if solve tasks are present when they should be
    ) {
      // Return with weekSync context
      return res.json({
        dailyFocus: user.dailyFocus,
        weekSync: {
          weekNumber: activeWeekForCache?.week || 1,
          weekFocus: activeWeekForCache?.focus || '',
          dailyCompletions: (activeWeekForCache as any)?.dailyCompletions || 0,
          daysToCompleteWeek: 7,
          totalProblemsThisWeek: activeWeekForCache?.specificProblems?.length || 0,
          dailyQuota: activeWeekForCache?.specificProblems?.length
            ? Math.ceil(activeWeekForCache.specificProblems.length / 7)
            : 2,
        }
      });
    }

    // Otherwise, generate a new daily focus using the AI Service
    const intelligence = await computeCareerIntelligence(userId);
    const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });

    // Find the current active week from the roadmap
    const currentWeek = roadmap?.weeklyPlan.find(
      w => !roadmap.adaptiveSignals.completedWeeks.includes(w.week)
    ) || null;

    let focusData: any = {};
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/career/today/generate`, {
        targetRole: user.careerProfile?.targetRole || user.role,
        strugglingTopics: intelligence.strugglingTopics,
        currentRoadmapWeek: currentWeek,
        roadmapSpecificProblems: currentWeek?.specificProblems || [],
        availableMinutes: (user.careerProfile?.dailyHoursAvailable || 2) * 60,
      }, { timeout: 45000 });

      focusData = typeof aiResponse.data.result === 'string'
        ? JSON.parse(aiResponse.data.result)
        : aiResponse.data.result;
    } catch (aiError) {
      logger.warn(`AI Today Focus generation failed. ${aiError}`);
      // Don't throw — deterministic tasks can still be injected below
      focusData = { tasks: [] };
    }

    let aiTasks = focusData.tasks || [];

    // Deterministic solve task injection
    if (currentWeek && currentWeek.specificProblems && currentWeek.specificProblems.length > 0) {
      // Calculate how many to assign today
      const dailyQuota = Math.ceil(currentWeek.specificProblems.length / 7);
      
      // Pick based on day of week to ensure progression
      const dayOfWeek = today.getDay(); // 0-6
      const startIndex = (dayOfWeek * dailyQuota) % currentWeek.specificProblems.length;
      
      const codingTasks = [];
      for (let i = 0; i < dailyQuota; i++) {
        const problem = currentWeek.specificProblems[(startIndex + i) % currentWeek.specificProblems.length];
        // Convert "LeetCode 1. Two Sum" → "two-sum" for slug matching
        const slugRaw = problem.replace(/^leetcode\s*\d+\.?\s*/i, '').trim();
        const slug = slugRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Prefer internal Coding Lab. Fall back to LeetCode if not found.
        const internalProblem = await CodingProblem.findOne({ slug }).lean().select('_id');
        const link = internalProblem
          ? `/coding?problem=${internalProblem._id}`
          : `https://leetcode.com/problems/${slug}/`;

        codingTasks.push({
          id: `solve_day${today.getDay()}_${i}`,
          title: `Solve: ${problem}`,
          type: 'solve',
          estMinutes: 45,
          link,
          isInternal: !!internalProblem,
        });
      }

      // Filter out any rogue 'solve' tasks the AI might have generated despite instructions
      aiTasks = aiTasks.filter((t: any) => t.type !== 'solve');

      // Enrich AI-generated learn/review tasks with curated resource URLs
      aiTasks = aiTasks.map((t: any) => {
        if (t.type === 'learn' && (!t.link || t.link === '')) {
          const titleLower = (t.title || '').toLowerCase();
          if (titleLower.includes('system design')) {
            t.link = 'https://www.youtube.com/watch?v=i53Gi_K3o7I'; // Neetcode System Design playlist
          } else if (titleLower.includes('dynamic programming') || titleLower.includes('dp')) {
            t.link = 'https://www.youtube.com/watch?v=oBt53YbR9Kk'; // freeCodeCamp DP course
          } else if (titleLower.includes('graph')) {
            t.link = 'https://neetcode.io/courses/advanced-algorithms/0'; // Neetcode graphs
          } else if (titleLower.includes('tree') || titleLower.includes('bst')) {
            t.link = 'https://neetcode.io/courses/dsa-for-beginners/0';
          } else if (titleLower.includes('binary search')) {
            t.link = 'https://neetcode.io/courses/dsa-for-beginners/0';
          } else if (titleLower.includes('resume')) {
            t.link = 'https://www.overleaf.com/gallery/tagged/cv'; // Resume templates
          } else {
            t.link = 'https://neetcode.io/'; // Fallback to NeetCode
          }
        }
        return t;
      });

      // Merge deterministic coding tasks with AI learning/behavioral tasks
      aiTasks = [...codingTasks, ...aiTasks];
    }

    const newDailyFocus = {
      date: today,
      tasks: aiTasks,
    };

    await User.findByIdAndUpdate(userId, { dailyFocus: newDailyFocus });

    res.json({
      dailyFocus: newDailyFocus,
      weekSync: {
        weekNumber: currentWeek?.week || 1,
        weekFocus: currentWeek?.focus || '',
        dailyCompletions: (currentWeek as any)?.dailyCompletions || 0,
        daysToCompleteWeek: 7,
        totalProblemsThisWeek: currentWeek?.specificProblems?.length || 0,
        dailyQuota: currentWeek?.specificProblems?.length
          ? Math.ceil(currentWeek.specificProblems.length / 7)
          : 2,
      }
    });
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

    if (user.dailyFocus.tasks[taskIndex].completed) {
      return res.json({ success: true, message: 'Already completed' });
    }

    // Mark task completed
    user.dailyFocus.tasks[taskIndex].completed = true;
    user.xp += 15;

    await user.save();

    // Check if ALL tasks for today are now done
    const allTodayDone = user.dailyFocus.tasks.every(t => t.completed);

    if (allTodayDone) {
      await IntelligenceEvent.create({
        user: userId,
        type: 'milestone',
        description: 'Completed all daily focus tasks! Great execution today.',
        delta: '+45 XP',
      });

      // Increment the day-completion counter on the roadmap
      const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });
      if (roadmap) {
        const currentWeekObj = roadmap.weeklyPlan.find(
          w => !roadmap.adaptiveSignals.completedWeeks.includes(w.week)
        );

        if (currentWeekObj) {
          // Track how many daily completions this week
          if (!(currentWeekObj as any).dailyCompletions) {
            (currentWeekObj as any).dailyCompletions = 0;
          }
          (currentWeekObj as any).dailyCompletions += 1;

          // 7 days of daily completion = week is DONE
          if ((currentWeekObj as any).dailyCompletions >= 7) {
            currentWeekObj.status = 'completed';
            currentWeekObj.completedAt = new Date();
            roadmap.adaptiveSignals.completedWeeks.push(currentWeekObj.week);

            await IntelligenceEvent.create({
              user: userId,
              type: 'milestone',
              description: `Week ${currentWeekObj.week} Complete: ${currentWeekObj.focus}! Roadmap advancing.`,
              delta: `+150 XP · Week ${currentWeekObj.week} Locked`,
            });

            user.xp += 150;
            await user.save();
          }

          roadmap.markModified('weeklyPlan');
          roadmap.markModified('adaptiveSignals');
          await roadmap.save();
        }
      }
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

    // Sync legacy profile so resolveWeekProblems uses the right company weights
    if (!user.careerProfile) user.careerProfile = {} as any;
    user.careerProfile.targetCompany = newStrategy.targetCompany;
    user.careerProfile.targetRole = newStrategy.targetRole;
    user.careerProfile.timeline = '12 weeks'; // Reset timeline for new roadmap

    // Delete existing roadmap and clear today's focus
    const Roadmap = require('../models/Roadmap').default;
    await Roadmap.findOneAndDelete({ user: userId });
    user.dailyFocus = undefined;

    await user.save();

    // Auto-Regenerate the Roadmap with the new strategy
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
      persona: newMode || 'faang_engineer',
    });

    const initData = typeof initResponse.data.result === 'string'
      ? JSON.parse(initResponse.data.result)
      : initResponse.data.result;

    const weeklyPlan = await validateAndSortWeeklyPlan(
      initData.weeklyPlan || [],
      12,
      profile?.targetCompany || '',
      intelligence.strugglingTopics.slice(0, 5)
    );
    const newRoadmap = new Roadmap({
      user: userId,
      title: initData.title || `${newStrategy.targetRole} @ ${newStrategy.targetCompany}`,
      targetRole: profile?.targetRole || user.role,
      targetCompany: profile?.targetCompany,
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

    // Phase 5 Database Truth: Dynamically calculate XP from immutable ActivityLog
    const ActivityLog = require('../models/ActivityLog').default;
    const logs = await ActivityLog.find({ user: userId }).lean();
    const dynamicXP = logs.reduce((sum: number, log: any) => sum + (log.xpAwarded || 0), 0);

    res.json({
      success: true,
      user: {
        careerState: user.careerState,
        activeStrategyId: user.activeStrategyId,
        careerStrategies: user.careerStrategies,
        aiReflection: user.aiReflection,
        xp: dynamicXP, // Computed exclusively from ActivityLog
        behavioralTelemetry: intel.behavioralTelemetry || {
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
    res.status(500).json({ message: 'Failed to generate DNA profile', error: error.message });
  }
};

export const recommendProblem = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const intelligence = await computeCareerIntelligence(userId);
    const roadmap = await Roadmap.findOne({ user: userId }).sort({ createdAt: -1 });

    const targetCompany = roadmap?.targetCompany?.toLowerCase() || user.careerProfile?.targetCompany?.toLowerCase() || 'google';

    const allProblems = await CodingProblem.find({}).lean();

    const scoredProblems = allProblems.map(problem => {
      let score = 0;
      let reasons: string[] = [];

      // 1. Weakness Match
      const categoryMatch = problem.category?.toLowerCase() || '';
      const tagsMatch = problem.tags?.map(t => t.toLowerCase()) || [];
      const weakIndex = intelligence.strugglingTopics.findIndex((t: string) => 
        categoryMatch.includes(t.toLowerCase()) || tagsMatch.includes(t.toLowerCase())
      );
      
      if (weakIndex !== -1 && weakIndex < 5) {
        const weaknessWeight = (10 - weakIndex) * 10;
        score += weaknessWeight;
        reasons.push(`Targeting your #${weakIndex + 1} weakness: ${intelligence.strugglingTopics[weakIndex]}`);
      }

      // 2. Company Match
      const companyConfig = problem.companies?.find((c: any) => c.name.toLowerCase() === targetCompany);
      if (companyConfig) {
        const freqWeight = companyConfig.frequency === 'High' ? 50 : companyConfig.frequency === 'Medium' ? 30 : 10;
        score += freqWeight;
        reasons.push(`${companyConfig.frequency} frequency at ${targetCompany.charAt(0).toUpperCase() + targetCompany.slice(1)}`);
      }

      // 3. Roadmap Sync Match
      const currentWeekObj = roadmap?.weeklyPlan.find(w => !roadmap.adaptiveSignals.completedWeeks.includes(w.week));
      if (currentWeekObj) {
        const isInRoadmap = currentWeekObj.topics.some(t => categoryMatch.includes(t.toLowerCase()));
        if (isInRoadmap) {
          score += 80;
          reasons.push(`Required for Week ${currentWeekObj.week} Sync`);
        }
      }

      // Slightly penalize problems already completed
      // Since we don't have submissions handy here without another query, we can just return random if tied
      score += Math.random() * 5;

      return {
        ...problem,
        recommendationScore: score,
        recommendationReasons: reasons
      };
    });

    scoredProblems.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json({
      success: true,
      recommendations: scoredProblems.slice(0, 5)
    });

  } catch (error: any) {
    logger.error(`[CareerController] recommendProblem error: ${error.message}`);
    res.status(500).json({ message: 'Failed to generate recommendations', error: error.message });
  }
};
