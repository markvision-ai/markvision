-- Добавить новые колонки для выбранных аккаунтов
ALTER TABLE public.ad_accounts 
ADD COLUMN IF NOT EXISTS selected_page_id TEXT,
ADD COLUMN IF NOT EXISTS selected_instagram_id TEXT;

-- Создать индексы
CREATE INDEX IF NOT EXISTS idx_ad_accounts_selected_page ON public.ad_accounts(selected_page_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_selected_instagram ON public.ad_accounts(selected_instagram_id);

-- Добавить комментарии
COMMENT ON COLUMN public.ad_accounts.selected_page_id IS 'ID выбранной Facebook страницы';
COMMENT ON COLUMN public.ad_accounts.selected_instagram_id IS 'ID выбранного Instagram аккаунта';

