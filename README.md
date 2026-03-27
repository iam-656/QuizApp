# QuizApp

Full-stack web application with Next.js (frontend) and Node.js/Express (backend), using Supabase (PostgreSQL).

## Project Structure

- `frontend/`: Next.js (App Router, TypeScript)
- `backend/`: Node.js/Express (TypeScript)

## Getting Started

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your database URL:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The server will run on [http://localhost:4000](http://localhost:4000).

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.local.example` to `.env.local` and configure your Supabase credentials:
   ```bash
   cp .env.local.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The application will run on [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, `pg` (PostgreSQL client)
- **Database**: Supabase (PostgreSQL)
