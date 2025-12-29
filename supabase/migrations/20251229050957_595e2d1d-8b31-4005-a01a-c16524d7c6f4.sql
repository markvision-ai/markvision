-- Staff/Personnel table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT NOT NULL DEFAULT 'manager',
  department TEXT,
  salary NUMERIC DEFAULT 0,
  commission_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  hire_date DATE DEFAULT CURRENT_DATE,
  avatar_url TEXT,
  xp_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Knowledge Base documents
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general',
  file_url TEXT,
  file_type TEXT,
  tags TEXT[],
  is_ai_trained BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Financial transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'RUB',
  description TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Omnichannel inbox messages
CREATE TABLE public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'instagram', 'email', 'sms', 'phone')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  media_url TEXT,
  status TEXT DEFAULT 'delivered',
  sent_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL
);

-- Lead scoring configuration
CREATE TABLE public.lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field TEXT NOT NULL,
  operator TEXT NOT NULL,
  value TEXT NOT NULL,
  score_delta INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gamification achievements
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff achievements (earned)
CREATE TABLE public.staff_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, achievement_id)
);

-- A/B Tests
CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  variant_a_name TEXT DEFAULT 'Control',
  variant_b_name TEXT DEFAULT 'Variant B',
  variant_a_visitors INTEGER DEFAULT 0,
  variant_b_visitors INTEGER DEFAULT 0,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  winner TEXT,
  ai_recommendation TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Integrations health monitoring
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff
CREATE POLICY "Users can view staff for accessible projects" ON public.staff
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage staff for accessible projects" ON public.staff
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- RLS Policies for knowledge_base
CREATE POLICY "Users can view knowledge for accessible projects" ON public.knowledge_base
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage knowledge for accessible projects" ON public.knowledge_base
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions for accessible projects" ON public.transactions
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage transactions for accessible projects" ON public.transactions
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- RLS Policies for inbox_messages
CREATE POLICY "Users can view messages for accessible projects" ON public.inbox_messages
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage messages for accessible projects" ON public.inbox_messages
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- RLS Policies for lead_scoring_rules
CREATE POLICY "Users can view scoring rules for accessible projects" ON public.lead_scoring_rules
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage scoring rules for accessible projects" ON public.lead_scoring_rules
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- RLS Policies for achievements
CREATE POLICY "Users can view achievements for accessible projects" ON public.achievements
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage achievements for accessible projects" ON public.achievements
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- RLS Policies for staff_achievements
CREATE POLICY "Users can view staff achievements" ON public.staff_achievements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = staff_achievements.staff_id 
    AND has_project_access(auth.uid(), s.project_id)
  )
);

CREATE POLICY "Users can manage staff achievements" ON public.staff_achievements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM staff s 
    WHERE s.id = staff_achievements.staff_id 
    AND has_project_access(auth.uid(), s.project_id)
  )
);

-- RLS Policies for ab_tests
CREATE POLICY "Users can view ab_tests for accessible projects" ON public.ab_tests
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage ab_tests for accessible projects" ON public.ab_tests
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- RLS Policies for integrations
CREATE POLICY "Users can view integrations for accessible projects" ON public.integrations
FOR SELECT USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can manage integrations for accessible projects" ON public.integrations
FOR ALL USING (has_project_access(auth.uid(), project_id));

-- Add lead_score column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score_label TEXT DEFAULT 'warm';