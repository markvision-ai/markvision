import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Используем переменные окружения, которые мы только что прописали в Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

console.log("MARKVISION_AUTH: Инициализация клиента для базы:", supabaseUrl);
