// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Extract only used tables to reduce type complexity and fix "Type instantiation is excessively deep" error
type UsedTables = 
  | 'ab_tests'
  | 'ad_accounts'
  | 'automation_flows'
  | 'audit_logs'
  | 'daily_data'
  | 'instagram_content_stats'
  | 'integrations'
  | 'knowledge_base'
  | 'lead_messages'
  | 'lead_tasks'
  | 'leads'
  | 'marketing_stats'
  | 'profiles'
  | 'project_access'
  | 'project_context'
  | 'projects'
  | 'scoring_rules'
  | 'staff'
  | 'transactions'
  | 'user_roles';

export type LightweightDatabase = {
  public: {
    Tables: Pick<Database['public']['Tables'], UsedTables>
    Views: Database['public']['Views']
    Functions: Database['public']['Functions']
    Enums: Database['public']['Enums']
    CompositeTypes: Database['public']['CompositeTypes']
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize lightweight client
export const supabase = createClient<LightweightDatabase>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url, options) => {
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
  }
});
