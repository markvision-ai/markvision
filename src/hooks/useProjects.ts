import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logError } from '@/lib/validation';

const LOCAL_STORAGE_KEY = 'activeProjectId';

interface Project {
  id: string;
  name: string;
  telegram_chat_id?: string | null;
  onboarding_status?: string | null;
}

export const useProjects = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();

  const isAdminUser = isAdmin;
  const isSuperAdminUser = isSuperAdmin;

  const [projects, setProjects] = useState<Project[]>([]);

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  });

  const [loading, setLoading] = useState(true);

  // Refs to prevent re-entry and avoid stale closure over currentProjectId
  const loadingRef = useRef(false);
  const currentProjectIdRef = useRef(currentProjectId);
  const didFetchRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  // Save currentProjectId to localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(LOCAL_STORAGE_KEY, currentProjectId);
    }
  }, [currentProjectId]);

  // fetchProjects does NOT depend on currentProjectId — reads from ref
  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Guard: prevent concurrent fetches
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      if (isSuperAdminUser) {
        const { data: allProjects, error: allError } = await supabase
          .from('projects')
          .select('id, name, telegram_chat_id, onboarding_status')
          .order('created_at', { ascending: false });
        if (allError) throw allError;

        setProjects(allProjects || []);

        if (!currentProjectIdRef.current && allProjects && allProjects.length > 0) {
          setCurrentProjectId(allProjects[0].id);
        }

        if (!didFetchRef.current) {
          console.log('[useProjects] Loaded', allProjects?.length ?? 0, 'projects (super_admin)');
          didFetchRef.current = true;
        }
        setLoading(false);
        return;
      }

      let projectsData: Project[] = [];

      if (isAdminUser) {
        const { data: allProjects, error: allError } = await supabase
          .from('projects')
          .select('id, name, telegram_chat_id, onboarding_status')
          .order('created_at', { ascending: false });

        if (!allError && allProjects) {
          projectsData = allProjects;
        }
      } else {
        const { data: accessData, error: accessError } = await supabase
          .from('project_access')
          .select('project_id')
          .eq('user_id', user.id);

        if (!accessError && accessData && accessData.length > 0) {
          const projectIds = accessData.map(a => a.project_id);
          const { data } = await supabase
            .from('projects')
            .select('id, name, telegram_chat_id, onboarding_status')
            .in('id', projectIds);

          projectsData = data || [];
        }
      }

      setProjects(projectsData);

      // Auto-select first project only if none currently selected
      if (projectsData.length > 0) {
        const savedProjectId = localStorage.getItem(LOCAL_STORAGE_KEY);
        const savedProjectExists = savedProjectId && projectsData.some(p => p.id === savedProjectId);

        if (savedProjectExists) {
          setCurrentProjectId(savedProjectId);
        } else if (!currentProjectIdRef.current) {
          const newProjectId = projectsData[0].id;
          setCurrentProjectId(newProjectId);
          localStorage.setItem(LOCAL_STORAGE_KEY, newProjectId);
        }
      }

      if (!didFetchRef.current) {
        console.log('[useProjects] Loaded', projectsData.length, 'projects');
        didFetchRef.current = true;
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
        return;
      }
      console.error('[useProjects] Critical error:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user, isAdminUser, isSuperAdminUser]);

  // Single fetch on mount / when user or role changes
  useEffect(() => {
    didFetchRef.current = false;
    fetchProjects();
  }, [fetchProjects]);

  const forceLoadProject = useCallback(() => {
    loadingRef.current = false; // allow re-fetch
    didFetchRef.current = false;
    fetchProjects();
    toast.success('Обновляю список проектов…');
  }, [fetchProjects]);

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

    loadingRef.current = false; // allow re-fetch
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
    loadingRef.current = false; // allow re-fetch
    await fetchProjects();
    return true;
  };

  const currentProject = projects.find(p => p.id === currentProjectId) || null;

  return {
    projects,
    currentProjectId,
    setCurrentProjectId,
    currentProject,
    loading,
    createProject,
    deleteProject,
    refetch: fetchProjects,
    forceLoadProject,
  };
};
