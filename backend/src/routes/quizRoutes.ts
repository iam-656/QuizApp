import { Router } from 'express';
import { createQuiz, addQuestions, deleteQuestion, getQuizByCode, getUserQuizzes, getCreatorAttempts, getQuizById, deleteQuiz, updateQuiz, updateQuestion } from '../controllers/quizController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Get quizzes created by current user (Protected)
router.get('/user', authenticateJWT as any, getUserQuizzes);

// Get all attempts for quizzes created by current user (Protected)
router.get('/creator/attempts', authenticateJWT as any, getCreatorAttempts);

// Create a new quiz (Protected)
router.post('/', authenticateJWT as any, createQuiz);

// Update quiz details (Protected)
router.put('/:id', authenticateJWT as any, updateQuiz);

// Add questions to a quiz (Protected)
router.post('/:quizId/questions', authenticateJWT as any, addQuestions);

// Update a specific question (Protected)
router.put('/:quizId/questions/:questionId', authenticateJWT as any, updateQuestion);

// Delete a question from a quiz (Protected)
router.delete('/:quizId/questions/:questionId', authenticateJWT as any, deleteQuestion);

// Delete quiz (Protected)
router.delete('/:id', authenticateJWT as any, deleteQuiz);

// Get quiz by numeric code (Protected - for students to join / creator checking)
router.get('/code/:code', authenticateJWT as any, getQuizByCode);

// Get quiz by ID (Protected)
router.get('/:id', authenticateJWT as any, getQuizById);

export default router;
