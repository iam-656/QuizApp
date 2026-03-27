import { Router } from 'express';
import { 
  startAttempt, submitAttempt, logEvent, logProctoring, getUserAttempts,
  deleteAttempt, deleteAttemptsByQuiz, deleteAllCreatorAttempts, deleteAllUserAttempts
} from '../controllers/attemptController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Get attempts made by current user (Protected)
router.get('/user', authenticateJWT as any, getUserAttempts);

// Start a quiz attempt (Protected)
router.post('/start', authenticateJWT as any, startAttempt);

// Submit quiz answers and finalize attempt (Protected)
router.post('/submit', authenticateJWT as any, submitAttempt);

// Log security events during an attempt (Protected)
router.post('/events', authenticateJWT as any, logEvent);

// Log proctoring data during an attempt (Protected)
router.post('/proctoring', authenticateJWT as any, logProctoring);

// --- Deletion Routes ---

// Delete all attempts on creator's quizzes (Protected)
router.delete('/creator/all', authenticateJWT as any, deleteAllCreatorAttempts);

// Delete all attempts by the user (Protected)
router.delete('/user/all', authenticateJWT as any, deleteAllUserAttempts);

// Delete all attempts for a specific quiz (Protected - Creator only)
router.delete('/quiz/:quizId', authenticateJWT as any, deleteAttemptsByQuiz);

// Delete a single attempt (Protected - User or Creator)
router.delete('/:id', authenticateJWT as any, deleteAttempt);

export default router;
