import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

export const startAttempt = async (req: AuthRequest, res: Response) => {
  const { quiz_id } = req.body;
  const user_id = req.user?.id;

  if (!quiz_id) {
    return res.status(400).json({ error: 'Quiz ID is required' });
  }

  try {
    // Verify quiz exists and check expiry
    const quizResult = await query('SELECT id, expires_at FROM quizzes WHERE id = $1', [quiz_id]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = quizResult.rows[0];
    if (quiz.expires_at && new Date() > new Date(quiz.expires_at)) {
      return res.status(403).json({ error: 'This quiz has expired and can no longer be taken.' });
    }

    // Check for an existing unsubmitted attempt
    const existingAttempt = await query(
      'SELECT * FROM attempts WHERE user_id = $1 AND quiz_id = $2 AND submitted_at IS NULL',
      [user_id, quiz_id]
    );

    if (existingAttempt.rows.length > 0) {
      return res.status(200).json({
        message: 'Resumed existing attempt',
        attempt: existingAttempt.rows[0],
      });
    }

    const result = await query(
      'INSERT INTO attempts (user_id, quiz_id, started_at) VALUES ($1, $2, NOW()) RETURNING *',
      [user_id, quiz_id]
    );

    res.status(201).json({
      message: 'Attempt started successfully',
      attempt: result.rows[0],
    });
  } catch (error: any) {
    console.error('Start attempt error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
  const { attempt_id, answers } = req.body; // answers is array of { question_id, selected_answer }
  const user_id = req.user?.id;

  if (!attempt_id || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Attempt ID and answers array are required' });
  }

  try {
    // 1. Fetch attempt and quiz questions
    const attemptResult = await query(
      'SELECT a.*, q.id as quiz_id FROM attempts a JOIN quizzes q ON a.quiz_id = q.id WHERE a.id = $1 AND a.user_id = $2',
      [attempt_id, user_id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    if (attemptResult.rows[0].submitted_at) {
        return res.status(400).json({ error: 'This attempt has already been submitted' });
    }

    const quiz_id = attemptResult.rows[0].quiz_id;
    const questionsResult = await query(
      'SELECT id, correct_answer FROM questions WHERE quiz_id = $1',
      [quiz_id]
    );

    const questionsMap = new Map();
    questionsResult.rows.forEach((q: any) => {
      questionsMap.set(q.id, q.correct_answer);
    });

    // 2. Calculate Score and Save individual answers
    let correctCount = 0;
    const totalQuestions = questionsResult.rows.length;

    for (const ans of answers) {
      const { question_id, selected_answer } = ans;
      const correctAnswer = questionsMap.get(question_id);

      if (correctAnswer !== undefined && String(selected_answer) === String(correctAnswer)) {
        correctCount++;
      }

      await query(
        'INSERT INTO answers (attempt_id, question_id, selected_answer) VALUES ($1, $2, $3)',
        [attempt_id, question_id, selected_answer]
      );
    }

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // 3. Update Attempt with final score and submitted_at timestamp
    const updatedAttempt = await query(
      'UPDATE attempts SET score = $1, submitted_at = NOW() WHERE id = $2 RETURNING *',
      [score, attempt_id]
    );

    res.json({
      message: 'Attempt submitted successfully',
      score,
      correctCount,
      totalQuestions,
      attempt: updatedAttempt.rows[0]
    });

  } catch (error: any) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logEvent = async (req: AuthRequest, res: Response) => {
  const { attempt_id, event_type } = req.body;
  const user_id = req.user?.id;

  if (!attempt_id || !event_type) {
    return res.status(400).json({ error: 'Attempt ID and event type are required' });
  }

  try {
    // Verify attempt belongs to user
    const attemptResult = await query(
      'SELECT id FROM attempts WHERE id = $1 AND user_id = $2',
      [attempt_id, user_id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found or unauthorized' });
    }

    const result = await query(
      'INSERT INTO attempt_events (attempt_id, event_type, timestamp) VALUES ($1, $2, NOW()) RETURNING *',
      [attempt_id, event_type]
    );

    res.status(201).json({
      message: 'Event logged successfully',
      event: result.rows[0]
    });
  } catch (error: any) {
    console.error('Log event error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logProctoring = async (req: AuthRequest, res: Response) => {
  const { attempt_id, face_detected, looking_away } = req.body;
  const user_id = req.user?.id;

  if (!attempt_id || face_detected === undefined || looking_away === undefined) {
    return res.status(400).json({ error: 'Attempt ID, face_detected, and looking_away are required' });
  }

  try {
    // Verify attempt belongs to user
    const attemptResult = await query(
      'SELECT id FROM attempts WHERE id = $1 AND user_id = $2',
      [attempt_id, user_id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found or unauthorized' });
    }

    const result = await query(
      'INSERT INTO proctoring_logs (attempt_id, face_detected, looking_away, timestamp) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [attempt_id, face_detected, looking_away]
    );

    res.status(201).json({
      message: 'Proctoring log recorded successfully',
      log: result.rows[0]
    });
  } catch (error: any) {
    console.error('Log proctoring error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserAttempts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await query(
      `SELECT a.*, q.title as quiz_title 
       FROM attempts a 
       JOIN quizzes q ON a.quiz_id = q.id 
       WHERE a.user_id = $1 
       ORDER BY a.started_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteAttempt = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const attemptQuery = `
      SELECT a.user_id, q.creator_id 
      FROM attempts a 
      JOIN quizzes q ON a.quiz_id = q.id 
      WHERE a.id = $1
    `;
    const attemptResult = await query(attemptQuery, [id]);

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const { user_id, creator_id } = attemptResult.rows[0];

    // Only allow deletion if user is the student who took it, OR the creator of the quiz
    if (user_id !== userId && creator_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this attempt' });
    }

    await query('DELETE FROM attempts WHERE id = $1', [id]);
    res.json({ message: 'Attempt deleted successfully' });
  } catch (error: any) {
    console.error('Delete attempt error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteAttemptsByQuiz = async (req: AuthRequest, res: Response) => {
  const { quizId } = req.params;
  const userId = req.user?.id;

  try {
    // Verify user is the creator of the quiz
    const quizResult = await query('SELECT creator_id FROM quizzes WHERE id = $1', [quizId]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quizResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'Only the quiz creator can clear all attempts for this quiz' });
    }

    await query('DELETE FROM attempts WHERE quiz_id = $1', [quizId]);
    res.json({ message: 'All attempts for this quiz deleted successfully' });
  } catch (error: any) {
    console.error('Delete quiz attempts error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteAllCreatorAttempts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    // Delete all attempts that belong to ANY quiz created by this user
    await query(`
      DELETE FROM attempts 
      WHERE quiz_id IN (
        SELECT id FROM quizzes WHERE creator_id = $1
      )
    `, [userId]);
    res.json({ message: 'All analytics and attempts on your quizzes have been cleared' });
  } catch (error: any) {
    console.error('Delete all creator attempts error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteAllUserAttempts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    // Delete all attempts taken by this specific user
    await query('DELETE FROM attempts WHERE user_id = $1', [userId]);
    res.json({ message: 'All your personal reports have been cleared' });
  } catch (error: any) {
    console.error('Delete all user attempts error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
