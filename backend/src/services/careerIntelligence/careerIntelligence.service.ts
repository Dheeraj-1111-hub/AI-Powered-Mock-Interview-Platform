/**
 * careerIntelligence.service.ts
 *
 * The central "Brain" of the Career AI platform.
 * Handles:
 * - Emitting Intelligence Events
 * - Calculating XP and maintaining Streaks
 * - Recalculating Readiness Scores & Skill Gaps
 * - Generating the Daily Executive Focus (Today Engine)
 * - Adapting the Roadmap (Recovery Sprints)
 */

import IntelligenceEvent, { IIntelligenceEvent } from '../../models/IntelligenceEvent';
import User from '../../models/User';
import Roadmap from '../../models/Roadmap';
import logger from '../logger';
import { Types } from 'mongoose';
import axios from 'axios';


const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

// --- XP System Constants ---
const XP_MAP: Record<IIntelligenceEvent['type'], number> = {
  skill_improved: 15,
  skill_declined: 0,
  roadmap_completed: 75,
  interview_completed: 40,  // Base for completing mock interview
  streak_milestone: 20,
  optimization_detected: 15,
  optimization_missing: 0,
  resume_improved: 10,
  mentor_intervention: 0,
  recovery_required: 0
};
// Extra modifiers (e.g. Easy +10, Medium +25, Hard +50, etc.) are applied at emission time if passed in metadata.xpEarned

const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100];

/**
 * Calculate the user's emotional/career pressure based on inactivity, readiness, and velocity.
 */
export const calculateCareerPressureIndex = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) return { index: 'LOW', momentum: 'NEUTRAL', reasons: [] };

  const reasons = [];
  let pressureScore = 0;

  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (!user.lastActiveDate || (Date.now() - user.lastActiveDate.getTime()) > 2 * oneWeek) {
    pressureScore += 40;
    reasons.push('Over 2 weeks of inactivity.');
  }

  const activeStrategy = user.careerStrategies?.find(s => s._id?.toString() === user.activeStrategyId) 
                      || user.careerStrategies?.[0];
  const isFAANG = activeStrategy?.mode === 'faang_sprint';
  if (isFAANG && (user as any).interviewReadinessScore < 50) {
    pressureScore += 30;
    reasons.push('Readiness behind FAANG schedule.');
  }

  const roadmap = await Roadmap.findOne({ user: userId });
  if (roadmap && roadmap.adaptiveSignals?.velocityScore < 3) {
    pressureScore += 30;
    reasons.push('Low problem solving velocity.');
  }

  let index = 'LOW';
  if (pressureScore >= 70) index = 'HIGH';
  else if (pressureScore >= 40) index = 'MEDIUM';

  let momentum = 'NEUTRAL';
  // @ts-ignore
  if ((user as any).streak > 7) momentum = 'STRONG';
  // @ts-ignore
  if ((user as any).streak === 0) momentum = 'DROPPED';

  return { index, momentum, reasons };
};

/**
 * Emit a strongly-typed Intelligence Event and process Gamification (XP & Streaks)
 */
export const emitIntelligenceEvent = async (
  userId: string,
  type: IIntelligenceEvent['type'],
  title: string,
  description: string,
  topic?: string,
  delta?: number,
  metadata?: IIntelligenceEvent['metadata'],
  severity: 'insight' | 'warning' | 'milestone' | 'critical' | 'achievement' | 'low' | 'medium' | 'high' = 'insight',
  emotionalTone?: 'celebratory' | 'advisory' | 'urgent' | 'motivational',
  eventType: 'FACT' | 'INFERENCE' | 'SYSTEM' = 'INFERENCE'
): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Calculate XP
    let xpEarned = metadata?.xpEarned ?? XP_MAP[type];
    
    // Create the event
    const event = new IntelligenceEvent({
      user: user._id,
      type,
      eventType,
      title,
      description,
      topic,
      delta,
      metadata: { ...metadata, xpEarned },
      severity,
      emotionalTone
    });
    await event.save();

    // Process XP & basic updates
    if (xpEarned > 0) {
      // @ts-ignore
      user.xp = ((user as any).xp || 0) + xpEarned;
    }

    // Determine if we need to update streak
    const now = new Date();
    const lastActive = user.lastActiveDate;
    if (lastActive) {
      const diffTime = Math.abs(now.getTime() - lastActive.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // @ts-ignore
        user.streak = ((user as any).streak || 0) + 1;
        // @ts-ignore
        if (STREAK_MILESTONES.includes((user as any).streak)) {
          // Recursive call for streak milestone (fire and forget to avoid block)
          emitIntelligenceEvent(
            userId, 
            'streak_milestone', 
            `Consistency Streak!`, 
            // @ts-ignore
            `You hit a ${(user as any).streak}-day streak! Keep the momentum.`, 
            undefined, undefined, undefined, 'medium'
          ).catch(e => logger.warn('Failed to emit streak event'));
        }
      } else if (diffDays > 1) {
        // @ts-ignore
        user.streak = 1; // Reset streak
      }
    } else {
      // @ts-ignore
      user.streak = 1;
    }
    user.lastActiveDate = now;
    
    await user.save();

    // Check if we need to trigger a Roadmap Adaptation (Recovery Sprint)
    if (type === 'recovery_required' || type === 'skill_declined') {
      await adaptRoadmap(userId, topic || 'Unknown');
    }

  } catch (error: any) {
    logger.error(`[CareerIntelligence] Failed to emit event: ${error.message}`);
  }
};

