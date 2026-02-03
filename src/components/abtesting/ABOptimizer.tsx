// @ts-nocheck
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
  FlaskConical, 
  Plus, 
  Play,
  Pause,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BarChart3,
  Zap,
  DollarSign,
  Users,
  Target,
  Trophy,
  Swords
} from 'lucide-react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { cn } from '@/lib/utils';

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
  page_path: string | null;
  variant_a_title: string | null;
  variant_a_text: string | null;
  variant_b_title: string | null;
  variant_b_text: string | null;
}

interface TestStats {
  totalLeads: number;
  conversionRate: number;
  revenue: number;
  variantA: {
    leads: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  };
  variantB: {
    leads: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
  };
}

interface ABOptimizerProps {
  projectId: string;
}

const AVAILABLE_PAGES = [
  { value: '/', label: 'Главная страница' },
  { value: '/landing', label: 'Лендинг' },
  { value: '/blog', label: 'Блог' },
  { value: '/partners', label: 'Партнеры' },
];

export const ABOptimizer = ({ projectId }: ABOptimizerProps) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    page_path: '',
    variant_a_name: 'Control',
    variant_b_name: 'Variant B',
    variant_a_title: '',
    variant_a_text: '',
    variant_b_title: '',
    variant_b_text: '',
  });

  useEffect(() => {
    fetchTests();
  }, [projectId]);

  useEffect(() => {
    if (tests.length > 0) {
      fetchStats();
      const interval = setInterval(fetchStats, 5000); // Обновление каждые 5 секунд
      return () => clearInterval(interval);
    }
  }, [tests, projectId]);

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

  const fetchStats = async () => {
    try {
      // Получаем все активные тесты
      const activeTests = tests.filter(t => t.status === 'running');
      if (activeTests.length === 0) {
        setStats(null);
        return;
      }

      const testIds = activeTests.map(t => t.id);

      // Получаем статистику по лидам для всех активных тестов
      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, ab_test_id, ab_test_variant, deal_amount, status')
        .in('ab_test_id', testIds)
        .not('ab_test_id', 'is', null);

      if (error) throw error;

      // Подсчитываем статистику
      const totalLeads = leads?.length || 0;
      const conversions = leads?.filter(l => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length || 0;
      const revenue = leads?.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0) || 0;
      const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

      // Статистика по вариантам
      const variantALeads = leads?.filter(l => l.ab_test_variant === 'a') || [];
      const variantBLeads = leads?.filter(l => l.ab_test_variant === 'b') || [];

      const variantAStats = {
        leads: variantALeads.length,
        conversions: variantALeads.filter(l => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length,
        revenue: variantALeads.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0),
        conversionRate: variantALeads.length > 0 
          ? (variantALeads.filter(l => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length / variantALeads.length) * 100 
          : 0,
      };

      const variantBStats = {
        leads: variantBLeads.length,
        conversions: variantBLeads.filter(l => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length,
        revenue: variantBLeads.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0),
        conversionRate: variantBLeads.length > 0 
          ? (variantBLeads.filter(l => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length / variantBLeads.length) * 100 
          : 0,
      };

      setStats({
        totalLeads,
        conversionRate,
        revenue,
        variantA: variantAStats,
        variantB: variantBStats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddTest = async () => {
    if (!newTest.name || !newTest.page_path || !newTest.variant_a_title || !newTest.variant_b_title) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      const { error } = await supabase.from('ab_tests').insert([{
        project_id: projectId,
        ...newTest,
      }]);

      if (error) throw error;
      
      toast.success('A/B тест создан');
      setIsAddDialogOpen(false);
      setNewTest({
        name: '',
        description: '',
        page_path: '',
        variant_a_name: 'Control',
        variant_b_name: 'Variant B',
        variant_a_title: '',
        variant_a_text: '',
        variant_b_title: '',
        variant_b_text: '',
      });
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
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Активен</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">На паузе</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Завершен</Badge>;
      default:
        return <Badge variant="secondary">Черновик</Badge>;
    }
  };

  const runningTests = tests.filter(t => t.status === 'running').length;
  const completedTests = tests.filter(t => t.status === 'completed').length;
  const activeTest = tests.find(t => t.status === 'running' && (!selectedTest || t.id === selectedTest));

  // Определяем лидера по revenue
  const leader = stats && stats.variantA.revenue > stats.variantB.revenue ? 'a' : 
                 stats && stats.variantB.revenue > stats.variantA.revenue ? 'b' : null;

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

      {/* Stats Cards - с реальными данными */}
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
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего лидов</p>
                <p className="text-2xl font-bold">{stats?.totalLeads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Выручка</p>
                <p className="text-2xl font-bold">
                  {stats?.revenue ? new Intl.NumberFormat('ru-RU').format(stats.revenue) : '0'} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Battle View для активного теста */}
      {activeTest && stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BackgroundGradient className="rounded-2xl">
            <Card className="border-0 bg-background/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Swords className="w-5 h-5 text-primary" />
                      Battle View: {activeTest.name}
                    </CardTitle>
                    <CardDescription>{activeTest.description || 'Сравнение вариантов в реальном времени'}</CardDescription>
                  </div>
                  {getStatusBadge(activeTest.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Variant A */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      "relative p-6 rounded-xl border-2 transition-all duration-300",
                      leader === 'a' 
                        ? "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20" 
                        : "border-border bg-muted/30"
                    )}
                  >
                    {leader === 'a' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2 shadow-lg"
                      >
                        <Trophy className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold">{activeTest.variant_a_name}</span>
                      <Badge variant="outline">Control</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Лиды</span>
                          <span className="font-bold text-lg">{stats.variantA.leads}</span>
                        </div>
                        <Progress 
                          value={stats.variantA.leads > 0 ? Math.min((stats.variantA.leads / (stats.variantA.leads + stats.variantB.leads)) * 100, 100) : 0} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Конверсия (CR)</span>
                          <span className="font-bold text-lg">{stats.variantA.conversionRate.toFixed(2)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(stats.variantA.conversionRate, 100)} 
                          className="h-2 bg-blue-500/20"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-bold text-lg text-green-500">
                            {new Intl.NumberFormat('ru-RU').format(stats.variantA.revenue)} ₽
                          </span>
                        </div>
                        <Progress 
                          value={stats.variantA.revenue > 0 && stats.variantB.revenue > 0 
                            ? Math.min((stats.variantA.revenue / (stats.variantA.revenue + stats.variantB.revenue)) * 100, 100) 
                            : 0} 
                          className="h-3 bg-gradient-to-r from-green-500 to-emerald-500"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* VS Divider */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center"
                    >
                      <span className="text-2xl font-bold text-primary">VS</span>
                    </motion.div>
                  </div>

                  {/* Variant B */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      "relative p-6 rounded-xl border-2 transition-all duration-300",
                      leader === 'b' 
                        ? "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20" 
                        : "border-border bg-muted/30"
                    )}
                  >
                    {leader === 'b' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2 shadow-lg"
                      >
                        <Trophy className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold">{activeTest.variant_b_name}</span>
                      <Badge className="bg-primary/10 text-primary border-primary/20">Variant</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Лиды</span>
                          <span className="font-bold text-lg">{stats.variantB.leads}</span>
                        </div>
                        <Progress 
                          value={stats.variantB.leads > 0 ? Math.min((stats.variantB.leads / (stats.variantA.leads + stats.variantB.leads)) * 100, 100) : 0} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Конверсия (CR)</span>
                          <span className="font-bold text-lg">{stats.variantB.conversionRate.toFixed(2)}%</span>
                        </div>
                        <Progress 
                          value={Math.min(stats.variantB.conversionRate, 100)} 
                          className="h-2 bg-blue-500/20"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-bold text-lg text-green-500">
                            {new Intl.NumberFormat('ru-RU').format(stats.variantB.revenue)} ₽
                          </span>
                        </div>
                        <Progress 
                          value={stats.variantA.revenue > 0 && stats.variantB.revenue > 0 
                            ? Math.min((stats.variantB.revenue / (stats.variantA.revenue + stats.variantB.revenue)) * 100, 100) 
                            : 0} 
                          className="h-3 bg-gradient-to-r from-green-500 to-emerald-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </BackgroundGradient>
        </motion.div>
      )}

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
              <Card key={test.id} className={test.status === 'running' ? 'border-primary/20' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        {getStatusBadge(test.status)}
                        {test.page_path && (
                          <Badge variant="outline" className="text-xs">
                            {AVAILABLE_PAGES.find(p => p.value === test.page_path)?.label || test.page_path}
                          </Badge>
                        )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать A/B тест</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название теста *</Label>
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
            <div className="space-y-2">
              <Label>Страница для теста *</Label>
              <Select
                value={newTest.page_path}
                onValueChange={(value) => setNewTest({ ...newTest, page_path: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите страницу" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_PAGES.map((page) => (
                    <SelectItem key={page.value} value={page.value}>
                      {page.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Вариант A (Control) *</Label>
                <Input
                  value={newTest.variant_a_name}
                  onChange={(e) => setNewTest({ ...newTest, variant_a_name: e.target.value })}
                  placeholder="Control"
                />
              </div>
              <div className="space-y-2">
                <Label>Вариант B *</Label>
                <Input
                  value={newTest.variant_b_name}
                  onChange={(e) => setNewTest({ ...newTest, variant_b_name: e.target.value })}
                  placeholder="Variant B"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Заголовок варианта A *</Label>
                <Input
                  value={newTest.variant_a_title}
                  onChange={(e) => setNewTest({ ...newTest, variant_a_title: e.target.value })}
                  placeholder="Текущий заголовок"
                />
              </div>
              <div className="space-y-2">
                <Label>Заголовок варианта B *</Label>
                <Input
                  value={newTest.variant_b_title}
                  onChange={(e) => setNewTest({ ...newTest, variant_b_title: e.target.value })}
                  placeholder="Новый заголовок"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Текст варианта A</Label>
                <Textarea
                  value={newTest.variant_a_text}
                  onChange={(e) => setNewTest({ ...newTest, variant_a_text: e.target.value })}
                  placeholder="Текущий текст"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Текст варианта B</Label>
                <Textarea
                  value={newTest.variant_b_text}
                  onChange={(e) => setNewTest({ ...newTest, variant_b_text: e.target.value })}
                  placeholder="Новый текст"
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddTest} disabled={!newTest.name || !newTest.page_path || !newTest.variant_a_title || !newTest.variant_b_title}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
