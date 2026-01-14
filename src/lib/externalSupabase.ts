import { createClient } from '@supabase/supabase-js';

// Внешний Supabase - ПРИНУДИТЕЛЬНОЕ использование
const EXTERNAL_SUPABASE_URL = 'https://pyscczcuersdjvpmkiec.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDY1MjksImV4cCI6MjA2NTEyMjUyOX0.d7Djf3Uvl2S5DjECCR8XUWUiAetNEP1xT8El7Nn3GpY';

// Super Admin для обхода RLS
export const SUPER_ADMIN_UID = 'd94043b0-1c76-4017-84de-df0dbf00a2c9';
export const SUPER_ADMIN_EMAIL = 'zapoinov@bk.ru';
export const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

// Создаём ВНЕШНИЙ клиент Supabase
export const externalSupabase = createClient(
  EXTERNAL_SUPABASE_URL,
  EXTERNAL_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'external-supabase-auth',
    },
  }
);

// Экспортируем как основной клиент для использования во всём приложении
export const supabase = externalSupabase;

// Функция проверки подключения
export const checkConnection = async () => {
  try {
    const { data, error } = await externalSupabase.from('projects').select('count').limit(1);
    if (error) throw error;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
};

// Проверка является ли пользователь Super Admin
export const isSuperAdmin = (userId?: string | null, email?: string | null): boolean => {
  return userId === SUPER_ADMIN_UID || email === SUPER_ADMIN_EMAIL;
};

// Очистка сессии
export const clearAuthData = () => {
  localStorage.removeItem('external-supabase-auth');
  localStorage.clear();
  console.log('🧹 Сессия очищена');
};

console.log('🔗 Supabase клиент инициализирован:', EXTERNAL_SUPABASE_URL);
