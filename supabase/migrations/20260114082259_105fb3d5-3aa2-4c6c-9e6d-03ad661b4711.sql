-- Create system_health table for monitoring integrations
CREATE TABLE public.system_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  last_check_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_alerts table for incidents
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.system_health(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'warning',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_health
CREATE POLICY "Users can view system health for their projects"
  ON public.system_health FOR SELECT
  USING (public.has_project_access(project_id, auth.uid()));

CREATE POLICY "Users can manage system health for their projects"
  ON public.system_health FOR ALL
  USING (public.has_project_access(project_id, auth.uid()));

-- RLS policies for system_alerts
CREATE POLICY "Users can view alerts for their projects"
  ON public.system_alerts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.system_health sh
    WHERE sh.id = system_alerts.service_id
    AND public.has_project_access(sh.project_id, auth.uid())
  ));

CREATE POLICY "Users can manage alerts for their projects"
  ON public.system_alerts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.system_health sh
    WHERE sh.id = system_alerts.service_id
    AND public.has_project_access(sh.project_id, auth.uid())
  ));

-- Enable realtime for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_health;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_alerts;

-- Create updated_at trigger
CREATE TRIGGER update_system_health_updated_at
  BEFORE UPDATE ON public.system_health
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();