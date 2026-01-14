import { useState, useEffect, useCallback } from 'react';
import { supabase, FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logError } from '@/lib/validation';

const LOCAL_STORAGE_KEY = 'activeProjectId';

// Super admin user ID - полный доступ без ограничений
const SUPER_ADMIN_UID = 'd94043b0-1c76-4017-84de-df0dbf00a2c9';

// Hardcoded fallback project for super admin
const ADMIN_FALLBACK_PROJECT = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'MARKVISION ГЛОБАЛ (НОВЫЙ)',
  telegram_chat_id: null,
  onboarding_status: null,
};

interface Project {
  id: string;
  name: string;
  telegram_chat_id?: string | null;
  onboarding_status?: string | null;
}

export const useProjects = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  });
  const [loading, setLoading] = useState(true);

  // Super admin bypass check
  const isSuperAdminUser = user?.id === SUPER_ADMIN_UID || isSuperAdmin;

  // Save currentProjectId to localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(LOCAL_STORAGE_KEY, currentProjectId);
      console.log('📦 CURRENT PROJECT ID:', currentProjectId);
    }
  }, [currentProjectId]);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading projects for user:', user.email, 'ID:', user.id);
      console.log('👑 Admin:', isAdmin, 'Super Admin:', isSuperAdminUser);
      
      let projectsData: Project[] = [];

      // Super admin or admin - load all projects directly WITHOUT RLS filters
      if (isSuperAdminUser || isAdmin) {
        console.log('🔑 SUPER ADMIN mode - loading ALL projects');
        
        const { data: allProjects, error: allError } = await supabase
          .from('projects')
          .select('id, name, telegram_chat_id, onboarding_status')
          .order('created_at', { ascending: false });
        
        console.log('📋 Projects loaded:', allProjects?.length, 'Error:', allError?.message);
        
        if (allError) {
          console.error('Projects fetch error:', allError);
          // For super admin - always show fallback
          if (isSuperAdminUser) {
            console.log('⚡ Super admin fallback activated');
            projectsData = [ADMIN_FALLBACK_PROJECT];
          }
        } else {
          projectsData = allProjects || [];
          
          // Ensure admin fallback project is in the list
          if (isSuperAdminUser && !projectsData.find(p => p.id === ADMIN_FALLBACK_PROJECT.id)) {
            console.log('➕ Adding admin fallback project to list');
            projectsData.unshift(ADMIN_FALLBACK_PROJECT);
          }
        }
      } else {
        // Regular user - load via project_access
        console.log('🔐 User mode - loading accessible projects');
        
        const { data: accessData, error: accessError } = await supabase
          .from('project_access')
          .select('project_id')
          .eq('user_id', user.id);

        console.log('🔐 Project access:', accessData?.length, 'Error:', accessError?.message);

        if (!accessError && accessData && accessData.length > 0) {
          const projectIds = accessData.map(a => a.project_id);
          const { data, error } = await supabase
            .from('projects')
            .select('id, name, telegram_chat_id, onboarding_status')
            .in('id', projectIds);

          if (!error && data) {
            projectsData = data;
          }
        }
      }

      console.log('📋 Total projects:', projectsData.length, projectsData.map(p => p.name));

      // CRITICAL: If still no projects and we're super admin, ALWAYS add fallback
      if (projectsData.length === 0) {
        if (isSuperAdminUser) {
          console.log('⚠️ Super admin has no projects - forcing fallback');
          projectsData = [ADMIN_FALLBACK_PROJECT, {
            id: FALLBACK_PROJECT_ID,
            name: 'Святой проект',
            telegram_chat_id: null,
            onboarding_status: null,
          }];
        } else if (isAdmin) {
          projectsData = [{
            id: FALLBACK_PROJECT_ID,
            name: 'Святой проект',
            telegram_chat_id: null,
            onboarding_status: null,
          }];
        }
      }

      setProjects(projectsData);

      // CRITICAL: Set active project - auto-select first if none selected
      if (projectsData.length > 0) {
        const savedProjectId = localStorage.getItem(LOCAL_STORAGE_KEY);
        const savedProjectExists = savedProjectId && projectsData.some(p => p.id === savedProjectId);

        if (savedProjectExists) {
          setCurrentProjectId(savedProjectId);
          console.log('📌 Restored project from localStorage:', savedProjectId);
        } else {
          // CRITICAL FIX: Always auto-select first project
          const newProjectId = projectsData[0].id;
          setCurrentProjectId(newProjectId);
          localStorage.setItem(LOCAL_STORAGE_KEY, newProjectId);
          console.log('📌 AUTO-SELECTED first project:', projectsData[0].name, newProjectId);
        }
      } else {
        // Even with no projects, super admin gets fallback
        if (isSuperAdminUser) {
          setCurrentProjectId(ADMIN_FALLBACK_PROJECT.id);
          console.log('📌 Super admin fallback project activated');
        } else {
          setCurrentProjectId(null);
          console.log('⚠️ No available projects');
        }
      }
    } catch (error) {
      console.error('❌ Critical error loading projects:', error);
      
      // CRITICAL: Super admin always gets access
      if (isSuperAdminUser) {
        console.log('🛡️ Super admin error recovery - using fallback');
        setProjects([ADMIN_FALLBACK_PROJECT]);
        setCurrentProjectId(ADMIN_FALLBACK_PROJECT.id);
      } else if (isAdmin) {
        setProjects([{
          id: FALLBACK_PROJECT_ID,
          name: 'Святой проект',
          telegram_chat_id: null,
          onboarding_status: null,
        }]);
        setCurrentProjectId(FALLBACK_PROJECT_ID);
      } else {
        setCurrentProjectId(null);
        setProjects([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, isSuperAdminUser]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string): Promise<string | null> => {
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

    // Add project access for the creator
    await supabase.from('project_access').insert({
      project_id: data.id,
      user_id: user.id,
    });

    await fetchProjects();
    setCurrentProjectId(data.id);
    return data.id;
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

  const currentProject = projects.find(p => p.id === currentProjectId);
  
  if (currentProject && import.meta.env.DEV) {
    console.log('🎯 CURRENT PROJECT:', currentProject.name, '| ID:', currentProject.id);
  }

  return {
    projects,
    currentProjectId,
    setCurrentProjectId,
    currentProject,
    loading,
    createProject,
    deleteProject,
    refetch: fetchProjects,
  };
};
