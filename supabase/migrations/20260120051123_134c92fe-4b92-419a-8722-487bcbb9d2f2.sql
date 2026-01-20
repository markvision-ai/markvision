-- Fix RLS for plan_data to allow project owners and users with project_access
DROP POLICY IF EXISTS "Users with permission can manage plans" ON public.plan_data;
DROP POLICY IF EXISTS "Users can view plans for accessible projects" ON public.plan_data;

-- Allow users with project access to view plan data
CREATE POLICY "Users can view plans for accessible projects" 
ON public.plan_data 
FOR SELECT 
USING (has_project_access(auth.uid(), project_id));

-- Allow users with project access to insert plan data
CREATE POLICY "Users can insert plans for accessible projects" 
ON public.plan_data 
FOR INSERT 
WITH CHECK (has_project_access(auth.uid(), project_id));

-- Allow users with project access to update plan data
CREATE POLICY "Users can update plans for accessible projects" 
ON public.plan_data 
FOR UPDATE 
USING (has_project_access(auth.uid(), project_id));

-- Allow admins to delete plan data
CREATE POLICY "Admins can delete plans" 
ON public.plan_data 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure the project 11111111-1111-1111-1111-111111111111 exists in projects table
INSERT INTO public.projects (id, name, owner_id, onboarding_status)
VALUES ('11111111-1111-1111-1111-111111111111', 'MARKVISION ГЛОБАЛ', '00000000-0000-0000-0000-000000000000', 'active')
ON CONFLICT (id) DO UPDATE SET name = 'MARKVISION ГЛОБАЛ';