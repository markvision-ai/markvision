// DEPRECATED: Используй src/integrations/supabase/client.ts
// Этот файл оставлен для обратной совместимости

export { 
  supabase, 
  SUPER_ADMIN_UID, 
  SUPER_ADMIN_EMAIL, 
  FALLBACK_PROJECT_ID 
} from '@/integrations/supabase/client';

// Алиас для обратной совместимости
export { supabase as externalSupabase } from '@/integrations/supabase/client';

// Проверка является ли пользователь Super Admin
export const isSuperAdmin = (userId?: string | null, email?: string | null): boolean => {
  return userId === 'd94043b0-1c76-4017-84de-df0dbf00a2c9' || email === 'zapoinov@bk.ru';
};

// Функция проверки подключения
export const checkConnection = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1);
    if (error) throw error;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
};

// Очистка сессии
export const clearAuthData = () => {
  localStorage.removeItem('sb-pyscczcuersdjvpmkiec-auth-token');
  localStorage.removeItem('external-supabase-auth');
  console.log('🧹 Сессия очищена');
};

console.log('🔗 Supabase клиент: https://pyscczcuersdjvpmkiec.supabase.co');
