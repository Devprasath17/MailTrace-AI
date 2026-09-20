import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const getSupabaseAdmin = () => {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase URL or Service Role Key is missing in server environment variables.');
    return null;
  }
  
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
