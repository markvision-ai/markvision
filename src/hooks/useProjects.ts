import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logError } from '@/lib/validation';

interface Project {
  id: string;
  name: string;
  owner_id: string;
  telegram_chat_id?: string | null;
}

export const useProjects = () => {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*');

      if (error) {
        logError('Fetch projects failed', error);
        setLoading(false);
        return;
      }

      setProjects(data || []);
      
      // Set first project as default
      if (data && data.length > 0 && !currentProjectId) {
        setCurrentProjectId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  return {
    projects,
    currentProjectId,
    setCurrentProjectId,
    currentProject: projects.find(p => p.id === currentProjectId),
    loading,
    createProject,
    deleteProject,
    refetch: fetchProjects,
  };
};
