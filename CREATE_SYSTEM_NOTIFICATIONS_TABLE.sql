-- Создание таблицы system_notifications для центра уведомлений
-- Выполнить в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.system_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_system_notifications_user ON public.system_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_project ON public.system_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_read ON public.system_notifications(read);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created ON public.system_notifications(created_at DESC);

-- RLS политика
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.system_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.system_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.system_notifications
    FOR INSERT WITH CHECK (true);

-- Функция для автоматического создания уведомлений при ошибках в automation_flows
CREATE OR REPLACE FUNCTION notify_automation_error()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'error' AND OLD.status != 'error' THEN
        INSERT INTO public.system_notifications (project_id, user_id, type, title, message)
        SELECT 
            NEW.project_id,
            p.owner_id,
            'error',
            'Ошибка автоматизации: ' || NEW.name,
            COALESCE(NEW.logs, 'Произошла ошибка при выполнении автоматизации')
        FROM public.projects p
        WHERE p.id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_error_notification
    AFTER UPDATE ON public.automation_flows
    FOR EACH ROW
    WHEN (NEW.status = 'error' AND OLD.status != 'error')
    EXECUTE FUNCTION notify_automation_error();
