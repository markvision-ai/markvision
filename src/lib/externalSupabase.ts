// Re-export from main client for backwards compatibility
export { 
  supabase, 
  FALLBACK_PROJECT_ID 
} from '@/integrations/supabase/client';

// Alias for backwards compatibility
export { supabase as externalSupabase } from '@/integrations/supabase/client';

// Connection check function
export const checkConnection = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  try {
    const { data, error } = await supabase.from('projects').select('count').limit(1);
    if (error) throw error;
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
};

// Clear session data
export const clearAuthData = () => {
  localStorage.removeItem('sb-grzqykegqgglekcxdtsu-auth-token');
  console.log('🧹 Session cleared');
};
