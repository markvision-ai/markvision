-- Добавление полей для хранения названий выбранных аккаунтов
ALTER TABLE public.ad_accounts
ADD COLUMN IF NOT EXISTS selected_page_name TEXT,
ADD COLUMN IF NOT EXISTS selected_instagram_handle TEXT;

-- Добавление комментариев для новых полей
COMMENT ON COLUMN public.ad_accounts.selected_page_name IS 'Название выбранной Facebook страницы';
COMMENT ON COLUMN public.ad_accounts.selected_instagram_handle IS 'Username выбранного Instagram аккаунта';

-- Обновление существующих записей с данными из API (если есть)
-- Это будет выполнено автоматически в приложении при следующем запуске