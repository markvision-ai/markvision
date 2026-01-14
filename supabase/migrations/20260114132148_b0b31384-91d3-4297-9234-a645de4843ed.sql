-- Включаем realtime для таблицы leads (если еще не включено)
DO $$
BEGIN
  ALTER TABLE public.leads REPLICA IDENTITY FULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Добавляем Super Admin в project_access для гарантии доступа
INSERT INTO public.project_access (user_id, project_id)
VALUES ('d94043b0-1c76-4017-84de-df0dbf00a2c9', '64c94e87-630c-470e-8ab1-8f7c8c835efa')
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Удаляем старые политики если есть, затем создаём новые
DROP POLICY IF EXISTS "Super admin full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Super admin full access to leads" ON public.leads;

-- RLS для projects - Super Admin обход
CREATE POLICY "Super admin full access to projects"
ON public.projects
FOR ALL
TO authenticated
USING (
  auth.uid() = 'd94043b0-1c76-4017-84de-df0dbf00a2c9'::uuid 
  OR owner_id = auth.uid()
  OR public.has_project_access(auth.uid(), id)
)
WITH CHECK (
  auth.uid() = 'd94043b0-1c76-4017-84de-df0dbf00a2c9'::uuid 
  OR owner_id = auth.uid()
);

-- RLS для leads - Super Admin обход
CREATE POLICY "Super admin full access to leads" 
ON public.leads
FOR ALL
TO authenticated
USING (
  auth.uid() = 'd94043b0-1c76-4017-84de-df0dbf00a2c9'::uuid
  OR public.has_project_access(auth.uid(), project_id)
)
WITH CHECK (
  auth.uid() = 'd94043b0-1c76-4017-84de-df0dbf00a2c9'::uuid
  OR public.has_project_access(auth.uid(), project_id)
);