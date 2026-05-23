import { Router } from 'express';
import * as AnalyticsController from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/summary', AnalyticsController.getSummary);

export default router;
