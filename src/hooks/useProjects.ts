import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

  useEffect(() => {
    const fetchProjects = async () => {
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
    };

    fetchProjects();
  }, [user, isAdmin]);

  return {
    projects,
    currentProjectId,
    setCurrentProjectId,
    currentProject: projects.find(p => p.id === currentProjectId),
    loading,
  };
};
