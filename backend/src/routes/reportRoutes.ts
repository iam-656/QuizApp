import { Router } from 'express';
import { getAttemptReport } from '../controllers/reportController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Get detailed report for an attempt (Only for the quiz creator)
router.get('/:attemptId/report', authenticateJWT as any, getAttemptReport);

export default router;
