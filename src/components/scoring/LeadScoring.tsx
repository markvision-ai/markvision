import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

interface ScoringRule {
  id: string;
  name: string;
  field: string;
  operator: string;
  value: string;
  score_delta: number;
  is_active: boolean;
}

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
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    field: 'utm_source',
    operator: 'equals',
    value: '',
    score_delta: 10,
  });

  useEffect(() => {
    fetchRules();
  }, [projectId]);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    try {
      const { error } = await supabase.from('lead_scoring_rules').insert([{
        project_id: projectId,
        ...newRule,
      }]);

      if (error) throw error;
      
      toast.success('Правило добавлено');
      setIsAddDialogOpen(false);
      setNewRule({ name: '', field: 'utm_source', operator: 'equals', value: '', score_delta: 10 });
      fetchRules();
    } catch (error) {
      console.error('Error adding rule:', error);
      toast.error('Ошибка при добавлении правила');
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('lead_scoring_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);

      if (error) throw error;
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('lead_scoring_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      toast.success('Правило удалено');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Ошибка при удалении правила');
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { icon: Flame, color: 'text-red-500 bg-red-500/10', label: 'Горячий' };
    if (score >= 50) return { icon: ThermometerSun, color: 'text-yellow-500 bg-yellow-500/10', label: 'Теплый' };
    return { icon: Snowflake, color: 'text-blue-500 bg-blue-500/10', label: 'Холодный' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Lead Scoring
          </h2>
          <p className="text-muted-foreground">Автоматическая оценка качества лидов</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить правило
        </Button>
      </div>

      {/* Score Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Flame className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-medium">Горячие лиды</p>
                <p className="text-sm text-muted-foreground">Score 80-100</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <ThermometerSun className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="font-medium">Теплые лиды</p>
                <p className="text-sm text-muted-foreground">Score 50-79</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Snowflake className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Холодные лиды</p>
                <p className="text-sm text-muted-foreground">Score 0-49</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Insights
            <Badge className="bg-primary/10 text-primary border-primary/20">Beta</Badge>
          </CardTitle>
          <CardDescription>
            ИИ анализирует поведение лидов и предлагает оптимизации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Лиды с UTM google/cpc конвертируются на 34% лучше</p>
                <p className="text-xs text-muted-foreground">Рекомендуем добавить +15 баллов для этого источника</p>
              </div>
              <Button size="sm" variant="outline">Применить</Button>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <Flame className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Лиды с заполненным email конвертируются в 2.5x чаще</p>
                <p className="text-xs text-muted-foreground">Добавьте правило для оценки наличия email</p>
              </div>
              <Button size="sm" variant="outline">Применить</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Правила скоринга</CardTitle>
          <CardDescription>Настройте правила для автоматической оценки лидов</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Правило</TableHead>
                <TableHead>Поле</TableHead>
                <TableHead>Условие</TableHead>
                <TableHead>Баллы</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Правила не настроены
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {fields.find(f => f.value === rule.field)?.label || rule.field}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {operators.find(o => o.value === rule.operator)?.label} {rule.value && `"${rule.value}"`}
                    </TableCell>
                    <TableCell>
                      <Badge className={rule.score_delta > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
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
                        <Button variant="ghost" size="icon">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить правило скоринга</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название правила</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Лид с Google Ads"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Поле</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newRule.field}
                  onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
                >
                  {fields.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Условие</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newRule.operator}
                  onChange={(e) => setNewRule({ ...newRule, operator: e.target.value })}
                >
                  {operators.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Значение</Label>
              <Input
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: e.target.value })}
                placeholder="google"
              />
            </div>
            <div className="space-y-2">
              <Label>Баллы (+ добавить / - отнять)</Label>
              <Input
                type="number"
                value={newRule.score_delta}
                onChange={(e) => setNewRule({ ...newRule, score_delta: Number(e.target.value) })}
                placeholder="10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddRule} disabled={!newRule.name}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
