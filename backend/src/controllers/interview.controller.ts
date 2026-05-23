import { Request, Response } from 'express';
import Interview from '../models/Interview';
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

    const interview = new Interview({
      user: userId,
      role,
      experience,
      stack,
      companyType,
      persona: plan.persona,
      rounds: plan.rounds.map((round: any) => ({
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
    const { interviewId, answer } = req.body;
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
          roundType: interview.rounds[roundIndex].name.toLowerCase().includes('technical') ? 'technical' : 'behavioral'
        });

        const evaluation = typeof aiResponse.data.evaluation === 'string'
          ? JSON.parse(aiResponse.data.evaluation)
          : aiResponse.data.evaluation;

        // Update question status and evaluation
        question.answer = answer;
        question.evaluation = evaluation;
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
        if (q.evaluation && typeof q.evaluation.score === 'number') {
          totalScore += q.evaluation.score;
          count++;
        }
      });
    });

    interview.overallScore = count > 0 ? Math.round(totalScore / count) : 0;
    interview.status = 'completed';

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
                score: q.evaluation?.score
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
        }
    } catch (aiErr: any) {
        console.error('[END INTERVIEW] AI Summary Error:', aiErr.message);
        interview.feedback = "Interview session concluded successfully. Performance metrics have been synchronized.";
        interview.report = {
            summary: "Interview session concluded successfully.",
            strengths: ["Communication"],
            weaknesses: ["Technical Depth"],
            recommendations: ["Review core concepts"],
            verdict: "CONSIDER"
        };
    }
    
    await interview.save();
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
