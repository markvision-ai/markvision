// Этот файл больше не создает свой клиент, чтобы не было конфликтов
import { supabase } from '../integrations/supabase/client';
export { supabase };

// Функция проверки для совместимости
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('leads').select('count').limit(1);
    if (error) throw error;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
};

export const clearAuthData = () => {
  localStorage.clear();
  console.log('🧹 Сессия очищена');
};
