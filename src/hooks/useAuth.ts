import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    profile: null,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({ 
            ...prev, 
            profile: null, 
            isAdmin: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      if (session?.user) {
        checkAdminRole(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setAuthState(prev => ({
          ...prev,
          profile: data,
        }));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching profile:', error);
      }
    }
  };

  /**
   * NOTE: The isAdmin flag is for UI/UX purposes only (e.g., showing/hiding admin controls).
   * All actual security enforcement happens server-side via RLS policies using the 
   * has_role() SECURITY DEFINER function. Never rely solely on this client-side flag
   * for security-critical operations.
   */
  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      setAuthState(prev => ({
        ...prev,
        isAdmin: !!data,
      }));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking admin role:', error);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      session: null,
      loading: false,
      isAdmin: false,
      profile: null,
    });
  };

  return {
    ...authState,
    signOut,
  };
};
