import { createClient } from '@supabase/supabase-js';

// ТВОИ ЭТАЛОННЫЕ ДАННЫЕ
const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

console.log("🚀 MVI DEBUG: Подключение к базе Analitika...");

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'markvision-auth-token',
    storage: window.localStorage
  }
});

// ПРИНУДИТЕЛЬНОЕ ОБНУЛЕНИЕ ОШИБКИ ПОДКЛЮЧЕНИЯ
(window as any).VITE_SUPABASE_URL = SUPABASE_URL;
(window as any).VITE_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
