import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, onboardingSchema } from '../validators/auth.validator';

const router = Router();

router.get('/backfill', AuthController.backfillCode);
router.post('/force-reset', AuthController.forceResetPassword);

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/verify-email', AuthController.verifyEmail);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authMiddleware, AuthController.getMe);
router.post('/onboarding', authMiddleware, validate(onboardingSchema), AuthController.onboarding);

export default router;
