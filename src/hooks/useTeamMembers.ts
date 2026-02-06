import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logError } from '@/lib/validation';

export interface TeamMember {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: 'admin' | 'manager';
  status: 'active' | 'pending' | 'inactive';
  projectAccess: string[];
  createdAt: string;
}

export const useTeamMembers = () => {
  const { user, isAdmin } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Fetch profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');

    if (profilesError) {
      logError('Fetch profiles failed', profilesError);
      setLoading(false);
      return;
    }

    // Fetch roles for all users
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      logError('Fetch roles failed', rolesError);
    }

    // Fetch project access for all users
    const { data: projectAccess, error: accessError } = await supabase
      .from('project_access')
      .select('*');

    if (accessError) {
      logError('Fetch project access failed', accessError);
    }

    // Combine data
    const members: TeamMember[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.user_id);
      const userProjects = (projectAccess || [])
        .filter(pa => pa.user_id === profile.user_id)
        .map(pa => pa.project_id);

      return {
        id: profile.id,
        user_id: profile.user_id,
        name: profile.name,
        email: profile.email,
        role: (userRole?.role as 'admin' | 'manager') || 'manager',
        status: profile.status as 'active' | 'pending' | 'inactive',
        projectAccess: userProjects,
        createdAt: profile.created_at.split('T')[0],
      };
    });

    setTeamMembers(members);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const updateMemberRole = async (userId: string, role: 'admin' | 'manager'): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Только администраторы могут изменять роли');
      return false;
    }

    // Check if role exists
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) {
        logError('Update role failed', error);
        toast.error('Ошибка при обновлении роли');
        return false;
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        logError('Insert role failed', error);
        toast.error('Ошибка при назначении роли');
        return false;
      }
    }

    toast.success('Роль обновлена');
    await fetchTeamMembers();
    return true;
  };

  const updateMemberStatus = async (userId: string, status: 'active' | 'pending' | 'inactive'): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Только администраторы могут изменять статус');
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('user_id', userId);

    if (error) {
      logError('Update status failed', error);
      toast.error('Ошибка при обновлении статуса');
      return false;
    }

    toast.success('Статус обновлён');
    await fetchTeamMembers();
    return true;
  };

  const updateProjectAccess = async (userId: string, projectIds: string[]): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Только администраторы могут управлять доступом');
      return false;
    }

    // Remove existing access
    const { error: deleteError } = await supabase
      .from('project_access')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      logError('Remove access failed', deleteError);
      toast.error('Ошибка при обновлении доступа');
      return false;
    }

    // Add new access
    if (projectIds.length > 0) {
      const { error: insertError } = await supabase
        .from('project_access')
        .insert(projectIds.map(projectId => ({ user_id: userId, project_id: projectId })));

      if (insertError) {
        logError('Add access failed', insertError);
        toast.error('Ошибка при обновлении доступа');
        return false;
      }
    }

    toast.success('Доступ обновлён');
    await fetchTeamMembers();
    return true;
  };

  const deleteMember = async (userId: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Только администраторы могут удалять сотрудников');
      return false;
    }

    // Remove project access first
    await supabase.from('project_access').delete().eq('user_id', userId);
    
    // Remove role
    await supabase.from('user_roles').delete().eq('user_id', userId);
    
    // Update profile status to inactive (we can't delete auth users from client)
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'inactive' })
      .eq('user_id', userId);

    if (error) {
      logError('Deactivate member failed', error);
      toast.error('Ошибка при удалении сотрудника');
      return false;
    }

    toast.success('Сотрудник деактивирован');
    await fetchTeamMembers();
    return true;
  };

  return {
    teamMembers,
    loading,
    refetch: fetchTeamMembers,
    updateMemberRole,
    updateMemberStatus,
    updateProjectAccess,
    deleteMember,
  };
};
