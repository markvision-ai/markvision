-- Вставка Meta Access Token в ad_accounts и integrations.
-- В Supabase Dashboard: SQL Editor → New query → вставьте этот SQL,
-- замените YOUR_META_ACCESS_TOKEN и YOUR_PROJECT_ID на свои значения, затем Run.
--
-- YOUR_PROJECT_ID: UUID проекта (или возьмите из таблицы projects: SELECT id FROM projects LIMIT 1;)
-- YOUR_META_ACCESS_TOKEN: токен из Graph API Explorer / Business Suite

-- 1) ad_accounts (для Edge Functions и раздела «Рекламные площадки»)
INSERT INTO public.ad_accounts (project_id, platform, access_token, status, updated_at)
VALUES (
  'YOUR_PROJECT_ID'::uuid,
  'facebook',
  'YOUR_META_ACCESS_TOKEN',
  'active',
  now()
)
ON CONFLICT (project_id, platform)
DO UPDATE SET
  access_token = EXCLUDED.access_token,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- 2) integrations (колонка access_token; type может не существовать — тогда закомментируйте блок ниже)
-- Если в таблице integrations есть колонка "type" и уникальное ограничение (project_id, type):
INSERT INTO public.integrations (project_id, type, name, access_token, status, updated_at)
VALUES (
  'YOUR_PROJECT_ID'::uuid,
  'facebook',
  'Meta / Facebook',
  'YOUR_META_ACCESS_TOKEN',
  'active',
  now()
)
ON CONFLICT (project_id, type)
DO UPDATE SET
  access_token = EXCLUDED.access_token,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- Если вместо "type" используется "platform" и уникальное ограничение (project_id, platform):
-- INSERT INTO public.integrations (project_id, platform, name, access_token, status, updated_at)
-- VALUES (
--   'YOUR_PROJECT_ID'::uuid,
--   'facebook',
--   'Meta / Facebook',
--   'YOUR_META_ACCESS_TOKEN',
--   'active',
--   now()
-- )
-- ON CONFLICT (project_id, platform)
-- DO UPDATE SET
--   access_token = EXCLUDED.access_token,
--   status = EXCLUDED.status,
--   updated_at = EXCLUDED.updated_at;
