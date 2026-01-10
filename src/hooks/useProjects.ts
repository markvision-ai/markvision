import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logError } from '@/lib/validation';

// ID известного проекта для fallback
const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';
const ADMIN_EMAIL = 'zapoinov@bk.ru';
const LOCAL_STORAGE_KEY = 'activeProjectId';

interface Project {
  id: string;
  name: string;
  owner_id: string;
  telegram_chat_id?: string | null;
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
      if (import.meta.env.DEV) {
        console.log('🔍 Загружаем проекты для пользователя:', user.email);
      }

      // Сначала пробуем получить все проекты (для админа)
      const isAdminUser = user.email === ADMIN_EMAIL || isAdmin;
      
      let projectsData: Project[] = [];

      if (isAdminUser) {
        // Админ видит все проекты
        const { data, error } = await supabase
          .from('projects')
          .select('*');

        if (error) {
          if (import.meta.env.DEV) {
            console.error('❌ Ошибка получения проектов (админ):', error);
          }
        } else {
          projectsData = data || [];
        }
      } else {
        // Обычный пользователь - проверяем project_access
        const { data: accessData, error: accessError } = await supabase
          .from('project_access')
          .select('project_id')
          .eq('user_id', user.id);

        if (!accessError && accessData && accessData.length > 0) {
          const projectIds = accessData.map(a => a.project_id);
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds);

          if (!error && data) {
            projectsData = data;
          }
        }
      }

      if (import.meta.env.DEV) {
        console.log('📋 Найдено проектов:', projectsData.length);
      }

      // Если проектов нет, пробуем получить fallback проект напрямую
      if (projectsData.length === 0) {
        if (import.meta.env.DEV) {
          console.log('⚠️ Проектов не найдено, пробуем fallback проект:', FALLBACK_PROJECT_ID);
        }

        const { data: fallbackProject, error: fallbackError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', FALLBACK_PROJECT_ID)
          .maybeSingle();

        if (!fallbackError && fallbackProject) {
          projectsData = [fallbackProject];
          if (import.meta.env.DEV) {
            console.log('✅ Fallback проект найден:', fallbackProject.name);
          }
        } else if (import.meta.env.DEV) {
          console.error('❌ Fallback проект не найден:', fallbackError);
        }
      }

      setProjects(projectsData);

      // Устанавливаем активный проект
      if (projectsData.length > 0) {
        const savedProjectId = localStorage.getItem(LOCAL_STORAGE_KEY);
        const savedProjectExists = savedProjectId && projectsData.some(p => p.id === savedProjectId);

        if (savedProjectExists) {
          setCurrentProjectId(savedProjectId);
          if (import.meta.env.DEV) {
            console.log('📌 Восстановлен проект из localStorage:', savedProjectId);
          }
        } else {
          // Приоритет fallback проекту
          const fallbackExists = projectsData.some(p => p.id === FALLBACK_PROJECT_ID);
          const newProjectId = fallbackExists ? FALLBACK_PROJECT_ID : projectsData[0].id;
          setCurrentProjectId(newProjectId);
          if (import.meta.env.DEV) {
            console.log('📌 Установлен активный проект:', newProjectId);
          }
        }
      } else {
        // Даже если проектов нет, устанавливаем fallback ID для попытки загрузки данных
        setCurrentProjectId(FALLBACK_PROJECT_ID);
        if (import.meta.env.DEV) {
          console.log('⚠️ Принудительно установлен fallback проект ID:', FALLBACK_PROJECT_ID);
        }
      }
    } catch (error) {
      logError('Fetch projects failed', error);
      // В случае ошибки также пробуем fallback
      setCurrentProjectId(FALLBACK_PROJECT_ID);
      if (import.meta.env.DEV) {
        console.error('❌ Критическая ошибка загрузки проектов, используем fallback:', error);
      }
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
        owner_id: user.id,
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
  
  if (import.meta.env.DEV && currentProject) {
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
