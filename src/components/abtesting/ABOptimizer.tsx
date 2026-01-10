import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  FlaskConical, 
  Plus, 
  Play,
  Pause,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart3,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: string;
  variant_a_name: string;
  variant_b_name: string;
  variant_a_visitors: number;
  variant_b_visitors: number;
  variant_a_conversions: number;
  variant_b_conversions: number;
  winner: string | null;
  ai_recommendation: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

interface ABOptimizerProps {
  projectId: string;
}

export const ABOptimizer = ({ projectId }: ABOptimizerProps) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    variant_a_name: 'Control',
    variant_b_name: 'Variant B',
  });

  useEffect(() => {
    fetchTests();
  }, [projectId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async () => {
    try {
      const { error } = await supabase.from('ab_tests').insert([{
        project_id: projectId,
        ...newTest,
      }]);

      if (error) throw error;
      
      toast.success('A/B тест создан');
      setIsAddDialogOpen(false);
      setNewTest({ name: '', description: '', variant_a_name: 'Control', variant_b_name: 'Variant B' });
      fetchTests();
    } catch (error) {
      console.error('Error adding test:', error);
      toast.error('Ошибка при создании теста');
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', testId);

      if (error) throw error;
      
      toast.success('Тест запущен');
      fetchTests();
    } catch (error) {
      console.error('Error starting test:', error);
    }
  };

  const handlePauseTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('ab_tests')
        .update({ status: 'paused' })
        .eq('id', testId);

      if (error) throw error;
      
      toast.success('Тест приостановлен');
      fetchTests();
    } catch (error) {
      console.error('Error pausing test:', error);
    }
  };

  const getConversionRate = (conversions: number, visitors: number) => {
    if (visitors === 0) return 0;
    return ((conversions / visitors) * 100).toFixed(2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500/10 text-green-500">Активен</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500">На паузе</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-500">Завершен</Badge>;
      default:
        return <Badge variant="secondary">Черновик</Badge>;
    }
  };

  const runningTests = tests.filter(t => t.status === 'running').length;
  const completedTests = tests.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary" />
            A/B Optimizer
          </h2>
          <p className="text-muted-foreground">ИИ-оптимизация конверсий</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Новый тест
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего тестов</p>
                <p className="text-2xl font-bold">{tests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Play className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl font-bold">{runningTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CheckCircle2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Завершенных</p>
                <p className="text-2xl font-bold">{completedTests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ср. улучшение</p>
                <p className="text-2xl font-bold">+12.4%</p>
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
            AI Рекомендации
            <Badge className="bg-primary/10 text-primary border-primary/20">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Рекомендуется запустить тест для лендинга</p>
                <p className="text-xs text-muted-foreground">
                  ИИ обнаружил, что конверсия упала на 15% за неделю. Предлагаем протестировать новый заголовок.
                </p>
              </div>
              <Button size="sm">Создать тест</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Загрузка...
            </CardContent>
          </Card>
        ) : tests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Нет активных тестов</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Создать первый тест
              </Button>
            </CardContent>
          </Card>
        ) : (
          tests.map((test) => {
            const variantARate = getConversionRate(test.variant_a_conversions, test.variant_a_visitors);
            const variantBRate = getConversionRate(test.variant_b_conversions, test.variant_b_visitors);
            const improvement = Number(variantBRate) - Number(variantARate);

            return (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        {getStatusBadge(test.status)}
                      </div>
                      <CardDescription>{test.description || 'Без описания'}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {test.status === 'draft' || test.status === 'paused' ? (
                        <Button size="sm" onClick={() => handleStartTest(test.id)}>
                          <Play className="w-4 h-4 mr-1" />
                          Запустить
                        </Button>
                      ) : test.status === 'running' ? (
                        <Button size="sm" variant="outline" onClick={() => handlePauseTest(test.id)}>
                          <Pause className="w-4 h-4 mr-1" />
                          Пауза
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Variant A */}
                    <div className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{test.variant_a_name}</span>
                        <Badge variant="outline">Control</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Посетители</span>
                          <span className="font-medium">{test.variant_a_visitors.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Конверсии</span>
                          <span className="font-medium">{test.variant_a_conversions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CR</span>
                          <span className="font-bold text-lg">{variantARate}%</span>
                        </div>
                        <Progress value={Number(variantARate)} className="h-2" />
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className={`p-4 rounded-lg border ${improvement > 0 ? 'border-green-500/50 bg-green-500/5' : 'bg-muted/30'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{test.variant_b_name}</span>
                        {improvement > 0 && (
                          <Badge className="bg-green-500/10 text-green-500">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +{improvement.toFixed(2)}%
                          </Badge>
                        )}
                        {improvement < 0 && (
                          <Badge className="bg-red-500/10 text-red-500">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {improvement.toFixed(2)}%
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Посетители</span>
                          <span className="font-medium">{test.variant_b_visitors.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Конверсии</span>
                          <span className="font-medium">{test.variant_b_conversions.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">CR</span>
                          <span className="font-bold text-lg">{variantBRate}%</span>
                        </div>
                        <Progress value={Number(variantBRate)} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {test.ai_recommendation && (
                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI рекомендация:</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{test.ai_recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Test Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать A/B тест</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название теста</Label>
              <Input
                value={newTest.name}
                onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                placeholder="Тест заголовка лендинга"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                placeholder="Сравниваем два варианта заголовка..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Вариант A (Control)</Label>
                <Input
                  value={newTest.variant_a_name}
                  onChange={(e) => setNewTest({ ...newTest, variant_a_name: e.target.value })}
                  placeholder="Control"
                />
              </div>
              <div className="space-y-2">
                <Label>Вариант B</Label>
                <Input
                  value={newTest.variant_b_name}
                  onChange={(e) => setNewTest({ ...newTest, variant_b_name: e.target.value })}
                  placeholder="Variant B"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddTest} disabled={!newTest.name}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
