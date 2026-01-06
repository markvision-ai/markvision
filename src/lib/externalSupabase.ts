/**
 * External Supabase Client
 * Connects to pyscczcuersdjvpmkiec.supabase.co - external unified database
 * This replaces the default Lovable Cloud Supabase client
 */
import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://pyscczcuersdjvpmkiec.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY || '';

// Fallback to original key if external not set
const ANON_KEY = EXTERNAL_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!ANON_KEY) {
  console.error('EXTERNAL_SUPABASE_ANON_KEY is not configured!');
}

console.log('MarkVision подключен к базе pyscczcu...');

export const supabase = createClient(EXTERNAL_SUPABASE_URL, ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export URL for edge functions if needed
export const SUPABASE_URL = EXTERNAL_SUPABASE_URL;
