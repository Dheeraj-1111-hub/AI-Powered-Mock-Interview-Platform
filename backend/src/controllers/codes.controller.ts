import { Request, Response } from 'express';
import CodingProblem from '../models/CodingProblem';
import CodingSubmission from '../models/CodingSubmission';
import InterviewSession from '../models/InterviewSession';
import { reqUser } from '../middleware/auth';
import { executeCode } from '../services/execution';
import { deepEqual } from '../services/execution/localRunner';
import axios from 'axios';
import User from '../models/User';
import ActivityLog from '../models/ActivityLog';
import logger from '../services/logger';
import { syncCodeforcesProblems, enrichRawProblems } from '../services/problemImporter.service';
import { emitSubmissionCompleted } from '../utils/eventBus';

export const importCodeforces = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const result = await syncCodeforcesProblems(limit);
    res.json({ message: 'Codeforces raw problems synced successfully', ...result });
  } catch (error: any) {
    logger.error(`Import error: ${error.message}`);
    res.status(500).json({ message: 'Failed to sync Codeforces problems', error: error.message });
  }
};

export const enrichRaw = async (req: Request, res: Response) => {
  try {
    const batchSize = parseInt(req.query.batchSize as string) || 5;
    const result = await enrichRawProblems(batchSize);
    res.json({ message: 'Codeforces raw problems enriched successfully', ...result });
  } catch (error: any) {
    logger.error(`Enrichment error: ${error.message}`);
    res.status(500).json({ message: 'Failed to enrich problems', error: error.message });
  }
};

export const getProblems = async (req: Request, res: Response) => {
  try {
    let problems = await CodingProblem.find().lean();
    
    // Sort by difficulty
    problems = problems.sort((a: any, b: any) => {
      const diffMap: any = { Easy: 1, Medium: 2, Hard: 3 };
      return (diffMap[a.difficulty] || 0) - (diffMap[b.difficulty] || 0);
    });

    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch problems' });
  }
};

export const getProblemById = async (req: Request, res: Response) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch problem' });
  }
};

export const runCode = async (req: Request, res: Response) => {
  try {
    const { code, language, input } = req.body;
    const result = await executeCode(code, language, input || '');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const submitCode = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const { problemId, code, language, telemetry } = req.body;
    
    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const results = [];
    let allPassed = true;
    let finalStatus = 'Accepted';
    let peakRuntime = 0;
    let peakMemory = 0;

    // Run test cases
    for (const testCase of problem.testCases) {
      const result = await executeCode(code, language, testCase.input);
      const actual = (result.stdout || '').trim();
      const expected = (testCase.expectedOutput || '').trim();
      
      // Perform strict text comparison, fallback to structural deep equality if available
      let passed = actual === expected;
      if (!passed && result.returnValue !== undefined) {
        try {
          const parsedExpected = JSON.parse(expected);
          passed = deepEqual(result.returnValue, parsedExpected);
        } catch {
          passed = deepEqual(actual, expected);
        }
      }

      // Track peak metrics
      if (result.time > peakRuntime) peakRuntime = result.time;
      if (result.memory > peakMemory) peakMemory = result.memory;

      results.push({
        input: testCase.input,
        expected,
        actual,
        passed,
        hidden: testCase.hidden,
        caseType: testCase.caseType || 'hidden',
        time: result.time,
        memory: result.memory
      });

      if (!passed) {
        allPassed = false;
        finalStatus = result.status === 'Accepted' ? 'Wrong Answer' : result.status;
      }
    }

    const submission = new CodingSubmission({
      user: userId,
      problem: problemId,
      code,
      language,
      status: finalStatus,
      results,
      runtime: peakRuntime,
      memory: peakMemory,
      telemetry
    });

    await submission.save();

    await submission.save();

    // TRIGGER DATABASE TRUTH EVENT (ActivityLog)
    try {
      await ActivityLog.create({
        user: userId,
        type: 'problem_solved',
        xpAwarded: finalStatus === 'Accepted' ? (problem.difficulty === 'Easy' ? 10 : problem.difficulty === 'Medium' ? 20 : 30) : 0,
        metadata: {
          problemId: problem._id,
          difficulty: problem.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
          score: finalStatus === 'Accepted' ? 100 : 0
        }
      });
    } catch(err) { logger.error(`ActivityLog creation failed: ${err}`); }

    // Trigger Asynchronous Event Hook for Gamification, Analytics, and AI Review
    emitSubmissionCompleted(submission);

    res.json(submission);
  } catch (error: any) {
    logger.error(`Submission Error: ${error.message}`);
    res.status(500).json({ message: 'Failed to process submission', error: error.message });
  }
};

