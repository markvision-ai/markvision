// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { BackgroundGradient } from '@/components/ui/background-gradient';
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

  useEffect(() => {
    fetchRules();
    fetchInsights();
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
      setRules(rows.map(mapRuleFromDb) || []);
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
      // Получаем все активные правила
      const activeRules = rules.filter(r => r.is_active);
      
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-[16px] sm:text-2xl">
            <Target className="w-6 h-6 text-primary" />
            Lead Scoring
          </h2>
          <p className="text-muted-foreground text-[14px]">Автоматическая оценка качества лидов</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={recalculateScores} 
            disabled={isRecalculating}
            className="text-[14px]"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRecalculating && "animate-spin")} />
            Пересчитать баллы
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="text-[14px]">
            <Plus className="w-4 h-4 mr-2" />
            Добавить правило
          </Button>
        </div>
      </div>

      {/* Score Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md shadow-red-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Flame className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium text-[14px]">Горячие лиды</p>
                <p className="text-sm text-muted-foreground">Score 80-100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md shadow-yellow-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <ThermometerSun className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium text-[14px]">Теплые лиды</p>
                <p className="text-sm text-muted-foreground">Score 50-79</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-md shadow-blue-500/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Snowflake className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-[14px]">Холодные лиды</p>
                <p className="text-sm text-muted-foreground">Score 0-49</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <BackgroundGradient className="rounded-2xl">
        <Card className="border-0 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[16px]">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Insights
              <Badge className="bg-primary/10 text-primary border-primary/20">Beta</Badge>
            </CardTitle>
            <CardDescription className="text-[14px]">
              ИИ анализирует поведение лидов и предлагает оптимизации
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-[14px]">
                Нет новых AI инсайтов
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-background/70 border border-primary/10"
                  >
                    <div className="flex-shrink-0">
                      {(insight.confidence_score ?? 0.5) >= 0.7 ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <Zap className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[14px]">{insight.title}</p>
                      {insight.description && (
                        <p className="text-xs text-muted-foreground mt-1 text-[14px]">{insight.description}</p>
                      )}
                      {insight.suggested_score_delta && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Рекомендуется: {insight.suggested_score_delta > 0 ? '+' : ''}{insight.suggested_score_delta} баллов
                        </p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleApplyInsight(insight)}
                      className="text-[14px] flex-shrink-0"
                    >
                      Применить
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </BackgroundGradient>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[16px]">Правила скоринга</CardTitle>
          <CardDescription className="text-[14px]">Настройте правила для автоматической оценки лидов</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[14px]">Правило</TableHead>
                <TableHead className="text-[14px]">Поле</TableHead>
                <TableHead className="text-[14px]">Условие</TableHead>
                <TableHead className="text-[14px]">Баллы</TableHead>
                <TableHead className="text-[14px]">Статус</TableHead>
                <TableHead className="text-[14px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[14px]">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-[14px]">
                    Правила не настроены
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium text-[14px]">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[14px]">
                        {fields.find(f => f.value === rule.field)?.label || rule.field}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[14px]">
                      {operators.find(o => o.value === rule.operator)?.label} {rule.value && `"${rule.value}"`}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[14px]",
                        rule.score_delta > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      )}>
                        {rule.score_delta > 0 ? '+' : ''}{rule.score_delta}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
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
        </CardContent>
      </Card>

      {/* Add Rule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Добавить правило скоринга</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[14px]">Название правила *</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Лид с Google Ads"
                className="text-[14px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[14px]">Поле *</Label>
                <Select
                  value={newRule.field}
                  onValueChange={(value) => setNewRule({ ...newRule, field: value })}
                >
                  <SelectTrigger className="text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map(f => (
                      <SelectItem key={f.value} value={f.value} className="text-[14px]">
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[14px]">Условие *</Label>
                <Select
                  value={newRule.operator}
                  onValueChange={(value) => setNewRule({ ...newRule, operator: value })}
                >
                  <SelectTrigger className="text-[14px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map(o => (
                      <SelectItem key={o.value} value={o.value} className="text-[14px]">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[14px]">Значение</Label>
              <Input
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                placeholder="google"
                className="text-[14px]"
                disabled={newRule.operator === 'is_not_empty' || newRule.operator === 'is_empty'}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[14px]">Баллы (+ добавить / - отнять) *</Label>
              <Input
                type="number"
                value={newRule.score_delta}
                onChange={(e) => setNewRule({ ...newRule, score_delta: Number(e.target.value) })}
                placeholder="10"
                className="text-[14px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="text-[14px]">
              Отмена
            </Button>
            <Button onClick={handleAddRule} disabled={!newRule.name} className="text-[14px]">
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
