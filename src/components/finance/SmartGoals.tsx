import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, CheckCircle2, AlertCircle, Plus, Calendar as CalendarIcon, Trash2, ArrowRight, Check, Flag, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

const translations = {
  ru: {
    title: 'SMART Цели',
    subtitle: 'Стратегическое планирование',
    addGoal: 'Добавить цель',
    createTitle: 'Создание SMART цели',
    createDesc: 'Пройдите все 5 шагов, чтобы сформулировать качественную и достижимую цель.',
    stepSpecific: 'Название цели',
    stepSpecificPlaceholder: "Краткое название (например, 'Рост продаж')",
    specificLabel: 'Specific (Конкретика)',
    specificDesc: 'Что именно вы хотите улучшить? Опишите результат максимально подробно.',
    specificPlaceholder: 'Я хочу увеличить...',
    next: 'Далее',
    metricLabel: 'Показатель (Метрика)',
    metricPlaceholder: 'Например: Выручка, Лиды',
    unitLabel: 'Ед. измерения',
    unitPlaceholder: 'KZT, шт, %',
    currentLabel: 'Текущее значение',
    targetLabel: 'Целевое значение',
    resourceLabel: 'Achievable (Достижимость)',
    resourceCheck: 'Ресурсы подтверждены',
    resourceDesc: 'У меня есть необходимые бюджет, команда и инструменты.',
    risksLabel: 'Возможные риски',
    risksPlaceholder: 'Что может помешать?',
    relevantLabel: 'Relevant (Значимость)',
    relevantDesc: 'Почему эта цель важна для бизнеса именно сейчас?',
    relevantPlaceholder: 'Эта цель поможет...',
    deadlineLabel: 'Time-bound (Ограниченность во времени)',
    deadlineDesc: 'Когда цель должна быть достигнута?',
    createButton: 'Создать цель',
    daysLeft: 'дней осталось',
    overdue: 'Просрочено',
    completed: 'Выполнено',
    pending: 'В процессе',
    delete: 'Удалить',
    back: 'Назад',
    progress: 'Прогресс',
    optional: '(Опционально)',
    missionRelation: 'Как она соотносится с миссией компании?',
    resourcesDescLong: 'У меня есть необходимые навыки, бюджет, время и команда для достижения этой цели.',
    emptyState: 'Нет активных целей',
    emptyStateDesc: 'Нажмите "Добавить цель", чтобы создать свою первую SMART цель',
    urgent: 'Срочно',
    goalSummary: 'Итоговая цель:',
    byDate: 'к'
  },
  en: {
    title: 'SMART Goals',
    subtitle: 'Strategic Planning',
    addGoal: 'Add Goal',
    createTitle: 'Create SMART Goal',
    createDesc: 'Complete all 5 steps to formulate a high-quality and achievable goal.',
    stepSpecific: 'Goal Title',
    stepSpecificPlaceholder: "Short title (e.g., 'Sales Growth')",
    specificLabel: 'Specific',
    specificDesc: 'What exactly do you want to improve? Describe the result in detail.',
    specificPlaceholder: 'I want to increase...',
    next: 'Next',
    metricLabel: 'Metric',
    metricPlaceholder: 'E.g., Revenue, Leads',
    unitLabel: 'Unit',
    unitPlaceholder: 'USD, pcs, %',
    currentLabel: 'Current Value',
    targetLabel: 'Target Value',
    resourceLabel: 'Achievable',
    resourceCheck: 'Resources Confirmed',
    resourceDesc: 'I have the necessary budget, team, and tools.',
    risksLabel: 'Potential Risks',
    risksPlaceholder: 'What could get in the way?',
    relevantLabel: 'Relevant',
    relevantDesc: 'Why is this goal important for the business right now?',
    relevantPlaceholder: 'This goal will help...',
    deadlineLabel: 'Time-bound',
    deadlineDesc: 'When should the goal be achieved?',
    createButton: 'Create Goal',
    daysLeft: 'days left',
    overdue: 'Overdue',
    completed: 'Completed',
    pending: 'In Progress',
    delete: 'Delete',
    back: 'Back',
    progress: 'Progress',
    optional: '(Optional)',
    missionRelation: 'How does it relate to the company mission?',
    resourcesDescLong: 'I have the necessary skills, budget, time, and team to achieve this goal.',
    emptyState: 'No active goals',
    emptyStateDesc: 'Click "Add Goal" to create your first SMART goal',
    urgent: 'Urgent',
    goalSummary: 'Goal Summary:',
    byDate: 'by'
  }
};

