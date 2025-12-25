-- Таблица конфигурации вебхуков
CREATE TABLE public.webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Уникальный токен для URL вебхука
  webhook_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  name TEXT NOT NULL DEFAULT 'Основной вебхук',
  
  -- Статус
  is_active BOOLEAN DEFAULT true,
  
  -- Маппинг полей (JSON с путями к полям)
  field_mapping JSONB NOT NULL DEFAULT '{
    "lead_id": "lead_info.id",
    "phone": "lead_info.phone",
    "email": "lead_info.email",
    "name": "lead_info.name",
    "utm_source": "utm_data.utm_source",
    "utm_medium": "utm_data.utm_medium",
    "utm_campaign": "utm_data.utm_campaign",
    "utm_content": "utm_data.utm_content",
    "utm_term": "utm_data.utm_term",
    "client_id": "analytics.client_id",
    "visit_id": "analytics.visit_id"
  }'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Сырые логи вебхуков
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  webhook_config_id UUID REFERENCES public.webhook_configs(id) ON DELETE SET NULL,
  
  -- Сырые данные
  raw_payload JSONB NOT NULL,
  headers JSONB,
  ip_address TEXT,
  
  -- Статус обработки
  status TEXT NOT NULL DEFAULT 'received', -- received, processed, error
  error_message TEXT,
  
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Обработанные лиды
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  webhook_log_id UUID REFERENCES public.webhook_logs(id) ON DELETE SET NULL,
  
  -- Идентификаторы
  external_lead_id TEXT,
  client_id TEXT,
  visit_id TEXT,
  
  -- Контактные данные
  phone TEXT,
  email TEXT,
  name TEXT,
  
  -- UTM метки
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Статус и сумма из CRM
  status TEXT DEFAULT 'new',
  deal_amount NUMERIC DEFAULT 0,
  
  -- Привязка к цепочке касаний
  touchpoint_chain_id TEXT,
  
  -- Дополнительные данные
  extra_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX idx_webhook_configs_project ON public.webhook_configs(project_id);
CREATE INDEX idx_webhook_configs_token ON public.webhook_configs(webhook_token);
CREATE INDEX idx_webhook_logs_project ON public.webhook_logs(project_id);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX idx_leads_project ON public.leads(project_id);
CREATE INDEX idx_leads_utm ON public.leads(utm_source, utm_medium, utm_campaign);
CREATE INDEX idx_leads_client ON public.leads(client_id);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);

-- RLS политики
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Webhook configs policies
CREATE POLICY "Deny anonymous access to webhook_configs" ON public.webhook_configs
  FOR ALL USING (false);

CREATE POLICY "Users can view configs for accessible projects" ON public.webhook_configs
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage configs for accessible projects" ON public.webhook_configs
  FOR ALL USING (has_project_access(auth.uid(), project_id));

-- Webhook logs policies
CREATE POLICY "Deny anonymous access to webhook_logs" ON public.webhook_logs
  FOR ALL USING (false);

CREATE POLICY "Users can view logs for accessible projects" ON public.webhook_logs
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

-- Leads policies
CREATE POLICY "Deny anonymous access to leads" ON public.leads
  FOR ALL USING (false);

CREATE POLICY "Users can view leads for accessible projects" ON public.leads
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage leads for accessible projects" ON public.leads
  FOR ALL USING (has_project_access(auth.uid(), project_id));

-- Функция для извлечения значения по JSON-пути
CREATE OR REPLACE FUNCTION public.extract_json_path(data JSONB, path TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts TEXT[];
  result JSONB := data;
  part TEXT;
BEGIN
  parts := string_to_array(path, '.');
  FOREACH part IN ARRAY parts
  LOOP
    IF result IS NULL THEN
      RETURN NULL;
    END IF;
    result := result -> part;
  END LOOP;
  RETURN result #>> '{}';
END;
$$;