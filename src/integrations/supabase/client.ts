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
      eventsPerSecond: 2,
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
