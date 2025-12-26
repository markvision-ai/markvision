-- Make the lead-attachments bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'lead-attachments';

-- Drop the public SELECT policy
DROP POLICY IF EXISTS "Anyone can view lead attachments" ON storage.objects;

-- Create secure policy for authenticated users with project access
CREATE POLICY "Users can view attachments for accessible projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lead-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user has access to the project via lead_id in path
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.project_access pa ON pa.project_id = l.project_id
      WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
      AND pa.user_id = auth.uid()
    )
    OR
    -- Or user is project owner
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.projects p ON p.id = l.project_id
      WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
      AND p.owner_id = auth.uid()
    )
    OR
    -- Or user is admin
    public.has_role(auth.uid(), 'admin')
  )
);

-- Update INSERT policy to use lead_id folder structure
DROP POLICY IF EXISTS "Authenticated users can upload lead attachments" ON storage.objects;

CREATE POLICY "Authenticated users can upload lead attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user has access to the project via lead_id in path
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.project_access pa ON pa.project_id = l.project_id
      WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
      AND pa.user_id = auth.uid()
    )
    OR
    -- Or user is project owner
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.projects p ON p.id = l.project_id
      WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
      AND p.owner_id = auth.uid()
    )
    OR
    -- Or user is admin
    public.has_role(auth.uid(), 'admin')
  )
);

-- Add DELETE policy for admins and file owners
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

CREATE POLICY "Users can delete attachments for accessible projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lead-attachments'
  AND auth.uid() IS NOT NULL
  AND (
    -- Check if user has access to the project via lead_id in path
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.project_access pa ON pa.project_id = l.project_id
      WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
      AND pa.user_id = auth.uid()
    )
    OR
    -- Or user is project owner
    EXISTS (
      SELECT 1 FROM public.leads l
      JOIN public.projects p ON p.id = l.project_id
      WHERE l.id::text = (storage.foldername(storage.objects.name))[1]
      AND p.owner_id = auth.uid()
    )
    OR
    -- Or user is admin
    public.has_role(auth.uid(), 'admin')
  )
);