export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const submissions = await CodingSubmission.find({ user: userId })
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};

export const getSubmissionAuditStatus = async (req: Request, res: Response) => {
  try {
    const submission = await CodingSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    res.json({
      submissionId: submission._id,
      status: submission.status,
      aiReviewReady: !!submission.aiReview,
      aiReview: submission.aiReview || null
    });
  } catch (error: any) {
    logger.error(`Get audit status error: ${error.message}`);
    res.status(500).json({ message: 'Failed to get audit status', error: error.message });
  }
};

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

export const startInterview = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const { problemId, tone } = req.body;

    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Check if there is already an active session for this user and problem
    let session = await InterviewSession.findOne({ user: userId, problem: problemId, status: 'active' });
    
    if (!session) {
      session = new InterviewSession({
        user: userId,
        problem: problemId,
        tone: tone || 'interrogative',
        messages: [],
        codeSnapshots: []
      });
      await session.save();
    }

    // If messages list is empty, call FastAPI to get opening message
    if (session.messages.length === 0) {
      logger.info(`[Interview]: Initializing new AI interviewer dialog for problem ${problem.title}`);
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/interview/chat`, {
        problemDescription: problem.description,
        code: '',
        language: 'javascript',
        messages: [],
        tone: session.tone,
        interviewerPersona: session.interviewerPersona
      });

      session.messages.push({
        role: 'interviewer',
        content: aiResponse.data.message,
        timestamp: new Date()
      });
      await session.save();
    }

    res.json(session);
  } catch (error: any) {
    logger.error(`Start interview error: ${error.message}`);
    res.status(500).json({ message: 'Failed to start interview', error: error.message });
  }
};

export const chatInterview = async (req: Request, res: Response) => {
  try {
    const { sessionId, message, currentCode, language } = req.body;

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Interview session not found' });

    const problem = await CodingProblem.findById(session.problem);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Push candidate message
    session.messages.push({
      role: 'candidate',
      content: message,
      timestamp: new Date()
    });

    // Save code snapshot if provided
    if (currentCode) {
      session.codeSnapshots.push({
        code: currentCode,
        language: language || 'javascript',
        timestamp: new Date()
      });
    }

    await session.save();

    // Call FastAPI Interview Chat endpoint
    logger.info(`[Interview]: Calling AI interviewer dialog chat for session ${session._id}`);
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/interview/chat`, {
      problemDescription: problem.description,
      code: currentCode || '',
      language: language || 'javascript',
      messages: session.messages.map(m => ({ role: m.role, content: m.content })),
      tone: session.tone,
      interviewerPersona: session.interviewerPersona
    });

    // Push interviewer message
    session.messages.push({
      role: 'interviewer',
      content: aiResponse.data.message,
      timestamp: new Date()
    });

    await session.save();

    res.json(session);
  } catch (error: any) {
    logger.error(`Chat interview error: ${error.message}`);
    res.status(500).json({ message: 'Failed to chat with interviewer', error: error.message });
  }
};

