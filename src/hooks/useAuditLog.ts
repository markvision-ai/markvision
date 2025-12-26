import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Json } from '@/integrations/supabase/types';

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'status_change'
  | 'permission_change'
  | 'role_change'
  | 'project_access_grant'
  | 'project_access_revoke'
  | 'password_reset'
  | 'file_upload'
  | 'file_delete';

export type EntityType = 
  | 'user'
  | 'lead'
  | 'project'
  | 'campaign'
  | 'daily_data'
  | 'plan_data'
  | 'webhook_config'
  | 'report_template'
  | 'ad_asset'
  | 'message'
  | 'task'
  | 'permission'
  | 'role'
  | 'file'
  | 'session';

interface AuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  projectId?: string;
  oldValues?: Json;
  newValues?: Json;
}

export const useAuditLog = () => {
  const { user, profile } = useAuth();

  const logAction = useCallback(async ({
    action,
    entityType,
    entityId,
    projectId,
    oldValues,
    newValues,
  }: AuditLogParams) => {
    if (!user) {
      console.warn('Cannot log audit action: user not authenticated');
      return;
    }

    try {
      const logEntry = {
        user_id: user.id,
        user_email: user.email || null,
        user_name: profile?.name || user.email?.split('@')[0] || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        project_id: projectId || null,
        old_values: oldValues || null,
        new_values: newValues || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      };

      const { error } = await supabase.from('audit_logs').insert([logEntry]);

      if (error) {
        console.error('Failed to log audit action:', error);
      }
    } catch (err) {
      console.error('Audit logging error:', err);
    }
  }, [user, profile]);

  // Convenience methods for common actions
  const logCreate = useCallback((entityType: EntityType, entityId: string, projectId?: string, newValues?: Json) => {
    return logAction({ action: 'create', entityType, entityId, projectId, newValues });
  }, [logAction]);

  const logUpdate = useCallback((entityType: EntityType, entityId: string, projectId?: string, oldValues?: Json, newValues?: Json) => {
    return logAction({ action: 'update', entityType, entityId, projectId, oldValues, newValues });
  }, [logAction]);

  const logDelete = useCallback((entityType: EntityType, entityId: string, projectId?: string, oldValues?: Json) => {
    return logAction({ action: 'delete', entityType, entityId, projectId, oldValues });
  }, [logAction]);

  const logStatusChange = useCallback((entityType: EntityType, entityId: string, projectId?: string, oldStatus?: string, newStatus?: string) => {
    return logAction({ 
      action: 'status_change', 
      entityType, 
      entityId, 
      projectId, 
      oldValues: { status: oldStatus } as Json,
      newValues: { status: newStatus } as Json
    });
  }, [logAction]);

  const logLogin = useCallback(() => {
    return logAction({ action: 'login', entityType: 'session' });
  }, [logAction]);

  const logLogout = useCallback(() => {
    return logAction({ action: 'logout', entityType: 'session' });
  }, [logAction]);

  const logExport = useCallback((entityType: EntityType, projectId?: string, details?: Json) => {
    return logAction({ action: 'export', entityType, projectId, newValues: details });
  }, [logAction]);

  const logPermissionChange = useCallback((userId: string, projectId: string, oldPermissions?: Json, newPermissions?: Json) => {
    return logAction({ 
      action: 'permission_change', 
      entityType: 'permission', 
      entityId: userId, 
      projectId, 
      oldValues: oldPermissions,
      newValues: newPermissions
    });
  }, [logAction]);

  const logRoleChange = useCallback((userId: string, oldRole?: string, newRole?: string) => {
    return logAction({ 
      action: 'role_change', 
      entityType: 'role', 
      entityId: userId,
      oldValues: { role: oldRole } as Json,
      newValues: { role: newRole } as Json
    });
  }, [logAction]);

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logStatusChange,
    logLogin,
    logLogout,
    logExport,
    logPermissionChange,
    logRoleChange,
  };
};
