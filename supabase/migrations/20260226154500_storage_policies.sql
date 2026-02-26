-- Ensure storage bucket and policies
-- Note: Bucket creation is already handled in Edge Function, but let's ensure policies here.

-- 1. Allow authenticated users to upload to 'ad-creatives'
CREATE POLICY "Allow authenticated users to upload creatives" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'ad-creatives');

-- 2. Allow public access to read from 'ad-creatives'
CREATE POLICY "Allow public to read creatives" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'ad-creatives');

-- 3. Allow users to delete their own uploads (optional but good practice)
CREATE POLICY "Allow users to delete their own creatives" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'ad-creatives');
