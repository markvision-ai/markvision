-- 1. Create table for lead tasks/reminders
CREATE TABLE public.lead_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_tasks
CREATE POLICY "Users can view tasks for leads in their projects"
ON public.lead_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.project_access pa ON pa.project_id = l.project_id
    WHERE l.id = lead_tasks.lead_id AND pa.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.projects p ON p.id = l.project_id
    WHERE l.id = lead_tasks.lead_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert tasks for leads in their projects"
ON public.lead_tasks
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.project_access pa ON pa.project_id = l.project_id
      WHERE l.id = lead_tasks.lead_id AND pa.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.projects p ON p.id = l.project_id
      WHERE l.id = lead_tasks.lead_id AND p.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own tasks"
ON public.lead_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.lead_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_lead_tasks_lead_id ON public.lead_tasks(lead_id);
CREATE INDEX idx_lead_tasks_due_date ON public.lead_tasks(due_date) WHERE completed = false;
CREATE INDEX idx_lead_tasks_user_id ON public.lead_tasks(user_id);

-- 2. Create table for lead status history
CREATE TABLE public.lead_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_name TEXT,
  deal_amount_change NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_status_history
CREATE POLICY "Users can view history for leads in their projects"
ON public.lead_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.project_access pa ON pa.project_id = l.project_id
    WHERE l.id = lead_status_history.lead_id AND pa.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.projects p ON p.id = l.project_id
    WHERE l.id = lead_status_history.lead_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can insert history for leads in their projects"
ON public.lead_status_history
FOR INSERT
WITH CHECK (
  auth.uid() = changed_by
  AND (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.project_access pa ON pa.project_id = l.project_id
      WHERE l.id = lead_status_history.lead_id AND pa.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.projects p ON p.id = l.project_id
      WHERE l.id = lead_status_history.lead_id AND p.owner_id = auth.uid()
    )
  )
);

-- Index
CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);

-- 3. Add file_url column to lead_messages for attachments
ALTER TABLE public.lead_messages ADD COLUMN file_url TEXT;
ALTER TABLE public.lead_messages ADD COLUMN file_name TEXT;
ALTER TABLE public.lead_messages ADD COLUMN file_type TEXT;

-- 4. Create storage bucket for lead attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-attachments',
  'lead-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Anyone can view lead attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'lead-attachments');

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lead-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_status_history;