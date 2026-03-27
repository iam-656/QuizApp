import { Request, Response } from 'express';
import { query } from '../db';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, name, email, organization FROM users');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(`Error fetching user ${id}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
