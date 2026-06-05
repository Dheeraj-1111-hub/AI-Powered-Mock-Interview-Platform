import { Router } from 'express';
import * as CodesController from '../controllers/codes.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/import-codeforces', CodesController.importCodeforces);
router.post('/enrich-raw', CodesController.enrichRaw);
router.get('/problems', CodesController.getProblems);
router.get('/problems/:id', CodesController.getProblemById);
router.post('/run', CodesController.runCode);
router.post('/submit', CodesController.submitCode);
router.get('/submissions', CodesController.getMySubmissions);
router.get('/submissions/:id/audit-status', CodesController.getSubmissionAuditStatus);
router.post('/interview/start', CodesController.startInterview);
router.post('/interview/chat', CodesController.chatInterview);
router.post('/interview/monitor', CodesController.monitorInterview);
router.post('/interview/finish', CodesController.finishInterview);
router.post('/problems/:id/discussions', CodesController.addDiscussion);

export default router;