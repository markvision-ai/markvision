import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ПРИНУДИТЕЛЬНЫЕ НАСТРОЙКИ (Hardcoded)
// Мы прописываем их здесь текстом, чтобы Lovable Cloud не мог подменить их своими значениями.
const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

// Создаем клиент с расширенными настройками для Realtime и Auth
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage, // Явное указание на использование памяти браузера
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-application-name': 'markvision' },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Логирование в консоль для проверки (потом можно будет удалить)
console.log("MVI_DEBUG: Подключено к внешней базе:", SUPABASE_URL);
