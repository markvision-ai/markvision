import { createClient } from '@supabase/supabase-js';

const url = "https://pyscczcuersdjvpmkiec.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

export const supabase = createClient(url, key, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 2, // Снижаем нагрузку
    }
  }
});

// Умная подписка: если ошибка — ждем 30 секунд
const channel = supabase.channel('leads-all');
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') console.log('✅ Realtime: Connected');
  if (status === 'CLOSED') {
    console.log('⚠️ Realtime: Connection lost. Retrying in 30s...');
    setTimeout(() => channel.subscribe(), 30000);
  }
});