export const monitorInterview = async (req: Request, res: Response) => {
  try {
    const { sessionId, currentCode, language } = req.body;

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Interview session not found' });

    const problem = await CodingProblem.findById(session.problem);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Call FastAPI Interview Monitor endpoint
    logger.info(`[Interview]: Calling AI interviewer monitor for session ${session._id}`);
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/interview/monitor`, {
      problemDescription: problem.description,
      code: currentCode || '',
      language: language || 'javascript',
      messages: session.messages.map(m => ({ role: m.role, content: m.content })),
      tone: session.tone,
      interviewerPersona: session.interviewerPersona
    });

    if (aiResponse.data.interrupt && aiResponse.data.message) {
      session.messages.push({
        role: 'interviewer',
        content: aiResponse.data.message,
        timestamp: new Date()
      });
      await session.save();
      return res.json({ interrupt: true, session });
    }

    res.json({ interrupt: false });
  } catch (error: any) {
    logger.error(`Monitor interview error: ${error.message}`);
    res.status(500).json({ message: 'Failed to monitor interviewer', error: error.message });
  }
};

export const finishInterview = async (req: Request, res: Response) => {
  try {
    const { sessionId, currentCode, language } = req.body;

    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Interview session not found' });

    const problem = await CodingProblem.findById(session.problem);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Call FastAPI Finish Interview endpoint to calibrate metrics and scorecard
    logger.info(`[Interview]: Calibrating final interview scorecard for session ${session._id}`);
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/interview/finish`, {
      problemDescription: problem.description,
      code: currentCode || '',
      language: language || 'javascript',
      messages: session.messages.map(m => ({ role: m.role, content: m.content }))
    });

    const scorecard = aiResponse.data;

    // Save final scorecard details
    session.status = 'completed';
    session.feedbackScorecard = {
      accuracy: scorecard.accuracy || 70,
      depth: scorecard.depth || 70,
      communication: scorecard.communication || 70,
      confidence: scorecard.confidence || 70,
      practicality: scorecard.practicality || 70,
      feedbackSummary: scorecard.feedbackSummary || 'Evaluation complete.',
      overallReadiness: scorecard.overallReadiness || 50,
      strongAreas: scorecard.strongAreas || [],
      weakAreas: scorecard.weakAreas || [],
      faangRecommendation: scorecard.faangRecommendation || 'Not Ready Yet',
      estimatedTimeline: scorecard.estimatedTimeline || '12 weeks'
    };
    await session.save();

    // Career OS Integration: Cache invalidation
    const user = await User.findById(session.user);
    if (user) {
      // Phase 4: Cross-Feature Validation (Cache invalidation)
      user.readinessLastComputed = undefined;
      await user.save();
    }

    // TRIGGER DATABASE TRUTH EVENT (ActivityLog)
    try {
      await ActivityLog.create({
        user: session.user,
        type: 'interview_completed',
        xpAwarded: session.feedbackScorecard.overallReadiness * 10,
        metadata: {
          interviewId: session._id,
          score: session.feedbackScorecard.overallReadiness,
          difficulty: 'medium'
        }
      });
    } catch(err) { logger.error(`ActivityLog creation failed: ${err}`); }

    res.json(session);
  } catch (error: any) {
    logger.error(`Finish interview error: ${error.message}`);
    res.status(500).json({ message: 'Failed to complete interview grading', error: error.message });
  }
};

export const addDiscussion = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { content } = req.body;
    if (!content || !content.trim()) {
       return res.status(400).json({ message: 'Discussion content is required' });
    }

    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    const newDiscussion = {
      author: user.name || 'Anonymous Developer',
      timeAgo: 'Just now',
      content: content.trim()
    };

    problem.discussions = problem.discussions || [];
    problem.discussions.unshift(newDiscussion);
    await problem.save();

    res.json(problem.discussions);
  } catch (error: any) {
    logger.error(`Add discussion error: ${error.message}`);
    res.status(500).json({ message: 'Failed to post discussion', error: error.message });
  }
};
