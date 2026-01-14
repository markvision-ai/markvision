
-- Таблица задач для ИИ-РОП
CREATE TABLE public.ai_rop_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
);

-- Таблица аудитов от ИИ-РОП
CREATE TABLE public.ai_rop_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score INTEGER NOT NULL DEFAULT 0,
  critical_errors JSONB DEFAULT '[]'::jsonb,
  growth_points JSONB DEFAULT '[]'::jsonb,
  bot_stats JSONB DEFAULT '{}'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индексы
CREATE INDEX idx_ai_rop_tasks_project ON public.ai_rop_tasks(project_id);
CREATE INDEX idx_ai_rop_tasks_status ON public.ai_rop_tasks(status);
CREATE INDEX idx_ai_rop_audits_project ON public.ai_rop_audits(project_id);
CREATE INDEX idx_ai_rop_audits_date ON public.ai_rop_audits(audit_date DESC);

-- RLS
ALTER TABLE public.ai_rop_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rop_audits ENABLE ROW LEVEL SECURITY;

-- Политики для ai_rop_tasks
CREATE POLICY "Users can view tasks for accessible projects" 
ON public.ai_rop_tasks FOR SELECT 
USING (
  project_id IN (
    SELECT project_id FROM public.project_access WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks for accessible projects" 
ON public.ai_rop_tasks FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT project_id FROM public.project_access WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks for accessible projects" 
ON public.ai_rop_tasks FOR UPDATE 
USING (
  project_id IN (
    SELECT project_id FROM public.project_access WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);

-- Политики для ai_rop_audits
CREATE POLICY "Users can view audits for accessible projects" 
ON public.ai_rop_audits FOR SELECT 
USING (
  project_id IN (
    SELECT project_id FROM public.project_access WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can create audits for accessible projects" 
ON public.ai_rop_audits FOR INSERT 
WITH CHECK (
  project_id IN (
    SELECT project_id FROM public.project_access WHERE user_id = auth.uid()
    UNION
    SELECT id FROM public.projects WHERE owner_id = auth.uid()
  )
);

-- Включение Realtime для задач
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_rop_tasks;
