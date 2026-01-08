import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1);
    if (error) throw error;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
};

// ВОТ ЭТА ФУНКЦИЯ БЫЛА НУЖНА ДЛЯ ОШИБКИ 404
export const clearAuthData = () => {
  localStorage.clear();
  if (import.meta.env.DEV) {
    console.log('🧹 Данные очищены');
  }
};

export { SUPABASE_URL };
