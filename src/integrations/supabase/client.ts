import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    }
  }
});

// ЛОГИКА УМНОГО ПЕРЕПОДКЛЮЧЕНИЯ (30 СЕКУНД)
const channel = supabase.channel('leads-realtime');

channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('✅ Realtime: ПОДКЛЮЧЕНО. Ждем изменений...');
  }
  if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
    console.warn('⚠️ Realtime: Связь потеряна. Следующая попытка через 30 секунд...');
    // Отключаем старый канал и пробуем через 30 сек
    supabase.removeChannel(channel);
    setTimeout(() => {
      window.location.reload(); // Самый надежный способ "встряхнуть" Realtime на Vercel
    }, 30000);
  }
});

export const createLeadSimple = async (leadData: any) => {
  const { data, error } = await supabase.from('leads').insert([{
    ...leadData,
    project_id: '64c94e87-630c-470e-8ab1-8f7c8c835efa' // Всегда шлем правильный ID
  }]);
  return { data, error };
};
