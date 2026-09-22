import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { listVideoTasks, type KieTaskRow } from '@/services/kieVideoService';

/**
 * Задачи генерации видео с живым обновлением статуса.
 *
 * Первая загрузка идёт через edge-функцию, дальше статус приезжает по
 * realtime: колбэк kie.ai обновляет строку, и UI перерисовывается сам.
 * Опрашивать ничего не нужно.
 */
export function useKieVideoTasks(limit = 20) {
    const [tasks, setTasks] = useState<KieTaskRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        try {
            setError(null);
            setTasks(await listVideoTasks(limit));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить задачи');
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        reload();

        const channel = supabase
            .channel('kie-video-tasks')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'kie_video_tasks' },
                (payload) => {
                    const row = payload.new as KieTaskRow | undefined;
                    if (!row?.task_id) return;

                    setTasks((current) => {
                        const index = current.findIndex((t) => t.task_id === row.task_id);
                        if (index === -1) return [row, ...current].slice(0, limit);
                        const next = [...current];
                        next[index] = { ...next[index], ...row };
                        return next;
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [reload, limit]);

    /** Добавить только что созданную задачу, не дожидаясь realtime. */
    const prepend = useCallback((task: KieTaskRow) => {
        setTasks((current) => [task, ...current.filter((t) => t.task_id !== task.task_id)].slice(0, limit));
    }, [limit]);

    return { tasks, loading, error, reload, prepend };
}
