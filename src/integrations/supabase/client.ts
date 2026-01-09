import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 5, // Снижаем частоту, чтобы бесплатный тариф Supabase не обрывал связь
    },
    timeout: 30000, // Увеличиваем ожидание до 30 секунд (было 10)
  },
  global: {
    headers: { 'x-application-name': 'markvision-crm' },
  },
});

// МОНИТОРИНГ СОЕДИНЕНИЯ (Вы увидите это в консоли браузера)
const channel = supabase.channel('db-changes');
channel
  .on('system', { event: '*' }, (payload) => {
    console.log('📡 Realtime System Message:', payload);
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ ПОДКЛЮЧЕНО К ОБЛАКУ: Живая связь с базой установлена');
    }
    if (status === 'CLOSED') {
      console.warn('⚠️ СВЯЗЬ ПРЕРВАНА: Попытка автоматического восстановления...');
    }
    if (status === 'CHANNEL_ERROR') {
      console.error('❌ ОШИБКА КАНАЛА: Проверьте права доступа (RLS) в Supabase');
    }
  });

export const createLeadSimple = async (leadData: any) => {
  const { data, error } = await supabase.from('leads').insert([leadData]);
  if (error) {
    console.error("MVI_ERROR:", error.message);
    throw error;
  }
  return data;
};
