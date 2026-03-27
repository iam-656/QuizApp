import { Router } from 'express';
import { submitFeedback, getUserFeedbacks } from '../controllers/feedbackController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Submit new feedback (Protected)
router.post('/', authenticateJWT as any, submitFeedback);

// Get all feedback submitted by the current user (Protected)
router.get('/', authenticateJWT as any, getUserFeedbacks);

export default router;
