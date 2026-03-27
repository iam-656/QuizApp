import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

export const getAttemptReport = async (req: AuthRequest, res: Response) => {
  const { attemptId } = req.params;
  const userId = req.user?.id;

  try {
    // 1. Fetch attempt details and verify if the requester is the quiz creator
    const attemptQuery = `
      SELECT 
        a.id as attempt_id,
        a.score,
        a.started_at,
        a.submitted_at,
        u.name as student_name,
        u.email as student_email,
        q.id as quiz_id,
        q.title as quiz_title,
        q.creator_id
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.id = $1
    `;
    
    const attemptResult = await query(attemptQuery, [attemptId]);

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const attemptData = attemptResult.rows[0];

    // Security: Only the quiz creator can view this detailed report
    if (attemptData.creator_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: Only the quiz creator can view this report' });
    }

    // 2. Fetch Tab Switches (Attempt Events)
    const eventsResult = await query(
      "SELECT COUNT(*) as tab_switches FROM attempt_events WHERE attempt_id = $1 AND event_type IN ('TAB_SWITCH', 'WINDOW_BLUR')",
      [attemptId]
    );
    const tabSwitches = parseInt(eventsResult.rows[0].tab_switches);

    // 3. Fetch Proctoring Stats
    const proctoringResult = await query(
      "SELECT COUNT(*) as total_logs, COUNT(*) FILTER (WHERE face_detected = false) as face_not_detected, COUNT(*) FILTER (WHERE looking_away = true) as looking_away FROM proctoring_logs WHERE attempt_id = $1",
      [attemptId]
    );

    const proctoringData = proctoringResult.rows[0];
    const totalLogs = parseInt(proctoringData.total_logs);
    
    const faceNotDetectedCount = parseInt(proctoringData.face_not_detected || 0);
    const lookingAwayCount = parseInt(proctoringData.looking_away || 0);

    const faceNotDetectedPercent = totalLogs > 0 ? (faceNotDetectedCount / totalLogs) * 100 : 0;
    const lookingAwayPercent = totalLogs > 0 ? (lookingAwayCount / totalLogs) * 100 : 0;

    // 4. Calculate Cheating Indicators (Heuristics)
    const cheatingIndicators = [];
    if (tabSwitches > 3) cheatingIndicators.push('Frequent tab switching detected');
    if (faceNotDetectedPercent > 20) cheatingIndicators.push('Face not detected for significant duration');
    if (lookingAwayPercent > 25) cheatingIndicators.push('Frequent looking away from screen');
    
    const overallRisk = cheatingIndicators.length > 2 ? 'High' : (cheatingIndicators.length > 0 ? 'Medium' : 'Low');

    res.json({
      report: {
        attempt_id: attemptData.attempt_id,
        student: {
          name: attemptData.student_name,
          email: attemptData.student_email
        },
        quiz: {
          id: attemptData.quiz_id,
          title: attemptData.quiz_title
        },
        performance: {
          score: attemptData.score,
          started_at: attemptData.started_at,
          submitted_at: attemptData.submitted_at
        },
        security_metrics: {
          tab_switches: tabSwitches,
          face_not_detected_percentage: faceNotDetectedPercent.toFixed(2) + '%',
          looking_away_percentage: lookingAwayPercent.toFixed(2) + '%',
          total_proctoring_samples: totalLogs
        },
        proctoring_analysis: {
          cheating_indicators: cheatingIndicators,
          overall_risk_level: overallRisk
        }
      }
    });

  } catch (error: any) {
    console.error('Get attempt report error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
