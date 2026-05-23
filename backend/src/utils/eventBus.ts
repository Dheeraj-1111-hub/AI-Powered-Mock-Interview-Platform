import { EventEmitter } from 'events';
import CodingSubmission, { ICodingSubmission } from '../models/CodingSubmission';
import CodingProblem from '../models/CodingProblem';
import User from '../models/User';
import axios from 'axios';
import logger from '../services/logger';

class SubmissionEventBus extends EventEmitter {}

export const eventBus = new SubmissionEventBus();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

// Register Event Listeners
eventBus.on('submission.completed', async (submission: ICodingSubmission) => {
  logger.info(`[EventBus]: Received submission.completed event for submission: ${submission._id}`);
  
  // 1. Trigger Asynchronous AI Audit Review in Background
  triggerAsyncAiAudit(submission);

  // 2. Trigger User Gamification XP and Mastery Updates
  if (submission.status === 'Accepted') {
    triggerGamification(submission);
  }
});

import { emitIntelligenceEvent } from '../services/careerIntelligence/careerIntelligence.service';

// Gamification Listener Logic - Delegated to Central Intelligence Engine
const triggerGamification = async (submission: ICodingSubmission) => {
  try {
    const userId = submission.user.toString();
    const problemId = submission.problem.toString();

    const problem = await CodingProblem.findById(problemId);
    if (!problem) return;

    const user = await User.findById(userId);
    if (!user) return;

    // Award XP only if first time solving
    if (!user.solvedProblems.includes(problemId)) {
       // Correct XP mapping per design decisions
       const xpGained = problem.difficulty === 'Hard' ? 50 : problem.difficulty === 'Medium' ? 25 : 10;
       
       // Update solved list here, central service handles XP and streak
       user.solvedProblems.push(problemId);
       
       // Topic Mastery
       const currentMastery = user.topicMastery.get(problem.category) || 0;
       user.topicMastery.set(problem.category, currentMastery + 1);
       
       await user.save();

       // Let the central brain handle the event log and XP applying
       await emitIntelligenceEvent(
         userId,
         'skill_improved',
         `Solved: ${problem.title}`,
         `Completed a ${problem.difficulty} problem in ${problem.category}.`,
         problem.category,
         undefined, // delta
         { xpEarned: xpGained }
       );
    }
  } catch (err: any) {
    logger.error(`[EventBus-Gamification]: Failed to process gamification: ${err.message}`);
  }
};

import { analyzeCodeAST } from '../services/execution/staticAnalyzer';

// Asynchronous Background AI Auditor Worker
const triggerAsyncAiAudit = async (submission: ICodingSubmission) => {
  try {
    const problem = await CodingProblem.findById(submission.problem);
    if (!problem) return;

    logger.info(`[EventBus-AIAudit]: Initiating background review for submission: ${submission._id}`);
    
    // Perform lightweight static analysis to ground the AI
    const staticAnalysis = analyzeCodeAST(submission.code, submission.language);

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/review`, {
      code: submission.code,
      language: submission.language,
      problemDescription: problem.description,
      staticAnalysis
    });

    const parsedReview = typeof aiResponse.data.review === 'string' 
      ? JSON.parse(aiResponse.data.review) 
      : aiResponse.data.review;

    // Save background audit result
    await CodingSubmission.findByIdAndUpdate(submission._id, {
      aiReview: parsedReview
    });

    logger.info(`[EventBus-AIAudit]: Background AI audit successfully processed and saved for: ${submission._id}`);
  } catch (err: any) {
    logger.error(`[EventBus-AIAudit]: Background AI Audit Failed: ${err.message}`);
  }
};

export const emitSubmissionCompleted = (submission: ICodingSubmission) => {
  eventBus.emit('submission.completed', submission);
};
