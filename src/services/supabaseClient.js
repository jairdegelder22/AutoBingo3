import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://lsygkbpaybprjmjrsquv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzeWdrYnBheWJwcmptanJzcXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjEwOTksImV4cCI6MjA5MDc5NzA5OX0.Vrj1fdPk1PYWzfoc6SaDHOf5nn4W4bFSggVOvjVpPD0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
