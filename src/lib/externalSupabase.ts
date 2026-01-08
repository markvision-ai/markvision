import { createClient } from '@supabase/supabase-js';

// ПРИНУДИТЕЛЬНЫЕ ДАННЫЕ ВНЕШНЕЙ БАЗЫ pyscczcuersdjvpmkiec
const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

// DEBUG LOG при запуске
console.log('🚀 MVI Core connected to pyscczcu');
console.log('📡 URL:', SUPABASE_URL);
console.log('🔑 Key set:', SUPABASE_KEY ? 'YES' : 'NO');

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Функция проверки подключения
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Связь с базой pyscczcu установлена');
    return { ok: true };
  } catch (e: any) {
    console.error('❌ Ошибка связи с базой:', e.message);
    return { ok: false, error: e.message };
  }
};

// Очистка старого мусора
export const clearAuthData = () => {
  localStorage.clear();
  console.log('🧹 Все локальные данные сессии очищены');
};

export { SUPABASE_URL };
