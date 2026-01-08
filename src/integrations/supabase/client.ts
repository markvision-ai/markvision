import { createClient } from '@supabase/supabase-js';

const url = "https://pyscczcuersdjvpmkiec.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";

export const supabase = createClient(url, key, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
