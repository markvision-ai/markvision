// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Target,
  Plus,
  Flame,
  Snowflake,
  ThermometerSun,
  Sparkles,
  Trash2,
  Edit2,
  TrendingUp,
  Zap,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScoringRule {
  id: string;
  name: string;
  field: string;
  operator: string;
  value: string;
  score_delta: number;
  is_active: boolean;
  created_at: string;
}

// Map database columns to interface
const mapRuleFromDb = (dbRule: any): ScoringRule => ({
  id: dbRule.id,
  name: dbRule.criteria_name, // Map criteria_name to name
  field: dbRule.field || 'utm_source', // Provide default if missing
  operator: dbRule.operator || 'equals',
  value: dbRule.value || '',
  score_delta: dbRule.points || 0, // Map points to score_delta
  is_active: dbRule.is_active ?? true,
  created_at: dbRule.created_at
});

interface ScoringInsight {
  id: string;
  title: string;
  description: string | null;
  recommendation_type: string;
  suggested_field: string | null;
  suggested_operator: string | null;
  suggested_value: string | null;
  suggested_score_delta: number | null;
  confidence_score?: number; // optional — column may not exist in DB
  status: string;
  created_at: string;
}

// Map insights from DB schema to UI interface
const mapInsightFromDb = (dbInsight: any): ScoringInsight => ({
  id: dbInsight.id,
  title: dbInsight.insight_text?.slice(0, 60) || 'AI Insight',
  description: dbInsight.insight_text || null,
  recommendation_type: dbInsight.recommendation_type || 'rule_suggestion',
  suggested_field: dbInsight.suggested_field || null,
  suggested_operator: dbInsight.suggested_operator || null,
  suggested_value: dbInsight.suggested_value || null,
  suggested_score_delta: dbInsight.recommended_points ?? null,
  confidence_score: dbInsight.impact_percent ?? undefined,
  status: dbInsight.status || 'pending',
  created_at: dbInsight.created_at,
});

interface LeadScoringProps {
  projectId: string;
}

type ScoreStats = {
  hot: number;
  warm: number;
  cold: number;
  avg: number;
};

const operators = [
  { value: 'equals', label: 'Равно' },
  { value: 'contains', label: 'Содержит' },
  { value: 'greater_than', label: 'Больше' },
  { value: 'less_than', label: 'Меньше' },
  { value: 'is_not_empty', label: 'Заполнено' },
  { value: 'is_empty', label: 'Не заполнено' },
];

const fields = [
  { value: 'utm_source', label: 'UTM Source' },
  { value: 'utm_medium', label: 'UTM Medium' },
  { value: 'utm_campaign', label: 'UTM Campaign' },
  { value: 'deal_amount', label: 'Сумма сделки' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'status', label: 'Статус' },
];

