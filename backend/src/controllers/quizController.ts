import { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

// Utility to generate a unique 16-digit numeric code
const generateQuizCode = async (): Promise<string> => {
  let code = '';
  let isUnique = false;

  while (!isUnique) {
    code = Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
    const result = await query('SELECT id FROM quizzes WHERE quiz_code = $1', [code]);
    if (result.rows.length === 0) {
      isUnique = true;
    }
  }
  return code;
};

export const createQuiz = async (req: AuthRequest, res: Response) => {
  const { title, description, duration, expires_at } = req.body;
  const creator_id = req.user?.id;

  if (!title || !duration) {
    return res.status(400).json({ error: 'Title and duration are required' });
  }

  try {
    const quiz_code = await generateQuizCode();
    const result = await query(
      'INSERT INTO quizzes (title, description, quiz_code, creator_id, duration, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, quiz_code, creator_id, duration, expires_at || null]
    );

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: result.rows[0],
    });
  } catch (error: any) {
    console.error('Create quiz error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addQuestions = async (req: AuthRequest, res: Response) => {
  const { quizId } = req.params;
  const { questions } = req.body; // Array of { question_text, options, correct_answer }
  const userId = req.user?.id;

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Questions array is required' });
  }

  try {
    // Verify quiz exists and user is the creator
    const quizResult = await query('SELECT creator_id FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quizResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to add questions to this quiz' });
    }

    // Insert questions
    const insertedQuestions = [];
    for (const q of questions) {
      const { question_text, options, correct_answer } = q;
      const result = await query(
        'INSERT INTO questions (quiz_id, question_text, options, correct_answer) VALUES ($1, $2, $3, $4) RETURNING *',
        [quizId, question_text, JSON.stringify(options), correct_answer]
      );
      insertedQuestions.push(result.rows[0]);
    }

    res.status(201).json({
      message: 'Questions added successfully',
      count: insertedQuestions.length,
      questions: insertedQuestions,
    });
  } catch (error: any) {
    console.error('Add questions error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getQuizByCode = async (req: AuthRequest, res: Response) => {
  const { code } = req.params;
  const userId = req.user?.id;
  try {
    const quizResult = await query('SELECT * FROM quizzes WHERE quiz_code = $1', [code]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const quiz = quizResult.rows[0];

    if (quiz.expires_at && new Date() > new Date(quiz.expires_at) && userId !== quiz.creator_id) {
      return res.status(403).json({ error: 'This quiz has expired and can no longer be accessed.' });
    }

    const questionsResult = await query(
      'SELECT id, question_text, options FROM questions WHERE quiz_id = $1',
      [quiz.id]
    );

    res.json({
      ...quiz,
      questions: questionsResult.rows
    });
  } catch (error: any) {
    console.error('Get quiz by code error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserQuizzes = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await query(
      'SELECT * FROM quizzes WHERE creator_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get user quizzes error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getQuizById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const quizResult = await query('SELECT * FROM quizzes WHERE id = $1', [id]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    const quiz = quizResult.rows[0];

    if (quiz.expires_at && new Date() > new Date(quiz.expires_at) && userId !== quiz.creator_id) {
      return res.status(403).json({ error: 'This quiz has expired and can no longer be accessed.' });
    }

    const questionsResult = await query(
      'SELECT id, question_text, options FROM questions WHERE quiz_id = $1',
      [quiz.id]
    );

    res.json({
      ...quiz,
      questions: questionsResult.rows
    });
  } catch (error: any) {
    console.error('Get quiz by id error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateQuiz = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, duration, expires_at } = req.body;
  const userId = req.user?.id;

  try {
    const quizResult = await query('SELECT creator_id FROM quizzes WHERE id = $1', [id]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quizResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this quiz' });
    }

    const result = await query(
      'UPDATE quizzes SET title = $1, description = $2, duration = $3, expires_at = $4 WHERE id = $5 RETURNING *',
      [title, description, duration, expires_at || null, id]
    );

    res.json({ message: 'Quiz updated successfully', quiz: result.rows[0] });
  } catch (error: any) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  const { quizId, questionId } = req.params;
  const { question_text, options, correct_answer } = req.body;
  const userId = req.user?.id;

  try {
    const quizResult = await query('SELECT creator_id FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quizResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this quiz' });
    }

    const result = await query(
      'UPDATE questions SET question_text = $1, options = $2, correct_answer = $3 WHERE id = $4 AND quiz_id = $5 RETURNING *',
      [question_text, JSON.stringify(options), correct_answer, questionId, quizId]
    );

    res.json({ message: 'Question updated successfully', question: result.rows[0] });
  } catch (error: any) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  const { quizId, questionId } = req.params;
  const userId = req.user?.id;

  try {
    // Verify quiz ownership
    const quizResult = await query('SELECT creator_id FROM quizzes WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quizResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to edit this quiz' });
    }

    // Delete the question
    await query('DELETE FROM questions WHERE id = $1 AND quiz_id = $2', [questionId, quizId]);

    res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteQuiz = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const quizResult = await query('SELECT creator_id FROM quizzes WHERE id = $1', [id]);
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quizResult.rows[0].creator_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this quiz' });
    }

    // Delete the quiz (cascading deletes will handle attempts/questions if set, else they should be handled manually, assuming cascading for now based on typical schema)
    await query('DELETE FROM quizzes WHERE id = $1', [id]);

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error: any) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCreatorAttempts = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await query(
      `SELECT 
        a.id as attempt_id,
        a.score,
        a.started_at,
        a.submitted_at,
        u.name as student_name,
        u.email as student_email,
        q.title as quiz_title,
        q.id as quiz_id
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       JOIN users u ON a.user_id = u.id
       WHERE q.creator_id = $1
       ORDER BY a.submitted_at DESC NULLS LAST`,
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get creator attempts error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
