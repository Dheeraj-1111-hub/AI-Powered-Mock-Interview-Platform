import { Router } from 'express';
import * as AIController from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/resume', authMiddleware, AIController.analyzeResume);
router.post('/generate', authMiddleware, AIController.generateInterview);
router.post('/evaluate', authMiddleware, AIController.evaluateAnswer);
router.post('/review', authMiddleware, AIController.reviewCode);
router.post('/challenge', authMiddleware, AIController.generateChallenge);
router.post('/career/gap', authMiddleware, AIController.analyzeSkillGap);
router.post('/career/roadmap', authMiddleware, AIController.generateRoadmap);
router.post('/career/mentor', authMiddleware, AIController.careerMentor);
router.post('/follow-up', authMiddleware, AIController.followUpQuestion);

export default router;
