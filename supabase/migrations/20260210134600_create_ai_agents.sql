-- Create ai_agents table for AI Intelligence Hub
CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Agent configuration
    agent_type TEXT NOT NULL CHECK (agent_type IN ('manager', 'rop', 'nps', 'comments')),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Configuration data (stores all wizard answers)
    config_data JSONB DEFAULT '{}'::jsonb,
    
    -- Generated system prompt
    system_prompt TEXT,
    
    -- Enabled channels
    channels TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT false,
    deployment_status TEXT DEFAULT 'draft' CHECK (deployment_status IN ('draft', 'generating', 'deploying', 'active', 'error')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_deployed_at TIMESTAMPTZ,
    
    UNIQUE(project_id, agent_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_agents_user 
    ON public.ai_agents(user_id);
    
CREATE INDEX IF NOT EXISTS idx_ai_agents_project 
    ON public.ai_agents(project_id);
    
CREATE INDEX IF NOT EXISTS idx_ai_agents_type 
    ON public.ai_agents(agent_type);
    
CREATE INDEX IF NOT EXISTS idx_ai_agents_active 
    ON public.ai_agents(is_active) WHERE is_active = true;

-- RLS policies
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agents"
    ON public.ai_agents FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own agents"
    ON public.ai_agents FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own agents"
    ON public.ai_agents FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own agents"
    ON public.ai_agents FOR DELETE
    USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_agents_updated_at();

COMMENT ON TABLE public.ai_agents IS 'AI agents configuration for automated customer interactions';
COMMENT ON COLUMN public.ai_agents.agent_type IS 'Type of agent: manager (sales), rop (call control), nps (quality control), comments (social media)';
COMMENT ON COLUMN public.ai_agents.config_data IS 'JSONB storing wizard answers: business_description, tasks, tone_of_voice, stop_topics, knowledge_base, schedule, etc.';
COMMENT ON COLUMN public.ai_agents.system_prompt IS 'Generated Claude system prompt based on config_data';
COMMENT ON COLUMN public.ai_agents.channels IS 'Array of enabled channels: instagram, telegram, whatsapp, website';
