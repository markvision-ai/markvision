-- ФИНАЛЬНЫЙ SQL: Вставка токена с правильными колонками
-- Выполните в Supabase SQL Editor

-- Сначала удаляем старые записи (если есть)
DELETE FROM public.ad_accounts 
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa' 
  AND platform = 'facebook';

-- Вставляем новую запись с вашим токеном
INSERT INTO public.ad_accounts (
  project_id, 
  platform, 
  external_id,
  access_token, 
  status
)
VALUES (
  '64c94e87-630c-470e-8ab1-8f7c8c835efa',
  'facebook',
  'facebook_manual_token',
  'EAAa3xKWvHHYBQqZC8dx2ak915FmdlfuGN2Ma37x5Nq5gbSamnSwY07EJ08wlhX2vvgsHx5VKbkCO0HgwKNhTIqVxtQyJJQuhPIZApPRFf1J5AVP9BT9SdTmJddxQZAJYWrtGVp2kO519iGemsa9kqSEgXt75o32jZAsKs86ldJ3OWp4qO5lTWx5kBw9dSFZAKzZCiqXVLOAIabuqms6Qn0xDSu4IJVGVguCrfMFw4CaoJ9TrVqMT5jmPJwKcBbaea7QWcEtb7TuEv7igTGZB7qb',
  'active'
);

-- Проверяем результат
SELECT 
  id,
  project_id,
  platform,
  external_id,
  status,
  created_at,
  LEFT(access_token, 20) || '...' as token_preview
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND platform = 'facebook';
