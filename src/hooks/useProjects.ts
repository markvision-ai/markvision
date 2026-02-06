import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logError } from '@/lib/validation';

const LOCAL_STORAGE_KEY = 'activeProjectId';

// NOTE: Super admin status is now determined from the database user_roles table
// No more hardcoded UIDs for security.

// HARDCODED fallback project for admins - ALWAYS available
const ADMIN_FALLBACK_PROJECT = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'MARKVISION ГЛОБАЛ (АКТИВЕН)',
  telegram_chat_id: null,
  onboarding_status: 'active',
};

interface Project {
  id: string;
  name: string;
  telegram_chat_id?: string | null;
  onboarding_status?: string | null;
}

export const useProjects = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  
  // Use isSuperAdmin from auth hook (database-driven)
  const isSuperAdminUser = isSuperAdmin;
  
  // For super admin - INITIALIZE with fallback project immediately
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  });
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save currentProjectId to localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(LOCAL_STORAGE_KEY, currentProjectId);
      console.log('📦 CURRENT PROJECT ID:', currentProjectId);
    }
  }, [currentProjectId]);

  // CRITICAL: Ensure super admin always has projects
  useEffect(() => {
    if (isSuperAdminUser && projects.length === 0) {
      console.log('🛡️ SUPER ADMIN: Forcing fallback project');
      setProjects([ADMIN_FALLBACK_PROJECT]);
      setCurrentProjectId(ADMIN_FALLBACK_PROJECT.id);
      setLoading(false);
    }
  }, [isSuperAdminUser, projects.length]);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Cancel previous request
    // We don't abort anymore to avoid console errors
    // if (abortControllerRef.current) {
    //   abortControllerRef.current.abort();
    // }
    // abortControllerRef.current = new AbortController();
    // const signal = abortControllerRef.current.signal;

    // CRITICAL: Super admin bypass - set fallback immediately
    if (isSuperAdminUser) {
      console.log('👑 SUPER ADMIN: Instant access granted');
      
      // Still try to fetch from DB in background
      try {
        const { data: allProjects } = await supabase
          .from('projects')
          .select('id, name, telegram_chat_id, onboarding_status')
          .order('created_at', { ascending: false });
          // .abortSignal(signal);
        
        if (allProjects && allProjects.length > 0) {
          // Merge with fallback - ensure fallback is always first
          const hasAdminProject = allProjects.some(p => p.id === ADMIN_FALLBACK_PROJECT.id);
          const mergedProjects = hasAdminProject 
            ? allProjects 
            : [ADMIN_FALLBACK_PROJECT, ...allProjects];
          
          setProjects(mergedProjects);
          console.log('📋 Super admin projects loaded:', mergedProjects.length);
        } else {
          // No projects from DB - use fallback
          setProjects([ADMIN_FALLBACK_PROJECT]);
        }
      } catch (e: any) {
        if (e.name === 'AbortError' || e.message?.includes('AbortError') || e.message?.includes('aborted')) {
          // Ignore abort errors
          return;
        }
        console.error('DB fetch failed, using fallback:', e);
        setProjects([ADMIN_FALLBACK_PROJECT]);
      }
      
      // Ensure active project is set
      if (!currentProjectId) {
        setCurrentProjectId(ADMIN_FALLBACK_PROJECT.id);
      }
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading projects for user:', user.email, 'ID:', user.id);
      
      let projectsData: Project[] = [];

      if (isAdmin || isSuperAdmin) {
        const { data: allProjects, error: allError } = await supabase
          .from('projects')
          .select('id, name, telegram_chat_id, onboarding_status')
          .order('created_at', { ascending: false });
          // .abortSignal(signal);
        
        if (!allError && allProjects) {
          projectsData = allProjects;
        }
      } else {
        // Regular user - load via project_access
        const { data: accessData, error: accessError } = await supabase
          .from('project_access')
          .select('project_id')
          .eq('user_id', user.id);
          // .abortSignal(signal);

        if (!accessError && accessData && accessData.length > 0) {
          const projectIds = accessData.map(a => a.project_id);
          const { data } = await supabase
            .from('projects')
            .select('id, name, telegram_chat_id, onboarding_status')
            .in('id', projectIds);
            // .abortSignal(signal);

          projectsData = data || [];
        }
      }

      // Fallback for admin if no projects
      if (projectsData.length === 0 && isAdmin) {
        projectsData = [{
          id: FALLBACK_PROJECT_ID,
          name: 'Святой проект',
          telegram_chat_id: null,
          onboarding_status: null,
        }];
      }

      setProjects(projectsData);

      // Auto-select first project
      if (projectsData.length > 0) {
        const savedProjectId = localStorage.getItem(LOCAL_STORAGE_KEY);
        const savedProjectExists = savedProjectId && projectsData.some(p => p.id === savedProjectId);

        if (savedProjectExists) {
          setCurrentProjectId(savedProjectId);
        } else {
          const newProjectId = projectsData[0].id;
          setCurrentProjectId(newProjectId);
          localStorage.setItem(LOCAL_STORAGE_KEY, newProjectId);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
        // Ignore abort errors
        return;
      }
      console.error('❌ Critical error loading projects:', error);
      
      if (isSuperAdminUser) {
        setProjects([ADMIN_FALLBACK_PROJECT]);
        setCurrentProjectId(ADMIN_FALLBACK_PROJECT.id);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isSuperAdmin, isSuperAdminUser, currentProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // FORCE LOAD function for manual trigger
  const forceLoadProject = useCallback(() => {
    console.log('🔧 FORCE LOAD PROJECT triggered');
    setProjects([ADMIN_FALLBACK_PROJECT]);
    setCurrentProjectId(ADMIN_FALLBACK_PROJECT.id);
    localStorage.setItem(LOCAL_STORAGE_KEY, ADMIN_FALLBACK_PROJECT.id);
    setLoading(false);
    toast.success('Проект принудительно загружен');
  }, []);

  const createProject = async (name: string): Promise<{ id: string; name: string } | null> => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return null;
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      toast.error('Название проекта должно быть от 1 до 100 символов');
      return null;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: trimmedName,
        onboarding_status: 'pending',
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      logError('Create project failed', error);
      toast.error('Ошибка при создании проекта');
      return null;
    }

    await supabase.from('project_access').insert({
      project_id: data.id,
      user_id: user.id,
    });

    await fetchProjects();
    setCurrentProjectId(data.id);
    return { id: data.id, name: data.name };
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      logError('Delete project failed', error);
      toast.error('Ошибка при удалении проекта');
      return false;
    }

    toast.success('Проект удалён');
    await fetchProjects();
    return true;
  };

  const currentProject = projects.find(p => p.id === currentProjectId) || 
    (isSuperAdminUser ? ADMIN_FALLBACK_PROJECT : null);
  
  if (currentProject && import.meta.env.DEV) {
    console.log('🎯 CURRENT PROJECT:', currentProject.name, '| ID:', currentProject.id);
  }

  return {
    projects: projects.length > 0 ? projects : (isSuperAdminUser ? [ADMIN_FALLBACK_PROJECT] : []),
    currentProjectId: currentProjectId || (isSuperAdminUser ? ADMIN_FALLBACK_PROJECT.id : null),
    setCurrentProjectId,
    currentProject: currentProject || (isSuperAdminUser ? ADMIN_FALLBACK_PROJECT : null),
    loading: isSuperAdminUser ? false : loading, // NEVER loading for super admin
    createProject,
    deleteProject,
    refetch: fetchProjects,
    forceLoadProject, // New function for manual trigger
  };
};
