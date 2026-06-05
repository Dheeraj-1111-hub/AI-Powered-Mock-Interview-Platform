import { Request, Response } from 'express';
import Interview from '../models/Interview';
import ActivityLog from '../models/ActivityLog';
import { reqUser } from '../middleware/auth';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

export const startInterview = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const { role, experience, stack, companyType, persona } = req.body;

    // Fetch intelligence memory for deeper personalization
    const { getUserIntelligenceMemory } = await import('../services/memory.service');
    const memory = await getUserIntelligenceMemory(userId);

    // Fetch latest resume analysis for personalization
    const { default: ResumeAnalysis } = await import('../models/ResumeAnalysis');
    const latestResume = await ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 });

    // Call AI service to generate interview plan
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
      role, 
      experience, 
      stack, 
      companyType, 
      persona,
      resumeContext: {
          strengths: [...(latestResume?.strengths || []), ...(memory?.topStrengths || [])],
          weaknesses: [...(latestResume?.weaknesses || []), ...(memory?.topWeaknesses || [])],
          keywordGaps: [...(latestResume?.keywordGaps || []), ...(memory?.codingIssues || [])]
      }
    });

    const plan = typeof aiResponse.data.plan === 'string' 
      ? JSON.parse(aiResponse.data.plan) 
      : aiResponse.data.plan;

    let finalPlan = plan;
    if (plan.error || !plan.rounds) {
      console.error("AI Service returned an error generating plan:", plan.error);
      throw new Error("Failed to generate AI interview plan from service");
    }

    const interview = new Interview({
      user: userId,
      role,
      experience,
      stack,
      companyType,
      persona: finalPlan.persona,
      rounds: finalPlan.rounds.map((round: any) => ({
        ...round,
        questions: round.questions.map((q: any) => ({
          text: q.text,
          status: 'pending'
        }))
      })),
      status: 'active',
      tags: [role, stack, companyType]
    });

    await interview.save();
    res.json(interview);
  } catch (error: any) {
    console.error('Start Interview Error:', error.message);
    res.status(500).json({ message: 'Failed to start interview session' });
  }
};

