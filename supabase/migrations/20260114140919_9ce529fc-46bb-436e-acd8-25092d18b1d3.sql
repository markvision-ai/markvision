-- Create test admin user via auth.users
-- Note: This creates a user that can log in with email/password

-- First, insert the user into auth.users with a known password hash
-- Password: TestAdmin123!
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'testadmin@markvision.app',
  crypt('TestAdmin123!', gen_salt('bf')),
  now(),
  '{"name": "Test Admin"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create identity for the user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '{"sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "email": "testadmin@markvision.app"}'::jsonb,
  'email',
  'testadmin@markvision.app',
  now(),
  now(),
  now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Grant access to all projects
INSERT INTO public.project_access (user_id, project_id)
SELECT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', id FROM projects
ON CONFLICT DO NOTHING;