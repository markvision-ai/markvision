import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// NOTE: Super admin status is now determined from the database user_roles table
// No more hardcoded UIDs for security.

export interface UserPermissions {
  can_edit_plan: boolean;
  can_edit_daily_data: boolean;
  can_view_sales: boolean;
  can_view_revenue: boolean;
  can_manage_leads: boolean;
  can_export_data: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  can_edit_plan: false,
  can_edit_daily_data: true,
  can_view_sales: false,
  can_view_revenue: false,
  can_manage_leads: true,
  can_export_data: false,
};

const ADMIN_PERMISSIONS: UserPermissions = {
  can_edit_plan: true,
  can_edit_daily_data: true,
  can_view_sales: true,
  can_view_revenue: true,
  can_manage_leads: true,
  can_export_data: true,
};

export const usePermissions = (projectId: string | null) => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user || !projectId) {
      setPermissions(DEFAULT_PERMISSIONS);
      setLoading(false);
      return;
    }

    // Super admin and admins get full permissions (from database)
    if (isSuperAdmin || isAdmin) {
      console.log('👑 Admin permissions granted');
      setPermissions(ADMIN_PERMISSIONS);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching permissions:', error);
        setPermissions(DEFAULT_PERMISSIONS);
      } else if (data) {
        setPermissions({
          can_edit_plan: data.can_edit_plan,
          can_edit_daily_data: data.can_edit_daily_data,
          can_view_sales: data.can_view_sales,
          can_view_revenue: data.can_view_revenue,
          can_manage_leads: data.can_manage_leads,
          can_export_data: data.can_export_data,
        });
      } else {
        setPermissions(DEFAULT_PERMISSIONS);
      }
    } catch (error) {
      console.error('Permissions error:', error);
      setPermissions(DEFAULT_PERMISSIONS);
    }

    setLoading(false);
  }, [user, projectId, isAdmin, isSuperAdmin]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    refetch: fetchPermissions,
    // Convenience getters
    canEditPlan: permissions.can_edit_plan,
    canEditDailyData: permissions.can_edit_daily_data,
    canViewSales: permissions.can_view_sales,
    canViewRevenue: permissions.can_view_revenue,
    canManageLeads: permissions.can_manage_leads,
    canExportData: permissions.can_export_data,
  };
};

// Hook to manage permissions for team members (admin only)
export const useManagePermissions = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();

  const getPermissionsForUser = async (userId: string, projectId: string): Promise<UserPermissions | null> => {
    const { data, error } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      can_edit_plan: data.can_edit_plan,
      can_edit_daily_data: data.can_edit_daily_data,
      can_view_sales: data.can_view_sales,
      can_view_revenue: data.can_view_revenue,
      can_manage_leads: data.can_manage_leads,
      can_export_data: data.can_export_data,
    };
  };

  const updatePermissions = async (
    userId: string, 
    projectId: string, 
    permissions: Partial<UserPermissions>
  ): Promise<boolean> => {
    // Only admins can update permissions (from database)
    if (!isAdmin && !isSuperAdmin) return false;

    // Check if record exists
    const { data: existing } = await supabase
      .from('user_permissions')
      .select('id')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_permissions')
        .update(permissions)
        .eq('user_id', userId)
        .eq('project_id', projectId);

      return !error;
    } else {
      const { error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: userId,
          project_id: projectId,
          ...DEFAULT_PERMISSIONS,
          ...permissions,
        });

      return !error;
    }
  };

  const setAllPermissionsForProject = async (
    userId: string,
    projectId: string,
    permissions: UserPermissions
  ): Promise<boolean> => {
    return updatePermissions(userId, projectId, permissions);
  };

  return {
    getPermissionsForUser,
    updatePermissions,
    setAllPermissionsForProject,
  };
};
