import { Router } from 'express';
import * as CareerController from '../controllers/career.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Intelligence & Profile
router.get('/intelligence', CareerController.getCareerIntelligence);
router.get('/dna', CareerController.getDNAProfile);
router.post('/profile/init', CareerController.initializeCareerProfile);
router.post('/profile/save-progress', CareerController.saveOnboardingProgress);
router.post('/reset', CareerController.resetCareerProgress);

// Strategy
router.post('/strategy/preview', CareerController.previewStrategyShift);
router.post('/strategy/shift', CareerController.shiftStrategy);

// Roadmap
router.get('/roadmap', CareerController.getRoadmap);
router.post('/roadmap/generate', CareerController.generateUserRoadmap);  // legacy compat
router.post('/roadmap/adapt', CareerController.adaptRoadmap);
router.post('/roadmap/complete-week', CareerController.completeWeek);
router.get('/recommend-problem', CareerController.recommendProblem);

// Mentor (with memory)
router.post('/mentor/chat', CareerController.chatWithMentor);

// Today Engine & Activity
router.get('/today', CareerController.getTodayFocus);
router.post('/today/complete', CareerController.completeTodayTask);
router.get('/activity', CareerController.getActivityFeed);

export default router;
