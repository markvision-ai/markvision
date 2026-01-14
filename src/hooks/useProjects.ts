import { useState, useEffect, useCallback } from 'react';
import { supabase, FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
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
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    // Восстанавливаем из localStorage при инициализации
    return localStorage.getItem(LOCAL_STORAGE_KEY);
  });
  const [loading, setLoading] = useState(true);

  // Сохраняем currentProjectId в localStorage при изменении
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(LOCAL_STORAGE_KEY, currentProjectId);
      if (import.meta.env.DEV) {
        console.log('📦 ТЕКУЩИЙ ПРОЕКТ ID:', currentProjectId);
      }
    }
  }, [currentProjectId]);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Загружаем проекты для пользователя:', user.email, 'ID:', user.id);
      console.log('👑 Admin role:', isAdmin);
      
      let projectsData: Project[] = [];

      // For admin users - try to load all accessible projects
      if (isAdmin) {
        console.log('🔑 Admin режим - загружаем все доступные проекты');
        
        // Admins can access all projects via RLS has_project_access() which includes admin check
        const { data: allProjects, error: allError } = await supabase
          .from('projects')
          .select('id, name, telegram_chat_id, onboarding_status');
        
        console.log('📋 Проекты:', allProjects, 'Ошибка:', allError);
        
        if (allProjects && allProjects.length > 0) {
          projectsData = allProjects;
        }
      } else {
        // Regular user - check project_access
        const { data: accessData, error: accessError } = await supabase
          .from('project_access')
          .select('project_id')
          .eq('user_id', user.id);

        console.log('🔐 Project access:', accessData, 'Ошибка:', accessError);

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

      console.log('📋 Итого проектов:', projectsData.length, projectsData);

      setProjects(projectsData);

      // Устанавливаем активный проект
      if (projectsData.length > 0) {
        const savedProjectId = localStorage.getItem(LOCAL_STORAGE_KEY);
        const savedProjectExists = savedProjectId && projectsData.some(p => p.id === savedProjectId);

        if (savedProjectExists) {
          setCurrentProjectId(savedProjectId);
          console.log('📌 Восстановлен проект из localStorage:', savedProjectId);
        } else {
          // Use first available project
          const newProjectId = projectsData[0].id;
          setCurrentProjectId(newProjectId);
          console.log('📌 Установлен активный проект:', newProjectId);
        }
      } else {
        setCurrentProjectId(null);
        console.log('⚠️ Нет доступных проектов');
      }
    } catch (error) {
      console.error('❌ Критическая ошибка загрузки проектов:', error);
      setCurrentProjectId(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string): Promise<string | null> => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return null;
    }

    // Validate project name
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
      })
      .select()
      .single();

    if (error) {
      logError('Create project failed', error);
      toast.error('Ошибка при создании проекта');
      return null;
    }

    // Also add project access for the creator
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

  // Debug: выводим текущий проект в консоль при изменении
  const currentProject = projects.find(p => p.id === currentProjectId);
  
  if (currentProject && import.meta.env.DEV) {
    console.log('🎯 ТЕКУЩИЙ ПРОЕКТ:', currentProject.name, '| ID:', currentProject.id);
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
