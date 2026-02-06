-- =============================================================================
-- Триггер для отправки CAPI событий при смене статуса лида
-- =============================================================================
-- Этот триггер вызывает n8n webhook когда статус лида меняется на:
-- - diagnostic_scheduled, scheduled, booked → Schedule event
-- - sold, sale, won, paid → Purchase event
-- =============================================================================

-- Функция для отправки webhook в n8n
CREATE OR REPLACE FUNCTION public.notify_lead_status_change()
RETURNS TRIGGER AS $$
DECLARE
    n8n_url TEXT := 'https://n8n.zapoinov.com/webhook/lead-status-changed';
    payload JSONB;
BEGIN
    -- Проверяем что статус действительно изменился
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Проверяем что новый статус - это целевое событие
        IF NEW.status IN (
            'diagnostic_scheduled', 'scheduled', 'booked', 'diagnostic',
            'sold', 'sale', 'won', 'closed_won', 'paid'
        ) THEN
            -- Формируем payload
            payload := jsonb_build_object(
                'type', 'UPDATE',
                'table', 'leads',
                'schema', 'public',
                'record', row_to_json(NEW)::jsonb,
                'old_record', row_to_json(OLD)::jsonb
            );

            -- Отправляем webhook асинхронно через pg_net (если установлен)
            -- Если pg_net не установлен, можно использовать Supabase Database Webhooks в UI
            BEGIN
                PERFORM net.http_post(
                    url := n8n_url,
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json'
                    ),
                    body := payload
                );
            EXCEPTION WHEN OTHERS THEN
                -- Логируем ошибку но не прерываем транзакцию
                RAISE WARNING 'Failed to send CAPI webhook: %', SQLERRM;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS on_lead_status_change_capi ON public.leads;

-- Создаём триггер
CREATE TRIGGER on_lead_status_change_capi
    AFTER UPDATE OF status ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_lead_status_change();

-- =============================================================================
-- Альтернатива: Настройка через Supabase Database Webhooks (рекомендуется)
-- =============================================================================
-- Если pg_net не работает, настрой webhook в Supabase Dashboard:
-- 1. Перейди в Database → Webhooks
-- 2. Создай новый webhook:
--    - Name: lead-status-capi
--    - Table: leads
--    - Events: UPDATE
--    - URL: https://n8n.zapoinov.com/webhook/lead-status-changed
--    - HTTP Headers: Content-Type: application/json

-- Проверка установки pg_net
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        RAISE NOTICE 'pg_net extension is installed - trigger will send webhooks';
    ELSE
        RAISE WARNING 'pg_net extension NOT installed - configure Database Webhook in Supabase Dashboard instead';
        RAISE NOTICE 'Go to: Database → Webhooks → Create webhook for leads table';
    END IF;
END
$$;

COMMENT ON FUNCTION public.notify_lead_status_change() IS
'Отправляет webhook в n8n при смене статуса лида для CAPI интеграции';
