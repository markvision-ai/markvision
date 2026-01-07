import { createClient } from '@supabase/supabase-js';

// ПРИНУДИТЕЛЬНЫЙ ВЫХОД ИЗ ЛОВБАЛ КЛАУД
const REAL_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const REAL_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

export const supabase = createClient(REAL_URL, REAL_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'markvision-auth-token',
    storage: window.localStorage
  }
});

// Этот лог поможет нам в консоли увидеть, что код реально изменился
console.log("MARKVISION: Система принудительно подключена к", REAL_URL);
