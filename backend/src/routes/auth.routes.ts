import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validator';
import { loginSchema, registerSchema } from '../validators/auth.schema';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.get('/me', authController.getCurrentUser); // Doesn't require auth, returns null if not logged in
router.post('/change-password', requireAuth, authController.changePassword);

export default router;
