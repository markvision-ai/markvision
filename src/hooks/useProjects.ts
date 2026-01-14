import { useState, useEffect, useCallback } from 'react';
import { supabase, FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logError } from '@/lib/validation';

const LOCAL_STORAGE_KEY = 'activeProjectId';

// Super admin user ID
const SUPER_ADMIN_UID = 'd94043b0-1c76-4017-84de-df0dbf00a2c9';

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
      console.log('👑 Admin:', isAdmin, 'Super Admin:', isSuperAdmin);
      
      let projectsData: Project[] = [];

      // Super admin or admin - load all projects directly
      if (isSuperAdmin || isAdmin || user.id === SUPER_ADMIN_UID) {
        console.log('🔑 Admin mode - loading ALL projects');
        
        const { data: allProjects, error: allError } = await supabase
          .from('projects')
          .select('id, name, telegram_chat_id, onboarding_status')
          .order('created_at', { ascending: false });
        
        console.log('📋 Projects loaded:', allProjects?.length, 'Error:', allError?.message);
        
        if (allError) {
          console.error('Projects fetch error:', allError);
          // Fallback: try to load via project_access
          const { data: accessData } = await supabase
            .from('project_access')
            .select('project_id')
            .eq('user_id', user.id);
          
          if (accessData && accessData.length > 0) {
            const projectIds = accessData.map(a => a.project_id);
            const { data } = await supabase
              .from('projects')
              .select('id, name, telegram_chat_id, onboarding_status')
              .in('id', projectIds);
            projectsData = data || [];
          }
        } else {
          projectsData = allProjects || [];
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

      // If still no projects and we're admin, add the fallback project
      if (projectsData.length === 0 && (isAdmin || isSuperAdmin || user.id === SUPER_ADMIN_UID)) {
        console.log('⚠️ No projects found, using fallback project');
        projectsData = [{
          id: FALLBACK_PROJECT_ID,
          name: 'Святой проект',
          telegram_chat_id: null,
          onboarding_status: null,
        }];
      }

      setProjects(projectsData);

      // Set active project
      if (projectsData.length > 0) {
        const savedProjectId = localStorage.getItem(LOCAL_STORAGE_KEY);
        const savedProjectExists = savedProjectId && projectsData.some(p => p.id === savedProjectId);

        if (savedProjectExists) {
          setCurrentProjectId(savedProjectId);
          console.log('📌 Restored project from localStorage:', savedProjectId);
        } else {
          // Use first available project or fallback
          const newProjectId = projectsData[0].id;
          setCurrentProjectId(newProjectId);
          console.log('📌 Set active project:', newProjectId);
        }
      } else {
        setCurrentProjectId(null);
        console.log('⚠️ No available projects');
      }
    } catch (error) {
      console.error('❌ Critical error loading projects:', error);
      
      // Fallback for admin users
      if (isAdmin || isSuperAdmin || user.id === SUPER_ADMIN_UID) {
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
  }, [user, isAdmin, isSuperAdmin]);

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
