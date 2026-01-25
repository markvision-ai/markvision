-- Create automation_flows table if not exists
CREATE TABLE IF NOT EXISTS public.automation_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  flow_name TEXT, -- Название из n8n (используется для отображения)
  description TEXT,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'running', 'paused')),
  last_run TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  execution_time INTEGER,
  logs TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  trigger_type TEXT,
  webhook_url TEXT
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_automation_flows_project ON public.automation_flows(project_id);
CREATE INDEX IF NOT EXISTS idx_automation_flows_status ON public.automation_flows(status);

-- Enable RLS
ALTER TABLE public.automation_flows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_flows
CREATE POLICY "Users can view automation_flows for accessible projects" ON public.automation_flows
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage automation_flows for accessible projects" ON public.automation_flows
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_automation_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_flows_updated_at
BEFORE UPDATE ON public.automation_flows
FOR EACH ROW
EXECUTE FUNCTION update_automation_flows_updated_at();
