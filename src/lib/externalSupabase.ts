/**
 * External Supabase Client
 * Использует переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
 * Если они не заданы - использует внешнюю базу pyscczcuersdjvpmkiec
 */
import { createClient } from '@supabase/supabase-js';

// Получаем значения из переменных окружения
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fallback на внешнюю базу (если env переменные указывают на Lovable Cloud)
const EXTERNAL_URL = 'https://pyscczcuersdjvpmkiec.supabase.co';
// Ключ для внешней базы должен быть задан через VITE_EXTERNAL_SUPABASE_ANON_KEY
const EXTERNAL_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY || '';

// Определяем какую базу использовать
const useExternal = !envUrl || envUrl.includes('grzqykeg');
const SUPABASE_URL = useExternal && EXTERNAL_KEY ? EXTERNAL_URL : (envUrl || EXTERNAL_URL);
const SUPABASE_KEY = useExternal && EXTERNAL_KEY ? EXTERNAL_KEY : (envKey || '');

// Логируем подключение
console.log('🔌 Supabase подключение:', {
  url: SUPABASE_URL.substring(8, 35) + '...',
  hasKey: !!SUPABASE_KEY,
  source: useExternal && EXTERNAL_KEY ? 'external' : 'env'
});

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_KEY не задан! Авторизация не будет работать.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Функция проверки подключения к базе
export const checkConnection = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Ошибка подключения к БД:', error.message);
      return { ok: false, error: error.message };
    }
    console.log('✅ Подключение к БД успешно');
    return { ok: true };
  } catch (e: any) {
    console.error('❌ Ошибка подключения:', e.message);
    return { ok: false, error: e.message };
  }
};

// Функция очистки старых токенов
export const clearAuthData = () => {
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('🧹 Очищено', keysToRemove.length, 'ключей localStorage');
};

export { SUPABASE_URL };
