import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bsbnplineojjlvlxgfwb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYm5wbGluZW9qamx2bHhnZndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NTQzMDQsImV4cCI6MjA5MDAzMDMwNH0.3YLBXzipmF24RJSWAE-ggL6kbWM1og6KXzKS2gNaLlQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
