import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// SUPER ADMIN - полный доступ без проверок RLS
const SUPER_ADMIN_UIDS = [
  'd94043b0-1c76-4017-84de-df0dbf00a2c9', // Original
  'ab433b01-06a8-46a6-b1d6-3461e442fe77', // Юрий zapoinov@bk.ru
];

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        const isSuperAdmin = currentUser ? SUPER_ADMIN_UIDS.includes(currentUser.id) : false;
        
        setAuthState(prev => ({
          ...prev,
          session,
          user: currentUser,
          loading: false,
          // Super admin is always admin
          isAdmin: isSuperAdmin ? true : prev.isAdmin,
          isSuperAdmin,
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
      const isSuperAdmin = currentUser ? SUPER_ADMIN_UIDS.includes(currentUser.id) : false;
      
      setAuthState(prev => ({
        ...prev,
        session,
        user: currentUser,
        loading: false,
        isAdmin: isSuperAdmin ? true : prev.isAdmin,
        isSuperAdmin,
      }));

      if (currentUser) {
        checkAdminRole(currentUser.id);
        fetchProfile(currentUser.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    // CRITICAL: Super admin bypass - never block
    const isSuperAdminUser = SUPER_ADMIN_UIDS.includes(userId);
    
    try {
      // Try to get profile by user_id
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch error:', error.message);
        // For super admin - create fallback profile, never block
        if (isSuperAdminUser) {
          setAuthState(prev => ({
            ...prev,
            profile: {
              id: userId,
              name: 'Super Admin',
              email: 'zapoinov@bk.ru',
            },
            isAdmin: true,
            isSuperAdmin: true,
          }));
          return;
        }
        
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
        // CRITICAL: Super admin is NEVER inactive, regardless of DB status
        if (isSuperAdminUser) {
          setAuthState(prev => ({
            ...prev,
            profile: {
              ...data,
              // Override any inactive status for super admin
            },
            isAdmin: true,
            isSuperAdmin: true,
          }));
          console.log('👑 Super admin profile loaded - full access granted');
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: data,
          }));
        }
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
            // Super admin always gets access
            isAdmin: isSuperAdminUser ? true : prev.isAdmin,
            isSuperAdmin: isSuperAdminUser,
          }));
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // CRITICAL: Super admin never fails
      if (isSuperAdminUser) {
        setAuthState(prev => ({
          ...prev,
          profile: {
            id: userId,
            name: 'Super Admin',
            email: 'zapoinov@bk.ru',
          },
          isAdmin: true,
          isSuperAdmin: true,
        }));
      }
    }
  };

  /**
   * Check if user has admin role in user_roles table.
   * Super admin is always granted admin privileges.
   */
  const checkAdminRole = async (userId: string) => {
    // Super admin always has admin role
    if (SUPER_ADMIN_UIDS.includes(userId)) {
      setAuthState(prev => ({
        ...prev,
        isAdmin: true,
        isSuperAdmin: true,
      }));
      console.log('👑 Super Admin detected:', userId);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.warn('Role check error:', error.message);
        // Default to non-admin on error
        setAuthState(prev => ({
          ...prev,
          isAdmin: false,
        }));
        return;
      }

      const hasAdminRole = !!data;
      console.log('🔐 Admin role check:', hasAdminRole ? 'ADMIN' : 'USER');
      
      setAuthState(prev => ({
        ...prev,
        isAdmin: hasAdminRole,
      }));
    } catch (error) {
      console.error('Error checking admin role:', error);
      setAuthState(prev => ({
        ...prev,
        isAdmin: false,
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

  return {
    ...authState,
    signOut,
  };
};
