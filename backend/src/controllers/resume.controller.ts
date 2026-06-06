import { Request, Response } from 'express';
import ResumeAnalysis from '../models/ResumeAnalysis';
import ActivityLog from '../models/ActivityLog';
import User from '../models/User';
import { reqUser } from '../middleware/auth';
import aiClient from '../services/aiClient';
import FormData from 'form-data';
import fs from 'fs';
import logger from '../services/logger';

export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const file = req.file;
    const { jobDescription } = req.body;

    if (!file) {
      logger.error(`[SECURITY]: Resume upload attempt without file by user ${userId}`);
      return res.status(400).json({ message: 'No resume file uploaded' });
    }

    // PHASE 8: FILE SECURITY HARDENING
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      logger.warn(`[SECURITY]: Blocked invalid file type: ${file.mimetype} from user ${userId}`);
      return res.status(400).json({ message: 'Invalid file type. Only PDF and DOCX are allowed.' });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }

    // Call AI Service
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(file.path);
    formData.append('resume', fileBuffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    
    // Inject unified Career Profile
    const profileData = {
        role: user.role,
        seniority: user.experience,
        skills: user.skills,
        strengths: user.careerProfile?.strongTopics || [],
        weaknesses: user.careerProfile?.weakTopics || [],
        targetCompany: user.careerProfile?.targetCompany || user.careerProfile?.dreamCompany || '',
        targetRole: user.careerProfile?.targetRole || user.role
    };
    formData.append('profileData', JSON.stringify(profileData));

    const aiResponse = await aiClient.post('/resume', formData, {
      headers: { ...formData.getHeaders() }
    });
    console.log('[RESUME CONTROLLER] AI Service responded successfully');

    const analysisData = aiResponse.data.analysis;
    let analysis;
    
    try {
        analysis = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
        
        if (analysis?.error || !analysis?.globalAts) {
             console.error('[RESUME CONTROLLER] AI returned an error or incomplete data:', analysis?.error);
             throw new Error('Incomplete data from AI Service');
        }
    } catch (parseError) {
        console.error('[RESUME CONTROLLER] Failed to parse AI response:', analysisData);
        throw new Error('Failed to parse AI resume analysis');
    }

    const newAnalysis = new ResumeAnalysis({
      user: userId,
      filename: file.originalname,
      resumeUrl: file.path,
      jobDescription,
      ...analysis
    });

    await newAnalysis.save();
    console.log('[RESUME CONTROLLER] Analysis saved to database');

    // Update user status
    await User.findByIdAndUpdate(userId, {
      resumeUrl: file.path,
      resumeAnalyzed: true,
      readinessLastComputed: null // Phase 4: Cross-Feature Validation
    });

    // TRIGGER DATABASE TRUTH EVENT (ActivityLog)
    try {
      await ActivityLog.create({
        user: userId,
        type: 'resume_scanned',
        xpAwarded: 50, // Flat reward for uploading resume
        metadata: {
          resumeScanId: newAnalysis._id,
          score: analysis.globalAts?.atsScore || 0
        }
      });
    } catch(err) { console.error('[RESUME CONTROLLER] ActivityLog creation failed:', err); }

    res.json(newAnalysis);
  } catch (error: any) {
    console.error('[RESUME CONTROLLER ERROR]:', error.message);
    if (error.response) {
        console.error('[RESUME CONTROLLER ERROR DATA]:', error.response.data);
        if (error.response.status === 429) {
           return res.status(429).json({ message: 'AI Intelligence engine is currently experiencing high demand (Rate Limited). Please wait 30 seconds and try again.' });
        }
    }
    res.status(500).json({ message: 'Failed to analyze resume. The AI engine might be temporarily overloaded or the file could not be parsed.', error: error.message });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const history = await ResumeAnalysis.find({ user: userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

export const getLatest = async (req: Request, res: Response) => {
  try {
    const userId = reqUser(req);
    const latest = await ResumeAnalysis.findOne({ user: userId }).sort({ createdAt: -1 });
    res.json(latest);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch latest analysis' });
  }
};
