import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ЖЕСТКОЕ ПОДКЛЮЧЕНИЕ ВНЕШНЕЙ БАЗЫ (PYSCCZCU)
const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

// Твой основной Project ID
export const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
});

// Управление Realtime подключением
let reconnectAttempts = 0;
const MAX_RECONNECT_LOG = 3;

const channel = supabase.channel('leads-all');
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    reconnectAttempts = 0;
    if (import.meta.env.DEV) console.log('✅ Realtime: Connected to External Supabase');
  }
  if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
    reconnectAttempts++;
    if (reconnectAttempts <= MAX_RECONNECT_LOG && import.meta.env.DEV) {
      console.log(`⚠️ Realtime: Connection lost. Reconnecting to MarkVision DB... (attempt ${reconnectAttempts})`);
    }
    setTimeout(() => {
      channel.subscribe();
    }, 30000);
  }
});

// Лог для проверки в консоли браузера (только в DEV)
if (import.meta.env.DEV) console.log('🚀 Supabase: External MarkVision Database connected (pyscczcu)');
