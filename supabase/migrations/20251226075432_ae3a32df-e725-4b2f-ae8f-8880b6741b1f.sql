-- Create table for lead chat messages
CREATE TABLE public.lead_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing messages (users with project access)
CREATE POLICY "Users can view messages for leads in their projects"
ON public.lead_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.project_access pa ON pa.project_id = l.project_id
    WHERE l.id = lead_messages.lead_id AND pa.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.leads l
    JOIN public.projects p ON p.id = l.project_id
    WHERE l.id = lead_messages.lead_id AND p.owner_id = auth.uid()
  )
);

-- Create policy for inserting messages
CREATE POLICY "Users can insert messages for leads in their projects"
ON public.lead_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.project_access pa ON pa.project_id = l.project_id
      WHERE l.id = lead_messages.lead_id AND pa.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.projects p ON p.id = l.project_id
      WHERE l.id = lead_messages.lead_id AND p.owner_id = auth.uid()
    )
  )
);

-- Create policy for deleting own messages
CREATE POLICY "Users can delete their own messages"
ON public.lead_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_lead_messages_lead_id ON public.lead_messages(lead_id);
CREATE INDEX idx_lead_messages_created_at ON public.lead_messages(created_at);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_messages;