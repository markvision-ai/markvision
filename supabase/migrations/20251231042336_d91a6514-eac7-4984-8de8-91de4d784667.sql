-- Create automation rules table for CRM workflow automation
CREATE TABLE public.crm_automation_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- 'status_change', 'time_based', 'new_lead'
    trigger_status TEXT, -- The status that triggers the rule (for status_change)
    action_type TEXT NOT NULL, -- 'webhook', 'telegram', 'whatsapp_ai', 'assign', 'status_change', 'reminder'
    action_config JSONB NOT NULL DEFAULT '{}', -- Configuration for the action
    conditions JSONB DEFAULT '{}', -- Additional conditions (e.g., time_in_status > 15 min)
    is_active BOOLEAN DEFAULT true,
    execution_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lead assignments table for round-robin distribution
CREATE TABLE public.lead_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    assigned_by TEXT, -- 'auto_round_robin', 'manual', 'ai'
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' -- 'pending', 'accepted', 'declined', 'expired'
);

-- Create scheduled reminders table
CREATE TABLE public.scheduled_reminders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    automation_rule_id UUID REFERENCES public.crm_automation_rules(id) ON DELETE SET NULL,
    reminder_type TEXT NOT NULL, -- 'appointment', 'follow_up', 'no_answer', 'overdue'
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    channel TEXT NOT NULL, -- 'telegram', 'whatsapp', 'sms', 'email'
    message_template TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create automation execution logs
CREATE TABLE public.automation_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    automation_rule_id UUID REFERENCES public.crm_automation_rules(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    action_result TEXT, -- 'success', 'failed', 'skipped'
    action_data JSONB,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add manager assignment and automation tracking to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_automation_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Enable RLS on new tables
ALTER TABLE public.crm_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_automation_rules
CREATE POLICY "Users can view automation rules for accessible projects"
ON public.crm_automation_rules FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Admins can manage automation rules"
ON public.crm_automation_rules FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_project_access(auth.uid(), project_id));

-- RLS policies for lead_assignments
CREATE POLICY "Users can view lead assignments for accessible projects"
ON public.lead_assignments FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage lead assignments for accessible projects"
ON public.lead_assignments FOR ALL
USING (has_project_access(auth.uid(), project_id));

-- RLS policies for scheduled_reminders
CREATE POLICY "Users can view reminders for accessible projects"
ON public.scheduled_reminders FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage reminders for accessible projects"
ON public.scheduled_reminders FOR ALL
USING (has_project_access(auth.uid(), project_id));

-- RLS policies for automation_logs
CREATE POLICY "Users can view automation logs for accessible projects"
ON public.automation_logs FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "System can insert automation logs"
ON public.automation_logs FOR INSERT
WITH CHECK (has_project_access(auth.uid(), project_id));

-- Add indexes for performance
CREATE INDEX idx_automation_rules_project ON public.crm_automation_rules(project_id);
CREATE INDEX idx_automation_rules_trigger ON public.crm_automation_rules(trigger_type, trigger_status);
CREATE INDEX idx_lead_assignments_lead ON public.lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_staff ON public.lead_assignments(staff_id);
CREATE INDEX idx_scheduled_reminders_scheduled ON public.scheduled_reminders(scheduled_for, status);
CREATE INDEX idx_automation_logs_lead ON public.automation_logs(lead_id);
CREATE INDEX idx_leads_assigned ON public.leads(assigned_to);
CREATE INDEX idx_leads_appointment ON public.leads(appointment_date);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_automation_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_reminders;

-- Insert default automation rules for the demo project
INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'Round Robin Distribution',
    'new_lead',
    'new',
    'assign',
    '{"method": "round_robin", "notify_telegram": true}'::jsonb,
    'Автоматическое распределение новых лидов между менеджерами',
    1
FROM public.projects p
LIMIT 1;

INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'Instant WhatsApp Response',
    'new_lead',
    'new',
    'whatsapp_ai',
    '{"delay_seconds": 10, "template": "greeting"}'::jsonb,
    'Мгновенный ответ в WhatsApp через ИИ',
    2
FROM public.projects p
LIMIT 1;

INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'Stale Lead Alert',
    'time_based',
    'new',
    'telegram',
    '{"minutes_threshold": 15, "message_template": "⚠️ Лид протухает! {lead_name} ждет уже {minutes} минут!"}'::jsonb,
    'Оповещение если лид не взят в работу 15 минут',
    3
FROM public.projects p
LIMIT 1;

INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'No Answer Recovery - 2h',
    'status_change',
    'no_answer',
    'whatsapp_ai',
    '{"delay_hours": 2, "template": "recovery_1"}'::jsonb,
    'Первое сообщение через 2 часа после недозвона',
    4
FROM public.projects p
LIMIT 1;

INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'Appointment Confirmation',
    'status_change',
    'appointment',
    'whatsapp_ai',
    '{"template": "appointment_confirm", "include_address": true}'::jsonb,
    'Подтверждение записи в WhatsApp',
    5
FROM public.projects p
LIMIT 1;

INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'Appointment Reminder 24h',
    'time_based',
    'appointment',
    'reminder',
    '{"hours_before": 24, "channel": "whatsapp"}'::jsonb,
    'Напоминание за 24 часа до записи',
    6
FROM public.projects p
LIMIT 1;

INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'Payment Success - CAPI',
    'status_change',
    'paid',
    'webhook',
    '{"url_env": "FACEBOOK_CAPI_URL", "event_name": "Purchase"}'::jsonb,
    'Отправка конверсии в Facebook CAPI',
    7
FROM public.projects p
LIMIT 1;

INSERT INTO public.crm_automation_rules (project_id, name, trigger_type, trigger_status, action_type, action_config, description, execution_order)
SELECT 
    p.id,
    'Review Request',
    'status_change',
    'paid',
    'whatsapp_ai',
    '{"delay_days": 3, "template": "review_request"}'::jsonb,
    'Запрос отзыва через 3 дня после оплаты',
    8
FROM public.projects p
LIMIT 1;