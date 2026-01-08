import { createClient } from '@supabase/supabase-js';

// ПРИНУДИТЕЛЬНОЕ ПОДКЛЮЧЕНИЕ К ВНЕШНЕЙ БАЗЕ pyscczcuersdjvpmkiec
const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1OTQ1NDAsImV4cCI6MjA1MjE3MDU0MH0.F1nJFwZAU6S4R5CfXxzBCnuVfWnwl-2gRsVZNbCbvh4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'markvision-auth-token',
    storage: window.localStorage
  }
});

// Debug log при запуске
console.log("🚀 MVI Core connected to pyscczcu");
console.log("📡 Client URL:", SUPABASE_URL);
