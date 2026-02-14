-- Add project_id to content_factory table if it doesn't exist
ALTER TABLE IF EXISTS public.content_factory
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_content_factory_project_id ON public.content_factory(project_id);

-- Force RLS policies to be re-applied or verified
ALTER TABLE "public"."content_factory" ENABLE ROW LEVEL SECURITY;
