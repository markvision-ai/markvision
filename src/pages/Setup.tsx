import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Loader2 } from 'lucide-react';

const Setup = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOrCreateProject = async () => {
      if (!user) return;

      try {
        // Check if user has any projects
        const { data: existingProjects, error: fetchError } = await supabase
          .from('projects')
          .select('id, name, onboarding_status')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (existingProjects && existingProjects.length > 0) {
          const project = existingProjects[0];
          
          // If onboarding is completed, redirect to dashboard
          if (project.onboarding_status === 'completed') {
            navigate('/dashboard', { replace: true });
            return;
          }
          
          // Otherwise, show onboarding for this project
          setProjectId(project.id);
          setProjectName(project.name);
        } else {
          // Create a new project for the user
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              owner_id: user.id,
              name: 'Новый проект',
              onboarding_status: 'pending'
            })
            .select()
            .single();

          if (createError) throw createError;
          
          setProjectId(newProject.id);
          setProjectName(newProject.name);
        }
      } catch (error) {
        console.error('Error in setup:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      checkOrCreateProject();
    } else if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleComplete = () => {
    navigate('/dashboard', { replace: true });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Full-screen onboarding - no sidebar, no header
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-primary/5">
      <OnboardingWizard
        projectId={projectId}
        projectName={projectName}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default Setup;

