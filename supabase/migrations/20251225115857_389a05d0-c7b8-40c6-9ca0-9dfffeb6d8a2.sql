-- Enum для источников трафика
CREATE TYPE public.traffic_source AS ENUM (
  'direct',
  'organic',
  'paid_search',
  'paid_social',
  'email',
  'referral',
  'retargeting',
  'display',
  'video',
  'affiliate',
  'sms',
  'other'
);

-- Enum для моделей атрибуции
CREATE TYPE public.attribution_model AS ENUM (
  'first_click',
  'last_click',
  'last_paid_click',
  'linear',
  'u_shape',
  'time_decay',
  'time_growth',
  'custom'
);

-- Таблица визитов (сессий)
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT NOT NULL,
  
  -- UTM метки
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  
  -- Источник
  source_type traffic_source NOT NULL DEFAULT 'direct',
  referrer TEXT,
  landing_page TEXT,
  
  -- Устройство
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  
  -- Гео
  country TEXT,
  city TEXT,
  region TEXT,
  
  -- Время
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 1,
  
  -- Флаги
  is_bounce BOOLEAN DEFAULT false,
  is_conversion BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица цепочек касаний (touchpoints)
CREATE TABLE public.touchpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  
  -- Позиция в цепочке
  position INTEGER NOT NULL,
  total_in_chain INTEGER NOT NULL,
  is_first BOOLEAN DEFAULT false,
  is_last BOOLEAN DEFAULT false,
  
  -- Источник касания
  source_type traffic_source NOT NULL,
  channel_name TEXT NOT NULL,
  campaign_name TEXT,
  keyword TEXT,
  
  -- Данные сделки
  deal_status TEXT,
  deal_revenue NUMERIC DEFAULT 0,
  deal_profit NUMERIC DEFAULT 0,
  
  touched_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Таблица результатов атрибуции
CREATE TABLE public.attribution_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Период расчета
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Модель атрибуции
  model attribution_model NOT NULL,
  
  -- Канал/источник
  channel_name TEXT NOT NULL,
  source_type traffic_source,
  campaign_name TEXT,
  keyword TEXT,
  
  -- Метрики
  visits INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  
  -- Атрибутированные значения (с учетом модели)
  attributed_leads NUMERIC DEFAULT 0,
  attributed_sales NUMERIC DEFAULT 0,
  attributed_revenue NUMERIC DEFAULT 0,
  attributed_profit NUMERIC DEFAULT 0,
  
  -- Расчетные метрики
  cpl NUMERIC DEFAULT 0,
  cac NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  
  -- Ассоциированные конверсии
  assisted_conversions INTEGER DEFAULT 0,
  
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Настройки кастомной модели атрибуции
CREATE TABLE public.custom_attribution_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  first_touch_weight NUMERIC NOT NULL DEFAULT 40,
  last_touch_weight NUMERIC NOT NULL DEFAULT 40,
  middle_touches_weight NUMERIC NOT NULL DEFAULT 20,
  
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(project_id, name)
);

-- Индексы для производительности
CREATE INDEX idx_visits_project_client ON public.visits(project_id, client_id);
CREATE INDEX idx_visits_project_date ON public.visits(project_id, visited_at);
CREATE INDEX idx_visits_source ON public.visits(source_type, utm_source);
CREATE INDEX idx_touchpoints_project_deal ON public.touchpoints(project_id, deal_id);
CREATE INDEX idx_touchpoints_channel ON public.touchpoints(channel_name, source_type);
CREATE INDEX idx_attribution_results_project ON public.attribution_results(project_id, period_start, period_end);
CREATE INDEX idx_attribution_results_model ON public.attribution_results(model, channel_name);

-- RLS политики
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_attribution_settings ENABLE ROW LEVEL SECURITY;

-- Visits policies
CREATE POLICY "Deny anonymous access to visits" ON public.visits
  FOR ALL USING (false);

CREATE POLICY "Users can view visits for accessible projects" ON public.visits
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert visits for accessible projects" ON public.visits
  FOR INSERT WITH CHECK (has_project_access(auth.uid(), project_id));

-- Touchpoints policies
CREATE POLICY "Deny anonymous access to touchpoints" ON public.touchpoints
  FOR ALL USING (false);

CREATE POLICY "Users can view touchpoints for accessible projects" ON public.touchpoints
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can insert touchpoints for accessible projects" ON public.touchpoints
  FOR INSERT WITH CHECK (has_project_access(auth.uid(), project_id));

-- Attribution results policies
CREATE POLICY "Deny anonymous access to attribution_results" ON public.attribution_results
  FOR ALL USING (false);

CREATE POLICY "Users can view attribution for accessible projects" ON public.attribution_results
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage attribution for accessible projects" ON public.attribution_results
  FOR ALL USING (has_project_access(auth.uid(), project_id));

-- Custom settings policies
CREATE POLICY "Deny anonymous access to custom_attribution_settings" ON public.custom_attribution_settings
  FOR ALL USING (false);

CREATE POLICY "Users can view settings for accessible projects" ON public.custom_attribution_settings
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage settings for accessible projects" ON public.custom_attribution_settings
  FOR ALL USING (has_project_access(auth.uid(), project_id));