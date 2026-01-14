import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ShieldCheck, 
  Send, 
  Bot, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useAIRop, AIRopTask, AIRopAudit } from '@/hooks/useAIRop';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface AIRopPageProps {
  projectId: string | null;
}

const ScoreCircle = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke={getColor(score)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(score)}</span>
      </div>
    </div>
  );
};

const TaskStatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    pending: { label: 'Ожидание', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
    processing: { label: 'Анализ...', variant: 'default', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    completed: { label: 'Завершено', variant: 'outline', icon: <CheckCircle2 className="w-3 h-3" /> },
    error: { label: 'Ошибка', variant: 'destructive', icon: <AlertCircle className="w-3 h-3" /> }
  };
  
  const config = configs[status] || configs.pending;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const TaskCard = ({ task }: { task: AIRopTask }) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground mb-2">{task.task_text}</p>
          {task.status === 'processing' && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ИИ анализирует систему...</span>
            </div>
          )}
          {task.result && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground/90">{task.result}</p>
            </div>
          )}
          {task.error_message && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive">{task.error_message}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <TaskStatusBadge status={task.status} />
          <span className="text-xs text-muted-foreground">
            {format(new Date(task.created_at), 'dd MMM, HH:mm', { locale: ru })}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AuditCard = ({ audit }: { audit: AIRopAudit }) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base">
          Аудит {format(new Date(audit.audit_date), 'd MMMM yyyy', { locale: ru })}
        </CardTitle>
        <ScoreCircle score={audit.overall_score} />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {audit.summary && (
        <p className="text-sm text-muted-foreground">{audit.summary}</p>
      )}
      
      {audit.critical_errors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Критические ошибки</span>
          </div>
          <ul className="space-y-1">
            {audit.critical_errors.map((error, idx) => (
              <li key={idx} className="text-sm text-destructive/80 pl-6 before:content-['•'] before:mr-2 before:text-destructive">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {audit.growth_points.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Точки роста</span>
          </div>
          <ul className="space-y-1">
            {audit.growth_points.map((point, idx) => (
              <li key={idx} className="text-sm text-success/80 pl-6 before:content-['•'] before:mr-2 before:text-success">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </CardContent>
  </Card>
);

const BotStatsWidget = ({ audits }: { audits: AIRopAudit[] }) => {
  const navigate = useNavigate();
  
  // Aggregate stats from latest audit
  const latestAudit = audits[0];
  const stats = latestAudit?.bot_stats || {};
  
  const totalDialogs = stats.total_dialogs || 0;
  const logicErrors = stats.logic_errors || 0;
  const successfulBookings = stats.successful_bookings || 0;
  
  const successRate = totalDialogs > 0 
    ? Math.round((successfulBookings / totalDialogs) * 100) 
    : 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Контроль ИИ-агента Марка</CardTitle>
        </div>
        <CardDescription>Статистика работы чат-бота</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <MessageSquare className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{totalDialogs}</div>
            <div className="text-xs text-muted-foreground">Всего диалогов</div>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-destructive" />
            <div className="text-2xl font-bold text-destructive">{logicErrors}</div>
            <div className="text-xs text-muted-foreground">Ошибки логики</div>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
            <div className="text-2xl font-bold text-success">{successfulBookings}</div>
            <div className="text-xs text-muted-foreground">Успешные записи</div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Успешность</span>
            <span className="font-medium">{successRate}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>
        
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => navigate('/knowledge')}
        >
          <BookOpen className="w-4 h-4" />
          Переобучить Марка
        </Button>
      </CardContent>
    </Card>
  );
};

export const AIRopPage: React.FC<AIRopPageProps> = ({ projectId }) => {
  const [taskInput, setTaskInput] = useState('');
  const { tasks, audits, loading, submitting, createTask, refetch } = useAIRop(projectId);

  const handleSubmitTask = async () => {
    if (!taskInput.trim()) return;
    
    await createTask(taskInput);
    setTaskInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmitTask();
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ИИ-РОП</h1>
            <p className="text-sm text-muted-foreground">Контроль системы и анализ эффективности</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Обновить
        </Button>
      </div>

      {/* Task Input */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Дать задание ИИ-РОПу
          </CardTitle>
          <CardDescription>
            Например: "Проверь работу бота под Рилсом про виниры" или "Проанализируй конверсию за неделю"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Textarea
              placeholder="Опишите задачу для ИИ-РОПа..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] bg-background/50"
            />
            <Button 
              onClick={handleSubmitTask} 
              disabled={submitting || !taskInput.trim()}
              className="self-end gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Отправить
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Ctrl+Enter для отправки
          </p>
        </CardContent>
      </Card>

      {/* Tasks History */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">История задач</h2>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audits */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Ежедневный аудит
          </h2>
          {audits.length > 0 ? (
            <div className="space-y-4">
              {audits.map((audit) => (
                <AuditCard key={audit.id} audit={audit} />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="py-12 text-center">
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Аудиты пока не проводились</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  ИИ-РОП автоматически проводит ежедневный аудит системы
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bot Stats Widget */}
        <div>
          <BotStatsWidget audits={audits} />
        </div>
      </div>
    </div>
  );
};

export default AIRopPage;
