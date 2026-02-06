import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  projectId: string;
  action: string;
  initiator: 'system' | 'user' | 'ai';
  initiatorName: string;
  statusBefore?: any;
  statusAfter?: any;
  details?: string;
  resultStatus?: 'success' | 'warning' | 'error';
  metadata?: any;
}

/**
 * Logs an action to the ai_audit_logs table.
 * Used for tracking AI (Mark/Claude) and System actions for security and audit purposes.
 */
export const logAuditAction = async (entry: AuditLogEntry) => {
  try {
    const { error } = await supabase
      .from('ai_audit_logs' as any)
      .insert({
        project_id: entry.projectId,
        action: entry.action,
        initiator: entry.initiator,
        initiator_name: entry.initiatorName,
        status_before: entry.statusBefore,
        status_after: entry.statusAfter,
        details: entry.details,
        result_status: entry.resultStatus || 'success',
        metadata: entry.metadata,
      });

    if (error) {
      console.error('Failed to write audit log:', error);
      // We don't throw here to avoid breaking the main flow if logging fails
    }
  } catch (err) {
    console.error('Exception writing audit log:', err);
  }
};

/**
 * Helper to log a "Mark" action (AI Agent)
 */
export const logAiAction = async (
  projectId: string,
  action: string,
  details?: string,
  resultStatus: 'success' | 'warning' | 'error' = 'success',
  metadata?: any
) => {
  return logAuditAction({
    projectId,
    action,
    initiator: 'ai',
    initiatorName: 'Mark',
    details,
    resultStatus,
    metadata
  });
};
