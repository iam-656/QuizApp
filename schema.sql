-- Quiz Application Schema for Supabase/PostgreSQL

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
-- Note: In a real Supabase app, you might link this to auth.users.
-- This table stores additional profile information.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In production, use Supabase Auth for passwords
    organization TEXT,
    country TEXT,
    dob DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Quizzes Table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    quiz_code VARCHAR(16) UNIQUE NOT NULL, -- 16-digit unique code
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duration INTEGER NOT NULL, -- Duration in minutes
    expiry_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT quiz_code_length CHECK (char_length(quiz_code) = 16)
);

-- 3. Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- JSONB is preferred for performance in PG
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Attempts Table
CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    score DECIMAL(5, 2) DEFAULT 0.00,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Answers Table (User's responses for each question in an attempt)
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Attempt Events Table (Track UI actions like tab switching, full screen exit)
CREATE TABLE attempt_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'TAB_SWITCH', 'LOST_FOCUS', 'FULLSCREEN_EXIT'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Proctoring Logs Table (Track AI/Camera proctoring data)
CREATE TABLE proctoring_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    face_detected BOOLEAN DEFAULT TRUE,
    looking_away BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_attempts_user ON attempts(user_id);
CREATE INDEX idx_attempts_quiz ON attempts(quiz_id);
CREATE INDEX idx_answers_attempt ON answers(attempt_id);
CREATE INDEX idx_attempt_events_attempt ON attempt_events(attempt_id);
CREATE INDEX idx_proctoring_logs_attempt ON proctoring_logs(attempt_id);

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Feedbacks Table
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedbacks_user ON feedbacks(user_id);
