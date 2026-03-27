import pool from './src/db/index';

const migrate = async () => {
  try {
    console.log('Running migration to create feedbacks table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id);
    `);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