/**
 * Adapt Roadmap: Inserts a "Recovery Sprint" without destroying existing weeks.
 */
export const adaptRoadmap = async (userId: string, weakTopic: string): Promise<void> => {
  try {
    const roadmap = await Roadmap.findOne({ user: userId });
    if (!roadmap) return;

    const completedWeeks = roadmap.adaptiveSignals?.completedWeeks || [];
    let currentWeekIdx = roadmap.weeklyPlan.findIndex(w => !completedWeeks.includes(w.week));
    if (currentWeekIdx === -1) return; // Roadmap finished

    // We only adapt FUTURE weeks (currentWeekIdx + 1)
    if (currentWeekIdx + 1 < roadmap.weeklyPlan.length) {
      const nextWeek = roadmap.weeklyPlan[currentWeekIdx + 1];
      if (nextWeek.focus.includes('Recovery') && nextWeek.topics.includes(weakTopic)) {
        return; // Already adapted
      }

      // Insert a recovery week
      const recoveryWeek = {
        week: nextWeek.week, // We will shift the rest
        focus: `${weakTopic} Recovery Sprint`,
        topics: [weakTopic, 'Fundamentals'],
        problems: 5,
        difficulty: 'Easy',
        mockInterviews: 0,
        status: 'regenerated' as const,
        decisionReasoning: `Recovery sprint triggered due to high pressure and struggles in ${weakTopic}.`,
        skippedTasks: [],
        tasks: [
          { id: new Types.ObjectId().toString(), title: `Review ${weakTopic} core patterns`, completed: false, type: 'learn' as const, xpReward: 20 },
          { id: new Types.ObjectId().toString(), title: `Solve 3 Easy ${weakTopic} problems`, completed: false, type: 'solve' as const, xpReward: 30 },
          { id: new Types.ObjectId().toString(), title: `${weakTopic} concept quiz`, completed: false, type: 'review' as const, xpReward: 15 },
        ]
      };

      // Shift subsequent weeks
      roadmap.weeklyPlan.splice(currentWeekIdx + 1, 0, recoveryWeek as any);
      for (let i = currentWeekIdx + 2; i < roadmap.weeklyPlan.length; i++) {
        roadmap.weeklyPlan[i].week = i + 1;
      }
      
      await roadmap.save();

      emitIntelligenceEvent(
        userId, 
        'mentor_intervention',
        'Recovery Sprint Activated', 
        `Inserted a Recovery Sprint for ${weakTopic} to build fundamentals and reduce cognitive load.`, 
        weakTopic, undefined, undefined, 'milestone', 'motivational'
      ).catch(e => logger.warn(e));
    }
  } catch (error: any) {
    logger.error(`[CareerIntelligence] Failed to adapt roadmap: ${error.message}`);
  }
};

/**
 * Gather Mentor Context: Recent 10 events + Prompt for summary if needed
 */
export const getMentorContext = async (userId: string) => {
  const events = await IntelligenceEvent.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
  const user = await User.findById(userId);
  
  // Format events into a digestible summary string
  const recentEvents = events.map(e => `[${e.createdAt.toISOString().split('T')[0]}] ${e.type.toUpperCase()}: ${e.title} - ${e.description}`).join('\n');
  
  let longTermMemory = '';
  if (user && user.careerStrategies && user.careerStrategies.length > 1) {
    longTermMemory = 'LONG TERM STRATEGIC PIVOTS:\n';
    user.careerStrategies.forEach((s, idx) => {
      longTermMemory += `- Strategy ${idx + 1} (${s.mode}): ${s.whyStrategyChanged || 'Initial strategy'}\n`;
    });
  }

  const pressure = await calculateCareerPressureIndex(userId);
  let behavioralContext = `CAREER PRESSURE: ${pressure.index} (Momentum: ${pressure.momentum})\nREASONS: ${pressure.reasons.join(', ')}\n\n`;

  try {
    const { computeCareerIntelligence } = require('./readinessEngine');
    const intel = await computeCareerIntelligence(userId);
    behavioralContext += `SYSTEM CONFIDENCE LEVEL: ${intel.systemConfidence}\n`;
    behavioralContext += `CRITICAL INSTRUCTION: Enforce Confidence-Aware Language. If SYSTEM CONFIDENCE LEVEL is LOW, you MUST use cautious language (e.g. "Early signals suggest...", "Initial observations indicate..."). If HIGH, use confident language (e.g. "Consistent performance shows...").\n\n`;
  } catch (e) {
    // Fallback if computation fails
  }

  if (user && user.lastActiveDate) {
    const daysInactive = Math.floor((Date.now() - user.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysInactive >= 2) {
      const slippedWeeks = Math.max(1, Math.ceil(daysInactive / 3));
      behavioralContext += `[URGENT PACING WARNING]: User has been inactive for ${daysInactive} days. At this pace, target readiness will slip by ~${slippedWeeks} weeks. Address this explicitly in your response.\n\n`;
    }
  }

  return behavioralContext + longTermMemory + '\nRECENT EVENTS:\n' + recentEvents;
};

/**
 * Passively generate insights/narration for the user in the background.
 */
export const triggerPassiveNarration = async (userId: string) => {
  // TODO: Implement background AI narration logic
  // For now, this is a no-op to prevent runtime crashes.
  return Promise.resolve();
};
