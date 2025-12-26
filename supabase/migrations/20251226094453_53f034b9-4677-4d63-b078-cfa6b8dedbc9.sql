-- Create audit_logs table for security auditing
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  project_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Require authentication for audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can insert their own audit logs
CREATE POLICY "Users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Prevent updates and deletes (audit logs should be immutable)
CREATE POLICY "Deny updates to audit_logs"
ON public.audit_logs
FOR UPDATE
USING (false);

CREATE POLICY "Deny deletes to audit_logs"
ON public.audit_logs
FOR DELETE
USING (false);

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Security audit log tracking all user actions in the system';