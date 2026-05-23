import { Router } from 'express';
import * as InterviewController from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/start', InterviewController.startInterview);
router.post('/answer', InterviewController.submitAnswer);
router.post('/end', InterviewController.endInterview);
router.get('/history', InterviewController.getHistory);
router.post('/inject', InterviewController.injectQuestion);
router.get('/:id', InterviewController.getInterviewById);

export default router;
