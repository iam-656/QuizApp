import { Request, Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

export const submitFeedback = async (req: AuthRequest, res: Response) => {
  const { category, rating, message } = req.body;
  const userId = req.user?.id;

  if (!category || !rating || !message) {
    return res.status(400).json({ error: 'Category, rating, and message are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const result = await query(
      'INSERT INTO feedbacks (user_id, category, rating, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, category, rating, message]
    );

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: result.rows[0],
    });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserFeedbacks = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    const result = await query(
      'SELECT * FROM feedbacks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Get user feedbacks error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
