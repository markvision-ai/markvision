import { createClient } from '@supabase/supabase-js';

// ПРИНУДИТЕЛЬНО используем ВНЕШНИЙ Supabase (Analitika)
// НЕ Lovable Cloud!
const EXTERNAL_SUPABASE_URL = 'https://pyscczcuersdjvpmkiec.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k';

// Super Admin для обхода RLS
export const SUPER_ADMIN_UID = 'd94043b0-1c76-4017-84de-df0dbf00a2c9';
export const SUPER_ADMIN_EMAIL = 'zapoinov@bk.ru';
export const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const supabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
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

// Realtime connection management with silent reconnection
let reconnectAttempts = 0;
const MAX_RECONNECT_LOG = 3; // Only log first 3 reconnect attempts

const channel = supabase.channel('leads-all');
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    reconnectAttempts = 0;
    console.log('✅ Realtime: Connected');
  }
  if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
    reconnectAttempts++;
    // Silent reconnect - only log first few attempts to avoid console spam
    if (reconnectAttempts <= MAX_RECONNECT_LOG) {
      console.log(`⚠️ Realtime: Connection lost. Reconnecting in 30s... (attempt ${reconnectAttempts})`);
    }
    setTimeout(() => {
      channel.subscribe();
    }, 30000);
  }
});