interface SmartGoal {
  id: string;
  title: string;
  specific: string;
  measurable: {
    metric: string;
    target: number;
    current: number;
    unit: string;
  };
  achievable: {
    resourcesConfirmed: boolean;
    risks: string;
  };
  relevant: string;
  timebound: {
    deadline: string;
    milestones: { date: string; title: string; completed: boolean }[];
  };
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdAt: string;
}

const DEFAULT_TEMPLATES = [
  {
    title: 'Рост выручки x2',
    s: 'Увеличить ежемесячную выручку компании в 2 раза за счет масштабирования маркетинга.',
    metric: 'Выручка',
    target: 2000000,
    unit: 'KZT',
    r: 'Необходимо для финансирования разработки нового продукта.',
  },
  {
    title: '50 новых лидов',
    s: 'Обеспечить отдел продаж качественными лидами через таргетированную рекламу.',
    metric: 'Лиды',
    target: 50,
    unit: 'шт',
    r: 'Загрузка отдела продаж сейчас составляет 40%, нужно 100%.',
  },
];

interface SmartGoalsProps {
  lang?: 'ru' | 'en';
  channel?: string;
}

export const SmartGoals = ({ lang = 'ru', channel = 'default' }: SmartGoalsProps) => {
  const t = translations[lang];
  const [goals, setGoals] = useState<SmartGoal[]>([]);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('specific');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    specific: '',
    metricName: '',
    targetValue: '',
    currentValue: '',
    unit: '',
    resourcesConfirmed: false,
    risks: '',
    relevant: '',
    deadline: '',
  });

  // Load from localStorage
  useEffect(() => {
    const storageKey = `smart_goals_v2_${channel}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGoals(parsed);
      } catch (e) {
        console.error('Failed to parse goals', e);
      }
    } else {
      setGoals([]);
    }
  }, [channel]);

  // Save to localStorage
  useEffect(() => {
    const storageKey = `smart_goals_v2_${channel}`;
    localStorage.setItem(storageKey, JSON.stringify(goals));
  }, [goals, channel]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: string) => {
    switch (step) {
      case 'specific':
        return formData.title.length > 3 && formData.specific.length > 10;
      case 'measurable':
        return formData.metricName.length > 0 && Number(formData.targetValue) > 0;
      case 'achievable':
        return formData.resourcesConfirmed; // Strict check? Or just warning? Let's require it.
      case 'relevant':
        return formData.relevant.length > 5;
      case 'timebound':
        return formData.deadline.length > 0;
      default:
        return false;
    }
  };

  const handleNext = (current: string, next: string) => {
    if (validateStep(current)) {
      setActiveTab(next);
    } else {
      toast.error('Пожалуйста, заполните все обязательные поля корректно.');
    }
  };

  const handleCreate = () => {
    if (!validateStep('timebound')) {
      toast.error('Укажите дедлайн');
      return;
    }

    const newGoal: SmartGoal = {
      id: crypto.randomUUID(),
      title: formData.title,
      specific: formData.specific,
      measurable: {
        metric: formData.metricName,
        target: Number(formData.targetValue),
        current: Number(formData.currentValue) || 0,
        unit: formData.unit
      },
      achievable: {
        resourcesConfirmed: formData.resourcesConfirmed,
        risks: formData.risks
      },
      relevant: formData.relevant,
      timebound: {
        deadline: formData.deadline,
        milestones: []
      },
      status: 'in_progress',
      createdAt: new Date().toISOString()
    };

    setGoals([...goals, newGoal]);
    setOpen(false);
    resetForm();
    toast.success('Цель успешно создана!');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      specific: '',
      metricName: '',
      targetValue: '',
      currentValue: '',
      unit: '',
      resourcesConfirmed: false,
      risks: '',
      relevant: '',
      deadline: '',
    });
    setActiveTab('specific');
  };

  const handleDelete = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast.success('Цель удалена');
  };

  const updateProgress = (id: string, val: number) => {
    setGoals(goals.map(g => {
      if (g.id === id) {
        const isCompleted = val >= g.measurable.target;
        return {
          ...g,
          measurable: { ...g.measurable, current: val },
          status: isCompleted ? 'completed' : 'in_progress'
        };
      }
      return g;
    }));
  };

  const getDaysLeft = (dateStr: string) => {
    return differenceInDays(new Date(dateStr), new Date());
  };

  return (
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader className="py-4 px-6 bg-muted/30 flex flex-row items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">SMART Цели</CardTitle>
            <CardDescription className="text-xs mt-0.5">Стратегическое планирование</CardDescription>
          </div>
        </div>
        
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить цель
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Создание SMART цели</DialogTitle>
              <DialogDescription>
                Пройдите все 5 шагов, чтобы сформулировать качественную и достижимую цель.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="specific" disabled={!validateStep('specific') && activeTab !== 'specific'} aria-label={t.specificLabel}>S</TabsTrigger>
                <TabsTrigger value="measurable" disabled={!validateStep('measurable') && activeTab !== 'measurable'} aria-label={t.metricLabel}>M</TabsTrigger>
                <TabsTrigger value="achievable" disabled={!validateStep('achievable') && activeTab !== 'achievable'} aria-label={t.resourceLabel}>A</TabsTrigger>
                <TabsTrigger value="relevant" disabled={!validateStep('relevant') && activeTab !== 'relevant'} aria-label={t.relevantLabel}>R</TabsTrigger>
                <TabsTrigger value="timebound" disabled={!validateStep('timebound') && activeTab !== 'timebound'} aria-label={t.deadlineLabel}>T</TabsTrigger>
              </TabsList>

              {/* Step 1: Specific */}
              <TabsContent value="specific" className="space-y-4">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-base">{t.stepSpecific}</Label>
                    <Input 
                      id="title" 
                      placeholder={t.stepSpecificPlaceholder} 
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specific" className="text-base">{t.specificLabel}</Label>
                    <p className="text-sm text-muted-foreground">{t.specificDesc}</p>
                    <Textarea 
                      id="specific" 
                      placeholder={t.specificPlaceholder} 
                      className="min-h-[100px]"
                      value={formData.specific}
                      onChange={(e) => handleInputChange('specific', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => handleNext('specific', 'measurable')}>
                    {t.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 2: Measurable */}
              <TabsContent value="measurable" className="space-y-4">
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metricName" className="text-base">{t.metricLabel}</Label>
                      <Input 
                        id="metricName"
                        placeholder={t.metricPlaceholder} 
                        value={formData.metricName}
                        onChange={(e) => handleInputChange('metricName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-base">{t.unitLabel}</Label>
                      <Input 
                        id="unit"
                        placeholder={t.unitPlaceholder} 
                        value={formData.unit}
                        onChange={(e) => handleInputChange('unit', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentValue" className="text-base">{t.currentLabel}</Label>
                      <Input 
                        id="currentValue"
                        type="number" 
                        placeholder="0" 
                        value={formData.currentValue}
                        onChange={(e) => handleInputChange('currentValue', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetValue" className="text-base">{t.targetLabel}</Label>
                      <Input 
                        id="targetValue"
                        type="number" 
                        placeholder="1000000" 
                        value={formData.targetValue}
                        onChange={(e) => handleInputChange('targetValue', e.target.value)}
                      />
                    </div>
                  </div>
                  {formData.currentValue && formData.targetValue && (
                    <div className="p-4 rounded-lg bg-muted/50 text-sm">
                      <div className="flex justify-between mb-2">
                        <span>{t.progress}</span>
                        <span>{Math.round((Number(formData.currentValue) / Number(formData.targetValue)) * 100)}%</span>
                      </div>
                      <Progress value={(Number(formData.currentValue) / Number(formData.targetValue)) * 100} />
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('specific')}>{t.back}</Button>
                  <Button onClick={() => handleNext('measurable', 'achievable')}>
                    {t.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 3: Achievable */}
              <TabsContent value="achievable" className="space-y-4">
                <div className="space-y-4 py-2">
                  <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/20">
                    <Checkbox 
                      id="resources" 
                      checked={formData.resourcesConfirmed}
                      onCheckedChange={(c) => handleInputChange('resourcesConfirmed', c === true)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="resources" className="text-base font-medium cursor-pointer">
                        {t.resourceCheck}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t.resourcesDescLong}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risks" className="text-base">{t.risksLabel} {t.optional}</Label>
                    <Textarea 
                      id="risks" 
                      placeholder={t.risksPlaceholder} 
                      value={formData.risks}
                      onChange={(e) => handleInputChange('risks', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('measurable')}>{t.back}</Button>
                  <Button onClick={() => handleNext('achievable', 'relevant')}>
                    {t.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 4: Relevant */}
              <TabsContent value="relevant" className="space-y-4">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="relevant" className="text-base">{t.relevantLabel}</Label>
                    <p className="text-sm text-muted-foreground">{t.relevantDesc} {t.missionRelation}</p>
                    <Textarea 
                      id="relevant" 
                      placeholder={t.relevantPlaceholder} 
                      className="min-h-[100px]"
                      value={formData.relevant}
                      onChange={(e) => handleInputChange('relevant', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('achievable')}>{t.back}</Button>
                  <Button onClick={() => handleNext('relevant', 'timebound')}>
                    {t.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 5: Time-bound */}
              <TabsContent value="timebound" className="space-y-4">
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="deadline" className="text-base">{t.deadlineLabel}</Label>
                    <Input 
                      id="deadline" 
                      type="date" 
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                    />
                  </div>
                  
                  {formData.deadline && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm">
                      <div className="font-medium mb-1">{t.goalSummary}</div>
                      "{formData.specific}" {t.byDate} {format(new Date(formData.deadline), 'd MMMM yyyy', { locale: lang === 'ru' ? ru : enUS })}
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('relevant')}>{t.back}</Button>
                  <Button onClick={handleCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Check className="mr-2 h-4 w-4" />
                    {t.createButton}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[500px]">
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <Target className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-sm font-medium">{t.emptyState}</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px] text-center">
              {t.emptyStateDesc}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {goals.map(goal => {
              const progressPercent = Math.min(100, Math.round((goal.measurable.current / goal.measurable.target) * 100));
              const daysLeft = getDaysLeft(goal.timebound.deadline);
              const isOverdue = daysLeft < 0 && goal.status !== 'completed';
              
              return (
                <div key={goal.id} className="p-5 hover:bg-muted/20 transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">{goal.title}</h4>
                        {goal.status === 'completed' && <Badge className="bg-emerald-500 hover:bg-emerald-600">{t.completed}</Badge>}
                        {isOverdue && <Badge variant="destructive">{t.overdue}</Badge>}
                        {daysLeft <= 3 && daysLeft >= 0 && goal.status !== 'completed' && (
                          <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
                            {t.urgent}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1" title={goal.specific}>{goal.specific}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500" 
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-end justify-between text-sm">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">{t.progress}</div>
                        <div className="font-mono font-medium flex items-baseline gap-1">
                          <span className="text-lg">{goal.measurable.current}</span>
                          <span className="text-muted-foreground">/ {goal.measurable.target} {goal.measurable.unit}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${
                        isOverdue ? 'text-red-500' : daysLeft < 7 ? 'text-orange-500' : 'text-emerald-600'
                      }`}>
                        <Clock className="h-3.5 w-3.5" />
                        {isOverdue ? `Просрочено на ${Math.abs(daysLeft)} дн.` : `Осталось ${daysLeft} дн.`}
                      </div>
                    </div>
                    
                    <div className="relative pt-1">
                      <div className="flex items-center gap-3">
                         <Progress 
                           value={progressPercent} 
                           className={cn("h-2.5 flex-1", isOverdue ? "bg-red-100" : "bg-muted")} 
                           // Custom color class passing isn't standard in Shadcn Progress, usually controlled by global theme
                           // We can wrap it or accept it's primary color. 
                           // To force color we need to style the indicator. 
                         />
                         <div className="text-xs font-bold w-9 text-right">{progressPercent}%</div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                       <Label className="text-xs text-muted-foreground whitespace-nowrap">Обновить:</Label>
                       <Input 
                          type="number" 
                          className="h-7 text-xs" 
                          placeholder="Новое значение"
                          defaultValue={goal.measurable.current}
                          onBlur={(e) => updateProgress(goal.id, Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateProgress(goal.id, Number(e.currentTarget.value));
                              e.currentTarget.blur();
                            }
                          }}
                       />
                       <span className="text-xs text-muted-foreground">{goal.measurable.unit}</span>
                    </div>
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
