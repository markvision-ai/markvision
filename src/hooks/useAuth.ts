import { useState, useEffect, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// NOTE: Super admin status is now determined from the database user_roles table
// with role = 'super_admin'. No more hardcoded UIDs for security.

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role?: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  profile: UserProfile | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    isSuperAdmin: false,
    profile: null,
  });

  useEffect(() => {
    // E2E Test Mode Bypass
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.localStorage.getItem('E2E_TEST_MODE') === 'true') {
      const mockUser = {
        id: 'e2e-test-user',
        email: 'e2e@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };

      setAuthState({
        user: mockUser as any,
        session: { access_token: 'mock', token_type: 'bearer', user: mockUser } as any,
        loading: false,
        isAdmin: true,
        isSuperAdmin: true,
        profile: { id: 'e2e-test-user', name: 'E2E User', email: 'e2e@example.com' }
      });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;

        setAuthState(prev => ({
          ...prev,
          session,
          user: currentUser,
          loading: false,
        }));

        if (currentUser) {
          // Defer to avoid blocking auth flow
          setTimeout(() => {
            checkAdminRole(currentUser.id);
            fetchProfile(currentUser.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            isAdmin: false,
            isSuperAdmin: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;

      setAuthState(prev => ({
        ...prev,
        session,
        user: currentUser,
        loading: false,
      }));

      if (currentUser) {
        checkAdminRole(currentUser.id);
        fetchProfile(currentUser.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Try to get profile by user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch error:', error.message);

        // Create fallback profile from auth user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthState(prev => ({
            ...prev,
            profile: {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              email: user.email || null,
            },
          }));
        }
        return;
      }

      if (data) {
        setAuthState(prev => ({
          ...prev,
          profile: data,
        }));
      } else {
        // No profile found - use auth data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthState(prev => ({
            ...prev,
            profile: {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              email: user.email || null,
            },
          }));
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    }
  };

  /**
   * Check if user has admin or super_admin role in user_roles table.
   * Role management is now centralized in the database.
   */
  const checkAdminRole = async (userId: string) => {
    try {
      // Query for any admin-level role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Role check error:', error.message);
        // Default to non-admin on error
        setAuthState(prev => ({
          ...prev,
          isAdmin: false,
          isSuperAdmin: false,
        }));
        return;
      }

      // Check for admin-level roles (admin or super_admin)
      const role = data?.role as string | null;

      const isAdminRole = role === 'admin' || role === 'super_admin';
      const isSuperAdminRole = role === 'super_admin';

      if (import.meta.env.DEV) {
        console.log('🔐 Role check:', role || 'USER');
      }

      setAuthState(prev => ({
        ...prev,
        isAdmin: isAdminRole,
        isSuperAdmin: isSuperAdminRole,
      }));
    } catch (error) {
      console.error('Error checking admin role:', error);
      setAuthState(prev => ({
        ...prev,
        isAdmin: false,
        isSuperAdmin: false,
      }));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      session: null,
      loading: false,
      isAdmin: false,
      isSuperAdmin: false,
      profile: null,
    });
  };

  const memoizedReturn = useMemo(() => ({
    ...authState,
    signOut,
  }), [authState]);

  return memoizedReturn;
};
