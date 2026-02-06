-- Добавляем RLS политику для чтения content_stats анонимным пользователям (для тестов)
-- В production можно ограничить только авторизованным

-- Политика для анонимного чтения (временно для тестов)
CREATE POLICY "Anon can read content_stats"
    ON public.content_stats FOR SELECT
    USING (true);

-- Обновляем Plan/Fact данные для проекта
UPDATE public.content_stats
SET
    plan_followers = 5000,
    plan_reach = 500000,
    plan_comments = 500,
    plan_leads = 50,
    plan_sales = 10
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  AND period_type = 'monthly';

-- Если записи нет - создаём
INSERT INTO public.content_stats (
    project_id, date, period_type,
    plan_followers, plan_reach, plan_comments, plan_leads, plan_sales,
    synced_at
)
SELECT
    '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    date_trunc('month', CURRENT_DATE)::DATE,
    'monthly',
    5000, 500000, 500, 50, 10,
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM public.content_stats
    WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
      AND period_type = 'monthly'
      AND date = date_trunc('month', CURRENT_DATE)::DATE
);