export const LeadScoring = ({ projectId }: LeadScoringProps) => {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [orderedRules, setOrderedRules] = useState<ScoringRule[]>([]);
  const [insights, setInsights] = useState<ScoringInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    field: 'utm_source',
    operator: 'equals',
    value: '',
    score_delta: 10,
  });
  const [scoreStats, setScoreStats] = useState<ScoreStats>({ hot: 0, warm: 0, cold: 0, avg: 0 });
  const [segmentLeads, setSegmentLeads] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
    fetchInsights();
    fetchScoreStats();
    fetchSegmentLeads();
  }, [projectId]);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('scoring_rules')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows: any[] = (data as any[]) || [];
      const mapped = rows.map(mapRuleFromDb) || [];
      setRules(mapped);
      setOrderedRules(prev => prev.length ? prev : mapped);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Ошибка загрузки правил');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('scoring_insights')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      const rows: any[] = (data as any[]) || [];
      setInsights(rows.map(mapInsightFromDb));
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const fetchScoreStats = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('lead_score')
        .eq('project_id', projectId);
      if (error) throw error;
      const scores = (data as any[]).map(d => Number(d.lead_score || 0));
      const hot = scores.filter(s => s >= 80).length;
      const warm = scores.filter(s => s >= 50 && s < 80).length;
      const cold = scores.filter(s => s < 50).length;
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      setScoreStats({ hot, warm, cold, avg });
    } catch (e) {
      console.error('Error fetching score stats:', e);
    }
  };

  const fetchSegmentLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, lead_score, utm_source, status')
        .eq('project_id', projectId);
      if (error) throw error;
      setSegmentLeads((data as any[]) || []);
    } catch (e) {
      console.error('Error fetching segmented leads:', e);
    }
  };

  const filteredSegments = segmentLeads.filter(l => {
    if (selectedSource && selectedSource !== 'all' && (l.utm_source || '').toLowerCase() !== selectedSource) return false;
    if (selectedStatus && selectedStatus !== 'all' && l.status !== selectedStatus) return false;
    return true;
  });

  const distributionData = [
    { name: 'Горячие', value: filteredSegments.filter(s => (s.lead_score || 0) >= 80).length, fill: 'hsl(0 84% 60%)' },
    { name: 'Тёплые', value: filteredSegments.filter(s => (s.lead_score || 0) >= 50 && (s.lead_score || 0) < 80).length, fill: 'hsl(40 90% 60%)' },
    { name: 'Холодные', value: filteredSegments.filter(s => (s.lead_score || 0) < 50).length, fill: 'hsl(220 90% 60%)' },
  ];

  // DnD priorization
  const SortableItem = ({ rule }: { rule: ScoringRule }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
    return (
      <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-white/50">
        <div className="flex items-center gap-3">
          <div {...listeners} {...attributes} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center cursor-grab">
            <span className="text-xs text-muted-foreground">⋮⋮</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{rule.name}</p>
            <p className="text-xs text-muted-foreground">Вес: {rule.score_delta > 0 ? '+' : ''}{rule.score_delta}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">{fields.find(f => f.value === rule.field)?.label || rule.field}</Badge>
      </div>
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentIndex = orderedRules.findIndex(r => r.id === active.id);
    const overIndex = orderedRules.findIndex(r => r.id === over.id);
    const next = [...orderedRules];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(overIndex, 0, moved);
    setOrderedRules(next);
  };

  const handleAddRule = async () => {
    if (!newRule.name) {
      toast.error('Введите название правила');
      return;
    }

    try {
      const { error } = await supabase.from('scoring_rules').insert([{
        project_id: projectId,
        criteria_name: newRule.name, // Map name to criteria_name
        points: newRule.score_delta, // Map score_delta to points
        field: newRule.field,
        operator: newRule.operator,
        value: newRule.value,
        is_active: true,
      } as any]);

      if (error) throw error;

      toast.success('Правило добавлено');
      setIsAddDialogOpen(false);
      setNewRule({ name: '', field: 'utm_source', operator: 'equals', value: '', score_delta: 10 });
      await fetchRules();
      // Пересчитываем баллы после добавления правила
      await recalculateScores();
    } catch (error) {
      console.error('Error adding rule:', error);
      toast.error('Ошибка при добавлении правила');
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scoring_rules')
        .update({ is_active: isActive } as any)
        .eq('id', ruleId);

      if (error) throw error;
      await fetchRules();
      // Пересчитываем баллы при изменении статуса правила
      await recalculateScores();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Ошибка при изменении правила');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('scoring_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast.success('Правило удалено');
      await fetchRules();
      // Пересчитываем баллы после удаления правила
      await recalculateScores();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Ошибка при удалении правила');
    }
  };

  const recalculateScores = async () => {
    setIsRecalculating(true);
    try {
      // Получаем все активные правила с учётом приоритета
      const base = orderedRules.length ? orderedRules : rules;
      const activeRules = base.filter(r => r.is_active);

      if (activeRules.length === 0) {
        toast.info('Нет активных правил для пересчета');
        setIsRecalculating(false);
        return;
      }

      // Получаем все лиды проекта
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id, utm_source, utm_medium, utm_campaign, deal_amount, email, phone, status')
        .eq('project_id', projectId);

      if (leadsError) throw leadsError;

      if (!leads || leads.length === 0) {
        setIsRecalculating(false);
        return;
      }

      // Пересчитываем баллы для каждого лида
      const updates = leads.map(lead => {
        let score = 0;

        activeRules.forEach(rule => {
          const fieldValue = (lead as any)[rule.field];
          let matches = false;

          switch (rule.operator) {
            case 'equals':
              matches = String(fieldValue || '').toLowerCase() === String(rule.value || '').toLowerCase();
              break;
            case 'contains':
              matches = String(fieldValue || '').toLowerCase().includes(String(rule.value || '').toLowerCase());
              break;
            case 'greater_than':
              matches = Number(fieldValue || 0) > Number(rule.value || 0);
              break;
            case 'less_than':
              matches = Number(fieldValue || 0) < Number(rule.value || 0);
              break;
            case 'is_not_empty':
              matches = fieldValue != null && fieldValue !== '';
              break;
            case 'is_empty':
              matches = fieldValue == null || fieldValue === '';
              break;
          }

          if (matches) {
            score += rule.score_delta;
          }
        });

        // Определяем label на основе score
        let scoreLabel = 'Холодный';
        if (score >= 80) scoreLabel = 'Горячий';
        else if (score >= 50) scoreLabel = 'Теплый';

        return {
          id: lead.id,
          lead_score: Math.max(0, Math.min(100, score)), // Ограничиваем от 0 до 100
          score_label: scoreLabel,
        };
      });

      // Обновляем лиды батчами по 100
      for (let i = 0; i < updates.length; i += 100) {
        const batch = updates.slice(i, i + 100);
        const promises = batch.map(update =>
          supabase
            .from('leads')
            .update({
              lead_score: update.lead_score,
            })
            .eq('id', update.id)
        );
        await Promise.all(promises);
      }

      toast.success(`Баллы пересчитаны для ${updates.length} лидов`);
      await fetchScoreStats();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      toast.error('Ошибка при пересчете баллов');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleApplyInsight = async (insight: ScoringInsight) => {
    try {
      if (!insight.suggested_field || !insight.suggested_operator || insight.suggested_score_delta === null) {
        toast.error('Недостаточно данных для создания правила');
        return;
      }

      // Создаем правило из инсайта
      const { error: ruleError } = await supabase.from('scoring_rules').insert([{
        project_id: projectId,
        criteria_name: insight.title, // Map title to criteria_name
        field: insight.suggested_field,
        operator: insight.suggested_operator,
        value: insight.suggested_value || '',
        points: insight.suggested_score_delta, // Map suggested_score_delta to points
        is_active: true,
      } as any]);

      if (ruleError) throw ruleError;

      // Обновляем статус инсайта
      const { error: insightError } = await supabase
        .from('scoring_insights')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
        })
        .eq('id', insight.id);

      if (insightError) throw insightError;

      toast.success('Правило применено из AI инсайта');
      await fetchRules();
      await fetchInsights();
      await recalculateScores();
    } catch (error) {
      console.error('Error applying insight:', error);
      toast.error('Ошибка при применении инсайта');
    }
  };

  const sourceOptions = Array.from(new Set(segmentLeads.map(l => (l.utm_source || '').toLowerCase()).filter(Boolean)));
  const statusLabels: Record<string, string> = {
    all: 'Все',
    new: 'Новая',
    in_progress: 'В работе',
    no_answer: 'Недозвон',
    appointment: 'Записан',
    invoiced: 'Выставлен счёт',
    paid: 'Оплачено',
    cancelled: 'Отказ',
    visit_completed: 'Визит завершён',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black flex items-center gap-3 text-foreground uppercase tracking-tight">
            <div className="p-3 rounded-[20px] bg-white/5 border border-white/10 shadow-interstellar">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            Рейтинг заявок
          </h2>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Автоматическая оценка качества лидов на базе ИИ и правил</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="lg" onClick={recalculateScores} disabled={isRecalculating} className="border-white/10 bg-white/5 hover:bg-white/10 font-bold px-6 py-6 rounded-2xl h-auto shadow-sm">
            <RefreshCw className={cn("w-5 h-5 mr-2", isRecalculating && "animate-spin")} />
            Пересчитать баллы
          </Button>
          <Button size="lg" onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-8 py-6 rounded-2xl h-auto shadow-lg shadow-blue-500/20">
            <Plus className="w-5 h-5 mr-2" />
            Добавить правило
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Средний балл', value: scoreStats.avg, color: 'text-foreground', line: 'bg-blue-500' },
          { label: 'Горячие (80–100)', value: scoreStats.hot, color: 'text-rose-500', line: 'bg-rose-500' },
          { label: 'Тёплые (50–79)', value: scoreStats.warm, color: 'text-amber-500', line: 'bg-amber-500' },
          { label: 'Холодные (0–49)', value: scoreStats.cold, color: 'text-cyan-500', line: 'bg-cyan-500' },
        ].map((kpi, idx) => (
          <Card key={idx} className="bg-[#020617]/40 backdrop-blur-3xl shadow-interstellar border border-white/10 rounded-[24px] overflow-hidden group hover:scale-[1.02] transition-transform duration-500 relative">
            <CardContent className="p-6">
              <p className={cn("text-4xl font-black tracking-tighter mb-1", kpi.color)}>{kpi.value}</p>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60">{kpi.label}</p>
              <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-30", kpi.line)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution & Filters */}
      <Card className="bg-[#020617]/40 backdrop-blur-3xl shadow-interstellar border border-white/10 rounded-[32px] overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
          <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">Аналитика распределения</CardTitle>
          <CardDescription className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Фильтрация и сегментация по источникам</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="w-full md:w-2/3">
              <ChartContainer
                config={{
                  hot: { label: 'Горячие', color: 'hsl(0 84% 60%)' },
                  warm: { label: 'Тёплые', color: 'hsl(40 90% 60%)' },
                  cold: { label: 'Холодные', color: 'hsl(220 90% 60%)' },
                }}
                className="h-72"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={6}
                    strokeWidth={0}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="w-full md:w-1/3 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1 opacity-60">Источник трафика</Label>
                <Select value={selectedSource || 'all'} onValueChange={(v) => setSelectedSource(v || 'all')}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12 font-black focus:ring-blue-500/20 text-xs">
                    <SelectValue placeholder="Все источники" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/10 bg-[#020617]/95 backdrop-blur-xl shadow-interstellar">
                    <SelectItem value="all" className="font-black text-xs uppercase">Все (Global)</SelectItem>
                    {sourceOptions.length > 0
                      ? sourceOptions.map(s => <SelectItem key={s} value={s} className="uppercase font-bold text-xs">{s}</SelectItem>)
                      : ['yandex', 'google', 'vk', 'facebook', 'instagram', 'telegram', 'whatsapp', 'manual', 'website', 'referral'].map(s => (
                        <SelectItem key={s} value={s} className="uppercase font-bold text-xs">{s}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1 opacity-60">Текущий статус</Label>
                <Select value={selectedStatus || 'all'} onValueChange={(v) => setSelectedStatus(v || 'all')}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12 font-black focus:ring-blue-500/20 text-xs">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/10 bg-[#020617]/95 backdrop-blur-xl shadow-interstellar">
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="font-bold text-xs">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Legend */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Горячие', range: '80–100', icon: Flame, color: 'bg-rose-500/10 text-rose-400', border: 'border-rose-500/20' },
          { label: 'Тёплые', range: '50–79', icon: ThermometerSun, color: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/20' },
          { label: 'Холодные', range: '0–49', icon: Snowflake, color: 'bg-cyan-500/10 text-cyan-400', border: 'border-cyan-500/20' },
        ].map((item, idx) => (
          <div key={idx} className={cn("flex items-center gap-4 rounded-2xl bg-white/5 backdrop-blur-xl border px-6 py-3 shadow-interstellar", item.border)}>
            <div className={cn("p-2.5 rounded-xl border", item.color, item.border)}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-foreground opacity-80">{item.label}</p>
              <p className="text-sm font-black text-foreground opacity-40">{item.range}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Упрощение: AI Insights убран */}

      {/* Упрощение: убрана визуализация весов */}

      {/* Rules Table */}
      <Card className="bg-[#020617]/40 backdrop-blur-3xl shadow-interstellar border border-white/10 rounded-[32px] overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
          <CardTitle className="text-lg font-black text-foreground uppercase tracking-tight">Настройка логики</CardTitle>
          <CardDescription className="text-[10px] font-black uppercase tracking-widest opacity-60">Управление правилами автоматического скоринга</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5 hover:bg-white/5 border-b border-white/5">
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-6 py-5">Название правила</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest py-5">Параметр</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest py-5">Условие</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest py-5">Воздействие</TableHead>
                  <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest py-5 text-center">Статус</TableHead>
                  <TableHead className="w-24 pr-6 py-5 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500/20" />
                        <span className="text-xs font-black uppercase tracking-widest opacity-40">Синхронизация...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 mb-2 shadow-inner">
                          <Target className="w-10 h-10 text-white/20" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground opacity-40">Правила не найдены</span>
                        <Button variant="link" onClick={() => setIsAddDialogOpen(true)} className="text-blue-400 font-black uppercase text-[10px] tracking-widest p-0 h-auto">Создать первое правило</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id} className="hover:bg-white/5 transition-colors border-b border-white/5 group">
                      <TableCell className="font-black text-sm text-foreground pl-6 py-5 uppercase tracking-tighter">{rule.name}</TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/10 bg-white/5 text-muted-foreground px-2 py-0.5 rounded-md">
                          {fields.find(f => f.value === rule.field)?.label || rule.field}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground py-4">
                        <span className="opacity-60">{operators.find(o => o.value === rule.operator)?.label}</span> {rule.value && <span className="text-foreground ml-1">«{rule.value}»</span>}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-black shadow-sm",
                          rule.score_delta > 0
                            ? "bg-blue-600 text-white shadow-blue-500/20"
                            : "bg-red-500 text-white shadow-red-500/20"
                        )}>
                          {rule.score_delta > 0 ? '+' : ''}{rule.score_delta}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </TableCell>
                      <TableCell className="pr-6 py-4">
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/10 text-white/40 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-white/40 hover:text-rose-500"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Упрощение: убрана приоритизация (Drag-n-Drop) */}

      {/* Упрощение: убран экспорт CSV */}

      {/* Add Rule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg bg-[#020617]/95 backdrop-blur-2xl border border-white/10 shadow-interstellar rounded-[32px] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight">Добавить правило скоринга</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 opacity-60">Название правила *</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Например: Лид с Google Ads"
                className="bg-white/5 border-white/10 text-foreground h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 opacity-60">Поле</Label>
                <Select
                  value={newRule.field}
                  onValueChange={(value) => setNewRule({ ...newRule, field: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-foreground h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#020617]/95 border-white/10 rounded-xl">
                    {fields.map(f => (
                      <SelectItem key={f.value} value={f.value} className="text-xs font-bold">{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 opacity-60">Условие</Label>
                <Select
                  value={newRule.operator}
                  onValueChange={(value) => setNewRule({ ...newRule, operator: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-foreground h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#020617]/95 border-white/10 rounded-xl">
                    {operators.map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-xs font-bold">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 opacity-60">Значение</Label>
              <Input
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                placeholder="google"
                className="bg-white/5 border-white/10 text-foreground h-12 rounded-xl"
                disabled={newRule.operator === 'is_not_empty' || newRule.operator === 'is_empty'}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 opacity-60">Баллы (+ добавить / − отнять)</Label>
              <Input
                type="number"
                value={newRule.score_delta}
                onChange={(e) => setNewRule({ ...newRule, score_delta: Number(e.target.value) })}
                placeholder="10"
                className="bg-white/5 border-white/10 text-foreground h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pt-6 border-t border-white/5">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest rounded-xl px-6 py-5 h-auto">
              Отмена
            </Button>
            <Button onClick={handleAddRule} disabled={!newRule.name} className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-xl px-8 py-5 h-auto shadow-lg shadow-blue-500/20">
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