export const submitAnswer = async (req: Request, res: Response) => {
  try {
    const { interviewId, answer, latencyMs, voiceMetrics } = req.body;
    const roundIndex = Number(req.body.roundIndex);
    const questionIndex = Number(req.body.questionIndex);

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    if (!interview.rounds[roundIndex] || !interview.rounds[roundIndex].questions[questionIndex]) {
        console.error(`Invalid index: Round ${roundIndex}, Question ${questionIndex}`);
        return res.status(400).json({ message: 'Invalid question index' });
    }

    const question = interview.rounds[roundIndex].questions[questionIndex];

    // Generate transcript for context
    const transcript = interview.rounds.flatMap(r => 
        r.questions.filter(q => q.status === 'answered').map(q => ({
            question: q.text,
            answer: q.answer
        }))
    );

    // Call AI service to evaluate answer
    try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/evaluate`, {
          question: question.text,
          answer,
          role: interview.role,
          transcript, // Added global context memory
          latencyMs,
          voiceMetrics,
          roundType: interview.rounds[roundIndex].name.toLowerCase().includes('technical') ? 'technical' : 'behavioral'
        });

        const evaluation = typeof aiResponse.data.evaluation === 'string'
          ? JSON.parse(aiResponse.data.evaluation)
          : aiResponse.data.evaluation;

        let finalEvaluation = evaluation;
        if (evaluation.error || typeof evaluation.accuracy !== 'number') {
            console.error("AI Service returned an error for evaluation:", evaluation.error);
            throw new Error("Failed to generate AI evaluation from service");
        }

        // Update question status and evaluation
        question.answer = answer;
        question.evaluation = finalEvaluation;
        question.latencyMs = latencyMs;
        question.status = 'answered';

        // PHASE 7: AUTO-FOLLOW UP INJECTION
        if (evaluation.shouldFollowUp && interview.rounds[roundIndex].questions.length < 6) {
           console.log('[PHASE 7] AI suggests follow-up. Injecting...');
           try {
              const followUpResponse = await axios.post(`${AI_SERVICE_URL}/follow-up`, {
                 role: interview.role,
                 roundName: interview.rounds[roundIndex].name,
                 prevQuestion: question.text,
                 prevAnswer: answer,
                 transcript,
                 persona: interview.persona?.name || 'Skeptical Senior Architect'
              });
              
              if (followUpResponse.data.text) {
                 interview.rounds[roundIndex].questions.splice(questionIndex + 1, 0, {
                    text: followUpResponse.data.text,
                    status: 'pending'
                 } as any);
              }
           } catch (fupErr: any) {
              console.error('Follow-up injection failed:', fupErr.message);
           }
        }

        await interview.save();
        res.json({ interview, evaluation });
    } catch (aiErr: any) {
        console.error('AI Evaluation Failed:', aiErr.message);
        res.status(500).json({ message: 'AI service evaluation failed' });
    }
  } catch (error: any) {
    console.error('Submit Answer Error:', error.message);
    res.status(500).json({ message: 'Failed to submit answer' });
  }
};

export const endInterview = async (req: Request, res: Response) => {
  try {
    const { interviewId } = req.body;
    if (!interviewId) return res.status(400).json({ message: 'Interview ID required' });

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Calculate overall score
    let totalScore = 0;
    let count = 0;
    interview.rounds.forEach(round => {
      round.questions.forEach(q => {
        if (q.evaluation && typeof q.evaluation.accuracy === 'number') {
          totalScore += q.evaluation.accuracy;
          count++;
        }
      });
    });

    interview.overallScore = count > 0 ? Math.round(totalScore / count) : 0;
    interview.status = 'completed';

    // TRIGGER DATABASE TRUTH EVENT (ActivityLog)
    try {
      await ActivityLog.create({
        user: interview.user,
        type: 'interview_completed',
        xpAwarded: interview.overallScore * 10,
        metadata: {
          interviewId: interview._id,
          score: interview.overallScore,
          difficulty: 'medium'
        }
      });
    } catch(err) { console.error('ActivityLog creation failed:', err); }

    // TRIGGER GAMIFICATION
    let xpEarned = 0;
    try {
        const { awardGamificationXP } = await import('../services/gamification.service');
        xpEarned = interview.overallScore * 10;
        await awardGamificationXP(
            interview.user.toString(), 
            xpEarned, 
            'interview_completed', 
            `${interview.role} Mock Interview`, 
            `Completed simulation with a score of ${interview.overallScore}/100.`
        );
    } catch(err) { console.error('Gamification hook failed:', err); }

    // Generate AI Summary
    try {
        const transcript = interview.rounds.flatMap(r => 
            r.questions.filter(q => q.status === 'answered').map(q => ({
                question: q.text,
                answer: q.answer,
                accuracy: q.evaluation?.accuracy
            }))
        );
        
        if (transcript.length > 0) {
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/interview/summary`, {
                transcript,
                role: interview.role
            });
            interview.report = aiResponse.data;
            interview.feedback = aiResponse.data.summary;
            interview.tags = aiResponse.data.strengths; // Use strengths as tags
            
            // PHASE 10: CAREER OS INTEGRATION - ROADMAP INJECTION
            if (aiResponse.data.weaknesses && aiResponse.data.weaknesses.length > 0) {
               try {
                   const { default: Roadmap } = await import('../models/Roadmap');
                   const activeRoadmap = await Roadmap.findOne({ user: interview.user }).sort({ createdAt: -1 });
                   if (activeRoadmap) {
                       // Add to struggling topics
                       aiResponse.data.weaknesses.forEach((weakness: string) => {
                           if (!activeRoadmap.adaptiveSignals.strugglingTopics.includes(weakness)) {
                               activeRoadmap.adaptiveSignals.strugglingTopics.push(weakness);
                           }
                       });
                       
                       // Force inject tasks into the active week
                       const activeWeekIndex = activeRoadmap.weeklyPlan.findIndex(w => w.status === 'active');
                       if (activeWeekIndex !== -1) {
                           activeRoadmap.weeklyPlan[activeWeekIndex].topics.push(...aiResponse.data.weaknesses);
                           
                           // Add explicit review tasks
                           aiResponse.data.weaknesses.forEach((weakness: string) => {
                               activeRoadmap.weeklyPlan[activeWeekIndex].tasks.push({
                                   id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                   title: `Review Weakness: ${weakness} (Identified in Mock Interview)`,
                                   type: 'review',
                                   completed: false,
                                   xpReward: 20
                               });
                           });
                       }
                       await activeRoadmap.save();
                       console.log(`[PHASE 10] Injected weaknesses into Roadmap for user ${interview.user}`);
                   }
               } catch (roadmapErr: any) {
                   console.error('[PHASE 10] Roadmap Integration Failed:', roadmapErr.message);
               }
            }
        }
    } catch (aiErr: any) {
        console.error('[END INTERVIEW] AI Summary Error:', aiErr.message);
        throw new Error("Failed to generate AI interview summary from service");
    }
    
    await interview.save();

    // Phase 4: Cross-Feature Validation (Cache invalidation)
    try {
        const user = await User.findById(interview.user);
        if (user) {
            user.readinessLastComputed = null;
            await user.save();
        }
    } catch (e) {
        console.error('Failed to clear readiness cache:', e);
    }

    console.log(`[END INTERVIEW] Successfully finalized session ${interviewId}`);
    
    const responsePayload = interview.toJSON();
    // @ts-ignore
    responsePayload.xpEarned = xpEarned;
    
    res.json(responsePayload);
  } catch (error: any) {
    console.error('[CRITICAL] endInterview Failure:', error.message);
    res.status(500).json({ message: 'Failed to end interview', error: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const interviews = await Interview.find({ user: reqUser(req) }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

export const getInterviewById = async (req: Request, res: Response) => {
    try {
      const interview = await Interview.findById(req.params.id);
      res.json(interview);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch interview details' });
    }
};

export const injectQuestion = async (req: Request, res: Response) => {
    try {
        const { interviewId, questionText } = req.body;
        const roundIndex = Number(req.body.roundIndex);
        const questionIndex = Number(req.body.questionIndex);

        const interview = await Interview.findById(interviewId);
        if (!interview) return res.status(404).json({ message: 'Interview not found' });

        // Safety check: Don't allow more than 6 questions per round (original 3 + follow-ups)
        if (interview.rounds[roundIndex].questions.length >= 6) {
            return res.json(interview); // Just return without injecting
        }

        interview.rounds[roundIndex].questions.splice(questionIndex + 1, 0, {
            text: questionText,
            status: 'pending'
        } as any);

        await interview.save();
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: 'Failed to inject question' });
    }
};
