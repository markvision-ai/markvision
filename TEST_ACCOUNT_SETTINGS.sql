-- Тестовый файл для проверки сохранения настроек аккаунтов
-- Выполните этот SQL после настройки аккаунтов в UI

-- Проверить сохраненные настройки
SELECT
    id,
    selected_page_id,
    selected_page_name,
    selected_instagram_id,
    selected_instagram_handle,
    ad_account_name,
    updated_at
FROM public.ad_accounts
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

-- Проверить, что automation_flows работает
SELECT
    name,
    status,
    last_run,
    execution_time,
    logs
FROM public.automation_flows
WHERE project_id = '64c94e87-630c-470e-8ab1-8f7c8c835efa'
ORDER BY last_run DESC NULLS LAST;