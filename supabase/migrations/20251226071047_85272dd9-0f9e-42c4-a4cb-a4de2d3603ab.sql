-- Create user permissions table for granular access control
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  can_edit_plan BOOLEAN NOT NULL DEFAULT false,
  can_edit_daily_data BOOLEAN NOT NULL DEFAULT true,
  can_view_sales BOOLEAN NOT NULL DEFAULT false,
  can_view_revenue BOOLEAN NOT NULL DEFAULT false,
  can_manage_leads BOOLEAN NOT NULL DEFAULT true,
  can_export_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to user_permissions"
ON public.user_permissions
AS RESTRICTIVE
FOR ALL
USING (false);

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all permissions
CREATE POLICY "Admins can manage all permissions"
ON public.user_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create function to check specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _project_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      -- Admins have all permissions
      WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'admin') THEN true
      -- Check specific permission
      WHEN _permission = 'edit_plan' THEN COALESCE((SELECT can_edit_plan FROM user_permissions WHERE user_id = _user_id AND project_id = _project_id), false)
      WHEN _permission = 'edit_daily_data' THEN COALESCE((SELECT can_edit_daily_data FROM user_permissions WHERE user_id = _user_id AND project_id = _project_id), true)
      WHEN _permission = 'view_sales' THEN COALESCE((SELECT can_view_sales FROM user_permissions WHERE user_id = _user_id AND project_id = _project_id), false)
      WHEN _permission = 'view_revenue' THEN COALESCE((SELECT can_view_revenue FROM user_permissions WHERE user_id = _user_id AND project_id = _project_id), false)
      WHEN _permission = 'manage_leads' THEN COALESCE((SELECT can_manage_leads FROM user_permissions WHERE user_id = _user_id AND project_id = _project_id), true)
      WHEN _permission = 'export_data' THEN COALESCE((SELECT can_export_data FROM user_permissions WHERE user_id = _user_id AND project_id = _project_id), false)
      ELSE false
    END
$$;

-- Update plan_data RLS to allow users with edit_plan permission
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plan_data;

CREATE POLICY "Users with permission can manage plans"
ON public.plan_data
FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR 
  has_permission(auth.uid(), project_id, 'edit_plan')
);

-- Add trigger for updated_at
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();