import { useState } from 'react';
import { useLeadTasks, LeadTask } from '@/hooks/useLeadTasks';
import { format, isPast, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Trash2, 
  Clock,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LeadTasksProps {
  leadId: string;
}

export const LeadTasks = ({ leadId }: LeadTasksProps) => {
  const { tasks, loading, createTask, toggleComplete, deleteTask } = useLeadTasks(leadId);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setCreating(true);
    const result = await createTask({
      title: newTaskTitle.trim(),
      due_date: newTaskDueDate || undefined,
    });
    
    if (result) {
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setIsAdding(false);
      toast.success('Задача создана');
    } else {
      toast.error('Ошибка создания задачи');
    }
    setCreating(false);
  };

  const handleToggle = async (task: LeadTask) => {
    const success = await toggleComplete(task.id, !task.completed);
    if (success && !task.completed) {
      toast.success('Задача выполнена');
    }
  };

  const handleDelete = async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) {
      toast.success('Задача удалена');
    }
  };

  const getTaskStatus = (task: LeadTask) => {
    if (task.completed) return 'completed';
    if (!task.due_date) return 'normal';
    if (isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))) return 'overdue';
    if (isToday(new Date(task.due_date))) return 'today';
    return 'normal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-4">
      {/* Add Task Button / Form */}
      {!isAdding ? (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить задачу
        </Button>
      ) : (
        <div className="space-y-2 p-3 border rounded-lg bg-secondary/30">
          <Input
            placeholder="Название задачи"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
            autoFocus
          />
          <div className="flex gap-2">
            <Input
              type="datetime-local"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleCreateTask} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Создать'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-2">
          {activeTasks.map(task => {
            const status = getTaskStatus(task);
            return (
              <div 
                key={task.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  status === 'overdue' && 'border-destructive/50 bg-destructive/5',
                  status === 'today' && 'border-warning/50 bg-warning/5',
                  status === 'normal' && 'bg-secondary/30'
                )}
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggle(task)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.due_date && (
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-xs',
                      status === 'overdue' && 'text-destructive',
                      status === 'today' && 'text-warning',
                      status === 'normal' && 'text-muted-foreground'
                    )}>
                      {status === 'overdue' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>
                        {format(new Date(task.due_date), 'd MMM, HH:mm', { locale: ru })}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1 hover:bg-destructive/20 rounded opacity-50 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Выполнено ({completedTasks.length})
          </p>
          {completedTasks.map(task => (
            <div 
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 opacity-60"
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleToggle(task)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm line-through">{task.title}</p>
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="p-1 hover:bg-destructive/20 rounded opacity-50 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Нет задач
        </p>
      )}
    </div>
  );
};
