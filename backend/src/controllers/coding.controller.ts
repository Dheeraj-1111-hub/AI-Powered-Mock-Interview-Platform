import { Request, Response } from 'express';
import axios from 'axios';
import CodingSubmission from '../models/CodingSubmission';
import { reqUser } from '../middleware/auth';

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

export const submitCode = async (req: Request, res: Response) => {
  const { language, code, input } = req.body;
  const languageMap: Record<string, number> = { javascript: 63, python: 71, cpp: 54, java: 62 };
  const languageId = languageMap[language] || 63;

  try {
    const submission = await CodingSubmission.create({
      user: reqUser(req),
      language,
      code,
      status: 'running',
    });

    const response = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input || '',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = response.data;
    
    // PHASE 7: AI CODE INTELLIGENCE
    let aiReview = null;
    try {
       const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';
       const aiResponse = await axios.post(`${aiServiceUrl}/review`, {
          code,
          language,
          problemDescription: 'General Coding Exercise'
       });
       aiReview = aiResponse.data.review;
    } catch (aiErr: any) {
       console.error('AI Review Failed:', aiErr.message);
    }

    await CodingSubmission.findByIdAndUpdate(submission._id, {
      output: result.stdout || result.stderr || result.compile_output || 'No output',
      runtime: result.time || 0,
      memory: result.memory || 0,
      status: result.status?.description || 'Completed',
      aiReview: aiReview // Saving the intelligence report
    });

    // TRIGGER GAMIFICATION
    let xpEarned = 0;
    try {
        if (result.status?.description?.toLowerCase() === 'accepted') {
            xpEarned = 150; // 150 XP for a successful code execution
            const { awardGamificationXP } = await import('../services/gamification.service');
            await awardGamificationXP(
                reqUser(req), 
                xpEarned, 
                'skill_improved', 
                `Code Challenge Solved`, 
                `Successfully executed ${language} code with optimal performance.`
            );
        }
    } catch(err) { console.error('Gamification hook failed:', err); }

    res.json({
      submissionId: submission._id,
      status: 'completed',
      output: result.stdout || result.stderr || result.compile_output || 'No output',
      runtime: result.time || 0,
      memory: result.memory || 0,
      aiReview,
      xpEarned
    });
  } catch (error) {
    res.status(500).json({ message: 'Code execution failed' });
  }
};

export const getResult = async (req: Request, res: Response) => {
  const submission = await CodingSubmission.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });
  res.json(submission);
};
