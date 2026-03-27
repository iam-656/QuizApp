import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route (Informational)
app.get('/', (req: Request, res: Response) => {
  res.send('QuizApp Backend is running! Use /api for all endpoints.');
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling (Basic)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API endpoints accessible at http://localhost:${port}/api`);
});
