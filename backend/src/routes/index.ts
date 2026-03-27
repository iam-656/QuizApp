import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import quizRoutes from './quizRoutes';
import attemptRoutes from './attemptRoutes';
import reportRoutes from './reportRoutes';
import feedbackRoutes from './feedbackRoutes';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// API Root Information
router.get('/', (req, res) => {
  res.json({
    message: 'QuizTrust API is active',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      quizzes: '/api/quizzes',
      attempts: '/api/attempts',
      reports: '/api/reports',
      feedbacks: '/api/feedbacks'
    }
  });
});

// Authentication routes (Public)
router.use('/auth', authRoutes);

// Quiz routes (Mixed Public/Private)
router.use('/quizzes', quizRoutes);

// Attempt routes (Protected)
router.use('/attempts', attemptRoutes);

// Report routes (Protected - Quiz Creator Only)
router.use('/reports', reportRoutes);

// Feedback routes (Protected)
router.use('/feedbacks', feedbackRoutes);

// User routes (Protected)
router.use('/users', authenticateJWT as any, userRoutes);

export default router;
