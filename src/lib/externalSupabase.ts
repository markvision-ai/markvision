/**
 * External Supabase Client
 * ПРИНУДИТЕЛЬНО подключается к pyscczcuersdjvpmkiec.supabase.co
 * Это единственная база данных для всего приложения
 */
import { createClient } from '@supabase/supabase-js';

// ПРИНУДИТЕЛЬНЫЙ URL внешней базы (НЕ использовать grzqykeg...)
const FALLBACK_URL = 'https://pyscczcuersdjvpmkiec.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1OTQ1NDAsImV4cCI6MjA1MjE3MDU0MH0.F1nJFwZAU6S4R5CfXxzBCnuVfWnwl-2gRsVZNbCbvh4';

// Используем env variables с fallback на внешнюю базу
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Проверка что используется правильная база
const isCorrectDatabase = supabaseUrl.includes('pyscczcuersdjvpmkiec');
if (!isCorrectDatabase) {
  console.warn('⚠️ Обнаружена неправильная база! Переключаюсь на pyscczcuersdjvpmkiec...');
}

// ВСЕГДА используем внешнюю базу
const FINAL_URL = isCorrectDatabase ? supabaseUrl : FALLBACK_URL;
const FINAL_KEY = isCorrectDatabase ? supabaseKey : FALLBACK_KEY;

console.log('✅ MarkVision подключен к базе:', FINAL_URL.substring(8, 30) + '...');

export const supabase = createClient(FINAL_URL, FINAL_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Export URL for edge functions if needed
export const SUPABASE_URL = FINAL_URL;
