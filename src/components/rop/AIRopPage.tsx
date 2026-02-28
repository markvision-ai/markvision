
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Clock,
  Users,
  DollarSign,
  Target,
  Lightbulb,
  BarChart3,
  Zap,
  Brain,
  MessageCircle,
  ArrowUpRight,
  Terminal,
  Phone
} from 'lucide-react';
import CallAnalyticsTab from './CallAnalyticsTab';
import ChatAnalyticsTab from './ChatAnalyticsTab';
import AIRopOverviewTab from './AIRopOverviewTab';
import { useAIRop, AIRopTask, AIRopAudit } from '@/hooks/useAIRop';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
    in_progress: { label: 'Анализ...', variant: 'default', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
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
  <Card className="bg-white/70 backdrop-blur-sm border-white/50">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground mb-2">{task.prompt}</p>
          {task.status === 'in_progress' && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ИИ анализирует систему...</span>
            </div>
          )}
          {task.response && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground/90">{task.response}</p>
            </div>
          )}
          {task.status === 'error' && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive">Произошла ошибка при выполнении задачи</p>
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
  <Card className="bg-white/70 backdrop-blur-sm border-white/50">
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

  const latestAudit = audits[0];
  const stats = latestAudit?.bot_stats || {};

  const totalDialogs = stats.total_dialogs || 0;
  const logicErrors = stats.logic_errors || 0;
  const successfulBookings = stats.successful_bookings || 0;

  const successRate = totalDialogs > 0
    ? Math.round((successfulBookings / totalDialogs) * 100)
    : 0;

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/50">
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

// Компонент для оценки менеджеров
const ManagerEvaluationCard = ({ projectId }: { projectId: string | null }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!projectId) return;
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .limit(5);
      setStaff(data || []);
      setLoading(false);
    };
    fetchStaff();
  }, [projectId]);

  const getPerformanceScore = (xp: number, level: number) => {
    const base = Math.min(100, (xp / 1000) * 50 + level * 10);
    return Math.round(base);
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Оценка работы менеджеров</CardTitle>
        </div>
        <CardDescription>Рейтинг эффективности команды</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Нет данных о менеджерах</p>
        ) : (
          <div className="space-y-3">
            {staff.map((member, idx) => {
              const score = getPerformanceScore(member.xp_points || 0, member.level || 1);
              return (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-yellow-950' :
                    idx === 1 ? 'bg-slate-400 text-slate-950' :
                      idx === 2 ? 'bg-orange-500 text-orange-950' :
                        'bg-muted text-muted-foreground'
                    }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.position}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={score} className="w-16 h-2" />
                    <span className="text-sm font-bold w-8 text-right">{score}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Компонент рекомендаций по увеличению дохода
const RevenueRecommendationsCard = ({ audits }: { audits: AIRopAudit[] }) => {
  const latestAudit = audits && audits.length > 0 ? audits[0] : null;
  const growthPoints = latestAudit?.growth_points || [];

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Рекомендации по увеличению дохода</CardTitle>
        </div>
        <CardDescription>ИИ-анализ возможностей роста</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {growthPoints.length > 0 ? (
          growthPoints.map((point, idx) => (
            <div key={idx} className="flex gap-3 p-3 rounded-lg bg-white/70 border border-white/50 hover:border-primary/30 transition-colors">
              <div className="shrink-0 text-primary">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{point}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет активных рекомендаций.</p>
            <p className="text-xs mt-1">Запустите аудит для получения точек роста.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Компонент терминального вывода
const TerminalResponse = ({ text, isTyping }: { text: string; isTyping?: boolean }) => (
  <div className="mt-4 rounded-lg bg-black p-4 font-mono text-sm text-green-400 border border-green-900 shadow-inner overflow-hidden">
    <div className="flex items-center gap-2 border-b border-green-900/50 pb-2 mb-2">
      <Terminal className="w-3 h-3" />
      <span className="text-xs opacity-50">MARK_VISION_AI_CORE_V2.5</span>
    </div>
    <div className="whitespace-pre-wrap leading-relaxed">
      {text || <span className="text-green-400/30">Ожидание ответа от ядра...</span>}
      {isTyping && <span className="animate-pulse ml-1">_</span>}
    </div>
  </div>
);

// Компонент для добавления возражений в Марка
const ObjectionsTrainerCard = ({ onCreateTask, isSubmitting, tasks }: { onCreateTask: (task: string) => Promise<any>, isSubmitting: boolean, tasks: AIRopTask[] }) => {
  const [objection, setObjection] = useState('');
  const [response, setResponse] = useState('');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [localTask, setLocalTask] = useState<AIRopTask | null>(null);

  // Use task from real-time list if available (for updates), otherwise fallback to local initial state
  const activeTask = currentTaskId ? (tasks.find(t => t.id === currentTaskId) || localTask) : null;

  const handleSave = async () => {
    if (!objection.trim()) return;

    // Формируем промпт согласно инструкции
    let prompt = `Ты — ИИ РОП (Руководитель отдела продаж). Проанализируй это возражение клиента и напиши скрипт для менеджера, как его закрыть. Возражение: "${objection}"`;
    if (response.trim()) {
      prompt += `\n\nКонтекст (вариант менеджера): ${response}`;
    }

    const task = await onCreateTask(prompt);
    if (task) {
      setCurrentTaskId(task.id);
      setLocalTask(task);
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-white/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Обучение ИИ-Марка возражениям</CardTitle>
        </div>
        <CardDescription>Введите возражение, чтобы получить разбор от ИИ-РОПа</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Возражение клиента</label>
          <Textarea
            placeholder='Например: "Это слишком дорого"'
            value={objection}
            onChange={(e) => setObjection(e.target.value)}
            className="min-h-[60px]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ваш вариант ответа (необязательно)</label>
          <Textarea
            placeholder="Ваш вариант ответа для проверки..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || !objection.trim()}
          className="w-full gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          Получить разбор от ИИ
        </Button>

        {activeTask && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <TerminalResponse
              text={activeTask.response || ''}
              isTyping={['pending', 'in_progress', 'processing'].includes(activeTask.status)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AIRopPage: React.FC<AIRopPageProps> = ({ projectId }) => {
  const [taskInput, setTaskInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-[20px] bg-slate-50 border border-slate-100 shadow-sm relative group">
            <div className="absolute inset-0 bg-blue-500/10 rounded-[20px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldCheck className="w-8 h-8 text-blue-600 relative z-10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              ИИ-РОП <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-600 bg-blue-50/50">Core V2.5</Badge>
            </h1>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest text-[10px] opacity-60 mt-1">Контроль системы, анализ эффективности и AI-аудит</p>
          </div>
        </div>
        <Button variant="outline" size="lg" onClick={() => refetch()} className="gap-2 rounded-2xl border-slate-200 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px] px-6 py-6 h-auto shadow-sm">
          <RefreshCw className="w-4 h-4" />
          Синхронизировать
        </Button>
      </div>

      {/* Task Input */}
      <Card className="bg-white/80 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-white rounded-[32px] overflow-hidden group">
        <CardHeader className="pb-4 border-b border-slate-50/50 bg-slate-50/20">
          <CardTitle className="text-base font-black flex items-center gap-3 text-foreground uppercase tracking-tight">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Bot className="w-5 h-5" />
            </div>
            Дать задание ИИ-РОПу
          </CardTitle>
          <CardDescription className="text-xs font-medium uppercase tracking-widest opacity-60 pl-11">
            Например: "Проверь работу бота под Рилсом про виниры" или "Проанализируй конверсию за неделю"
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Textarea
              placeholder="Опишите задачу для ИИ-РОПа..."
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] bg-slate-50/50 border-slate-100 rounded-2xl p-4 font-bold text-sm focus:ring-blue-500/20 resize-none"
            />
            <Button
              onClick={handleSubmitTask}
              disabled={submitting || !taskInput.trim()}
              className="sm:w-40 h-auto self-stretch rounded-2xl gap-3 font-black uppercase tracking-widest text-[10px] bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Отправить
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-4 px-1 opacity-40">
            <Terminal className="w-3 h-3" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Ctrl + Enter для мгновенной отправки в ядро анализа
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto bg-white/60 backdrop-blur-xl border border-white p-1.5 rounded-[24px] shadow-sm hide-scrollbar">
          <TabsTrigger value="overview" className="flex-1 gap-2 py-3 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-black uppercase tracking-widest text-[10px] transition-all">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden lg:inline">Обзор системы</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex-1 gap-2 py-3 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-black uppercase tracking-widest text-[10px] transition-all">
            <Phone className="w-4 h-4" />
            <span className="hidden lg:inline">Анализ звонков</span>
          </TabsTrigger>
          <TabsTrigger value="chats" className="flex-1 gap-2 py-3 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-black uppercase tracking-widest text-[10px] transition-all">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden lg:inline">Анализ чатов</span>
          </TabsTrigger>
          <TabsTrigger value="managers" className="flex-1 gap-2 py-3 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-black uppercase tracking-widest text-[10px] transition-all">
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Команда РОП</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex-1 gap-2 py-3 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-black uppercase tracking-widest text-[10px] transition-all">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden lg:inline">Точки роста</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex-1 gap-2 py-3 px-6 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-black uppercase tracking-widest text-[10px] transition-all">
            <Brain className="w-4 h-4" />
            <span className="hidden lg:inline">Обучение ИИ</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <AIRopOverviewTab
            tasks={tasks}
            audits={audits}
            projectId={projectId}
            onRefresh={refetch}
          />
        </TabsContent>

        {/* Call Analytics Tab */}
        <TabsContent value="calls" className="mt-6">
          <CallAnalyticsTab projectId={projectId} />
        </TabsContent>

        {/* Chat Analytics Tab */}
        <TabsContent value="chats" className="mt-6">
          <ChatAnalyticsTab projectId={projectId} />
        </TabsContent>

        {/* Managers Tab */}
        <TabsContent value="managers" className="mt-6">
          <ManagerEvaluationCard projectId={projectId} />
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="mt-6">
          <RevenueRecommendationsCard audits={audits} />
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="mt-6">
          <ObjectionsTrainerCard onCreateTask={createTask} isSubmitting={submitting} tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRopPage;
