import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ЖЕСТКОЕ ПОДКЛЮЧЕНИЕ ВНЕШНЕЙ БАЗЫ (PYSCCZCU)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug log as requested by user
// console.log('DEBUG: VITE_SUPABASE_URL:', SUPABASE_URL ? 'Defined' : 'Undefined', SUPABASE_URL);

// Твой основной Project ID
export const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options) => {
      // Add connection log if not already logged
      if (!window['__supabase_logged'] && import.meta.env.DEV) {
         console.log('Connecting to Supabase at:', SUPABASE_URL);
         window['__supabase_logged'] = true;
      }
      return fetch(url, {
        ...options,
        cache: 'no-store',
      }).catch(err => {
        // Silently ignore AbortError to prevent console noise
        if (err.name === 'AbortError' || err.message === 'The user aborted a request.') {
          return new Response(JSON.stringify({ message: 'AbortError: Request aborted' }), { 
            status: 499, 
            statusText: 'Request Aborted',
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw err;
      });
    }
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

// Лог для проверки в консоли браузера
// console.log('🚀 Supabase: External MarkVision Database connected (pyscczcu)');
