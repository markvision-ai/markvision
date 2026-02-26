-- Create the ad-creatives bucket
insert into storage.buckets (id, name, public)
values ('ad-creatives', 'ad-creatives', true)
on conflict (id) do nothing;

-- Set up access policies for the bucket
-- 1. Allow public read access to all files in the bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'ad-creatives' );

-- 2. Allow authenticated users to upload files
create policy "Authenticated Upload"
on storage.objects for insert
with check (
  bucket_id = 'ad-creatives' 
  and auth.role() = 'authenticated'
);

-- 3. Allow owners to update/delete their files (optional but good practice)
create policy "Owner Update"
on storage.objects for update
using ( bucket_id = 'ad-creatives' and auth.uid() = owner );

create policy "Owner Delete"
on storage.objects for delete
using ( bucket_id = 'ad-creatives' and auth.uid() = owner );
