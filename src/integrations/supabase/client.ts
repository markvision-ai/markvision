import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Используем Lovable Cloud Supabase
const SUPABASE_URL = "https://grzqykegqgglekcxdtsu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyenF5a2VncWdnbGVrY3hkdHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMDQzMjYsImV4cCI6MjA4MTY4MDMyNn0.4kUfyFD6I5RR6xRjO4R2uSY9hlb0x1suGeNrkUxVaIg";

// Default project ID for fallback scenarios
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

// Realtime connection management with silent reconnection
let reconnectAttempts = 0;
const MAX_RECONNECT_LOG = 3;

const channel = supabase.channel('leads-all');
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    reconnectAttempts = 0;
    console.log('✅ Realtime: Connected');
  }
  if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
    reconnectAttempts++;
    if (reconnectAttempts <= MAX_RECONNECT_LOG) {
      console.log(`⚠️ Realtime: Connection lost. Reconnecting in 30s... (attempt ${reconnectAttempts})`);
    }
    setTimeout(() => {
      channel.subscribe();
    }, 30000);
  }
});

console.log('🔗 Supabase: Lovable Cloud connected');
