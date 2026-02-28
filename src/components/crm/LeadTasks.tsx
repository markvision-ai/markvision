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
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-4">
      {/* Add Task Button / Form */}
      <AnimatePresence mode="wait">
        {!isAdding ? (
          <motion.div
            key="add-button"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40 transition-all"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить задачу
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            key="add-form"
            className="space-y-3 p-4 border border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Input
              placeholder="Название задачи"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
              autoFocus
              className="bg-background/50 border-white/50"
            />
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="flex-1 bg-background/50 border-white/50"
              />
              <Button 
                size="sm" 
                onClick={handleCreateTask} 
                disabled={creating}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Создать'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                Отмена
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {activeTasks.map(task => {
              const status = getTaskStatus(task);
              return (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border transition-all',
                    status === 'overdue' && 'border-destructive/50 bg-gradient-to-r from-destructive/10 to-destructive/5',
                    status === 'today' && 'border-warning/50 bg-gradient-to-r from-warning/10 to-warning/5',
                    status === 'normal' && 'border-white/50 bg-gradient-to-r from-muted/30 to-transparent'
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
                        'flex items-center gap-1.5 mt-1.5 text-xs font-medium',
                        status === 'overdue' && 'text-destructive',
                        status === 'today' && 'text-warning',
                        status === 'normal' && 'text-muted-foreground'
                      )}>
                        {status === 'overdue' ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {format(new Date(task.due_date), 'd MMM, HH:mm', { locale: ru })}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 hover:bg-destructive/20 rounded-lg opacity-50 hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            Выполнено ({completedTasks.length})
          </p>
          <AnimatePresence>
            {completedTasks.map(task => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 opacity-60 hover:opacity-80 transition-opacity"
              >
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggle(task)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-through text-muted-foreground">{task.title}</p>
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1.5 hover:bg-destructive/20 rounded-lg opacity-50 hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">Нет задач</p>
        </div>
      )}
    </div>
  );
};
