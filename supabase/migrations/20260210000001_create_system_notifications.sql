-- =============================================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ДЛЯ СИСТЕМНЫХ УВЕДОМЛЕНИЙ И ОШИБОК
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    -- Тип и источник уведомления
    type TEXT NOT NULL DEFAULT 'info', -- 'error', 'warning', 'info', 'success'
    source TEXT, -- 'competitor_monitoring', 'instagram_sync', etc.

    -- Контент уведомления
    message TEXT NOT NULL,
    metadata JSONB,

    -- Статус прочтения
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_system_notifications_project
    ON public.system_notifications(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_notifications_type
    ON public.system_notifications(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_notifications_unread
    ON public.system_notifications(project_id, is_read)
    WHERE is_read = false;

-- Row Level Security
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть уведомления своих проектов
CREATE POLICY "Users can view notifications for their projects"
    ON public.system_notifications FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM public.projects
            WHERE user_id = auth.uid()
        )
    );

-- Политика: service role может вставлять уведомления
CREATE POLICY "Service role can insert notifications"
    ON public.system_notifications FOR INSERT
    WITH CHECK (true);

-- Комментарий для таблицы
COMMENT ON TABLE public.system_notifications IS 'Системные уведомления, логи ошибок и информационные сообщения для workflow мониторинга';

-- =============================================================================
-- ПРОВЕРКА
-- =============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'system_notifications'
    ) THEN
        RAISE NOTICE '✅ Таблица system_notifications создана успешно';
        RAISE NOTICE '✅ Индексы созданы';
        RAISE NOTICE '✅ RLS политики установлены';
    ELSE
        RAISE EXCEPTION '❌ Ошибка создания таблицы system_notifications';
    END IF;
END
$$;
