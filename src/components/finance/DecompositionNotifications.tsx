import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { differenceInDays, parseISO, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SmartGoal {
  id: string;
  title: string;
  timebound: {
    deadline: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

interface DecompositionNotificationsProps {
  channelName?: string;
}

export const DecompositionNotifications = ({ channelName = 'финансовая модель' }: DecompositionNotificationsProps) => {
  const [notifications, setNotifications] = useState<{ type: 'urgent' | 'warning' | 'info', title: string, message: string, id: string }[]>([]);

  useEffect(() => {
    const checkDeadlines = () => {
      const storageKey = `smart_goals_v2_${channelName}`;
      const saved = localStorage.getItem(storageKey);
      
      if (!saved) {
        setNotifications([]);
        return;
      }

      try {
        const goals: SmartGoal[] = JSON.parse(saved);
        const newNotifications: typeof notifications = [];

        goals.forEach(goal => {
          if (goal.status === 'completed') return;

          const deadline = parseISO(goal.timebound.deadline);
          const daysLeft = differenceInDays(deadline, new Date());

          if (isPast(deadline) && !isToday(deadline)) {
            newNotifications.push({
              id: goal.id,
              type: 'urgent',
              title: 'Просроченная цель',
              message: `Дедлайн по цели "${goal.title}" истек! (${goal.timebound.deadline})`
            });
          } else if (daysLeft <= 3 && daysLeft >= 0) {
            newNotifications.push({
              id: goal.id,
              type: 'urgent',
              title: 'Скоро дедлайн',
              message: `Осталось ${daysLeft === 0 ? 'менее 24 часов' : `${daysLeft} дн.`} до завершения цели "${goal.title}".`
            });
          } else if (daysLeft <= 7 && daysLeft > 3) {
            newNotifications.push({
              id: goal.id,
              type: 'warning',
              title: 'Напоминание',
              message: `Осталась неделя до дедлайна по цели "${goal.title}".`
            });
          }
        });

        setNotifications(newNotifications);
      } catch (e) {
        console.error('Failed to parse goals for notifications', e);
      }
    };

    checkDeadlines();
    // Set up an interval to check periodically (e.g., every minute or on focus)
    // For now, just running on mount and when channelName changes is enough for basic usage.
    
    // Listen for storage events to update in real-time if changed in another tab
    const handleStorage = () => checkDeadlines();
    window.addEventListener('storage', handleStorage);
    
    return () => window.removeEventListener('storage', handleStorage);
  }, [channelName]);

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 animate-in slide-in-from-top-2 duration-300">
      {notifications.map((note) => (
        <Alert 
          key={note.id} 
          variant={note.type === 'urgent' ? 'destructive' : 'default'}
          className={`${note.type === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' : ''}`}
        >
          {note.type === 'urgent' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
          <AlertTitle>{note.title}</AlertTitle>
          <AlertDescription>
            {note.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
