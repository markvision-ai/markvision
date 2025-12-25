import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  owner_id: string;
}

export const useProjects = () => {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*');

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    setProjects(data || []);
    
    // Set first project as default
    if (data && data.length > 0 && !currentProjectId) {
      setCurrentProjectId(data[0].id);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string): Promise<boolean> => {
    if (!user) {
      toast.error('Необходимо авторизоваться');
      return false;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      toast.error('Ошибка при создании проекта');
      return false;
    }

    // Also add project access for the creator
    await supabase.from('project_access').insert({
      project_id: data.id,
      user_id: user.id,
    });

    toast.success('Проект создан');
    await fetchProjects();
    setCurrentProjectId(data.id);
    return true;
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
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
