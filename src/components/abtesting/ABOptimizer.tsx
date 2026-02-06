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
  Swords,
  Globe,
  Video,
  Type,
  Image,
  AlertTriangle,
  Percent,
  ArrowUpRight,
  Scale
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { cn } from '@/lib/utils';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: string;
  test_category: 'page' | 'creative' | 'copy' | 'audience';
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
  // Facebook Ads интеграция
  facebook_account_id: string | null;
  facebook_campaign_id: string | null;
  facebook_ad_ids: string[] | null;
  facebook_adset_ids: string[] | null;
  // Метрики Facebook Ads
  variant_a_spend: number;
  variant_b_spend: number;
  variant_a_leads: number;
  variant_b_leads: number;
  variant_a_impressions: number;
  variant_b_impressions: number;
  variant_a_cpl: number | null;
  variant_b_cpl: number | null;
  variant_a_ctr: number | null;
  variant_b_ctr: number | null;
  // Статистика
  confidence_level: number;
  min_sample_size: number;
  auto_winner_threshold: number;
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

// Типы A/B тестов
const TEST_CATEGORIES = [
  { value: 'page', label: 'Страница', icon: Globe, description: 'Тестирование элементов страницы' },
  { value: 'creative', label: 'Креатив', icon: Video, description: 'Сравнение объявлений Facebook Ads' },
  { value: 'copy', label: 'Текст', icon: Type, description: 'Тестирование текстов объявлений' },
  { value: 'audience', label: 'Аудитория', icon: Users, description: 'Сравнение таргетингов' },
] as const;

// Функция расчёта статистической значимости (Z-test)
function calculateConfidence(
  conversionsA: number,
  visitsA: number,
  conversionsB: number,
  visitsB: number
): number {
  if (visitsA < 10 || visitsB < 10) return 0;

  const rateA = conversionsA / visitsA;
  const rateB = conversionsB / visitsB;
  const pooledRate = (conversionsA + conversionsB) / (visitsA + visitsB);

  if (pooledRate === 0 || pooledRate === 1) return 0;

  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / visitsA + 1 / visitsB));
  if (se === 0) return 0;

  const z = Math.abs(rateA - rateB) / se;

  // Преобразование Z-score в confidence (упрощённое)
  // z=1.96 -> 95%, z=2.58 -> 99%
  const confidence = Math.min(99.9, (1 - 2 * (1 - normalCDF(z))) * 100);
  return Math.max(0, confidence);
}

// Функция нормального распределения (упрощённая)
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

// Определение победителя на основе метрик
function determineWinner(test: ABTest): { winner: 'a' | 'b' | null; reason: string } {
  const { confidence_level, auto_winner_threshold } = test;

  if (confidence_level < auto_winner_threshold) {
    return { winner: null, reason: `Confidence ${confidence_level.toFixed(1)}% < ${auto_winner_threshold}%` };
  }

  // Для креативов - сравниваем CPL
  if (test.test_category === 'creative' || test.test_category === 'audience') {
    const cplA = test.variant_a_cpl ?? Infinity;
    const cplB = test.variant_b_cpl ?? Infinity;

    if (cplA < cplB) {
      const improvement = ((cplB - cplA) / cplB * 100).toFixed(1);
      return { winner: 'a', reason: `CPL на ${improvement}% ниже` };
    } else if (cplB < cplA) {
      const improvement = ((cplA - cplB) / cplA * 100).toFixed(1);
      return { winner: 'b', reason: `CPL на ${improvement}% ниже` };
    }
  }

  // Для страниц и текстов - сравниваем конверсию
  const crA = test.variant_a_visitors > 0 ? test.variant_a_conversions / test.variant_a_visitors : 0;
  const crB = test.variant_b_visitors > 0 ? test.variant_b_conversions / test.variant_b_visitors : 0;

  if (crA > crB) {
    const improvement = ((crA - crB) / crB * 100).toFixed(1);
    return { winner: 'a', reason: `CR на ${improvement}% выше` };
  } else if (crB > crA) {
    const improvement = ((crB - crA) / crA * 100).toFixed(1);
    return { winner: 'b', reason: `CR на ${improvement}% выше` };
  }

  return { winner: null, reason: 'Результаты равны' };
}

export const ABOptimizer = ({ projectId }: ABOptimizerProps) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [newTest, setNewTest] = useState({
    name: '',
    description: '',
    test_category: 'page' as 'page' | 'creative' | 'copy' | 'audience',
    page_path: '',
    variant_a_name: 'Control',
    variant_b_name: 'Variant B',
    variant_a_title: '',
    variant_a_text: '',
    variant_b_title: '',
    variant_b_text: '',
    // Facebook Ads
    facebook_account_id: '',
    facebook_campaign_id: '',
    facebook_ad_a_id: '',
    facebook_ad_b_id: '',
    facebook_adset_a_id: '',
    facebook_adset_b_id: '',
    // Настройки автоматизации
    min_sample_size: 1000,
    auto_winner_threshold: 95,
  });

  // Диалог подтверждения действий
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    testId: string;
    action: 'apply_winner' | 'scale' | 'pause_loser';
    winner: 'a' | 'b';
  } | null>(null);

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
    // Валидация в зависимости от типа теста
    if (!newTest.name) {
      toast.error('Укажите название теста');
      return;
    }

    if (newTest.test_category === 'page') {
      if (!newTest.page_path || !newTest.variant_a_title || !newTest.variant_b_title) {
        toast.error('Заполните все обязательные поля для теста страницы');
        return;
      }
    }

    if (newTest.test_category === 'creative') {
      if (!newTest.facebook_ad_a_id || !newTest.facebook_ad_b_id) {
        toast.error('Выберите два объявления для сравнения');
        return;
      }
    }

    if (newTest.test_category === 'audience') {
      if (!newTest.facebook_adset_a_id || !newTest.facebook_adset_b_id) {
        toast.error('Выберите два adset для сравнения');
        return;
      }
    }

    try {
      // Подготовка данных для сохранения
      const testData: any = {
        project_id: projectId,
        name: newTest.name,
        description: newTest.description,
        test_category: newTest.test_category,
        variant_a_name: newTest.variant_a_name,
        variant_b_name: newTest.variant_b_name,
        min_sample_size: newTest.min_sample_size,
        auto_winner_threshold: newTest.auto_winner_threshold,
        status: 'draft',
      };

      // Добавляем поля в зависимости от типа теста
      if (newTest.test_category === 'page' || newTest.test_category === 'copy') {
        testData.page_path = newTest.page_path;
        testData.variant_a_title = newTest.variant_a_title;
        testData.variant_a_text = newTest.variant_a_text;
        testData.variant_b_title = newTest.variant_b_title;
        testData.variant_b_text = newTest.variant_b_text;
      }

      if (newTest.test_category === 'creative' || newTest.test_category === 'audience') {
        testData.facebook_account_id = newTest.facebook_account_id;
        testData.facebook_campaign_id = newTest.facebook_campaign_id;
      }

      if (newTest.test_category === 'creative') {
        testData.facebook_ad_ids = [newTest.facebook_ad_a_id, newTest.facebook_ad_b_id];
      }

      if (newTest.test_category === 'audience') {
        testData.facebook_adset_ids = [newTest.facebook_adset_a_id, newTest.facebook_adset_b_id];
      }

      const { error } = await supabase.from('ab_tests').insert([testData]);

      if (error) throw error;

      toast.success('A/B тест создан');
      setIsAddDialogOpen(false);
      resetNewTestForm();
      fetchTests();
    } catch (error) {
      console.error('Error adding test:', error);
      toast.error('Ошибка при создании теста');
    }
  };

  // Сброс формы создания теста
  const resetNewTestForm = () => {
    setNewTest({
      name: '',
      description: '',
      test_category: 'page',
      page_path: '',
      variant_a_name: 'Control',
      variant_b_name: 'Variant B',
      variant_a_title: '',
      variant_a_text: '',
      variant_b_title: '',
      variant_b_text: '',
      facebook_account_id: '',
      facebook_campaign_id: '',
      facebook_ad_a_id: '',
      facebook_ad_b_id: '',
      facebook_adset_a_id: '',
      facebook_adset_b_id: '',
      min_sample_size: 1000,
      auto_winner_threshold: 95,
    });
  };

  // Применение победителя теста
  const handleApplyWinner = async (testId: string, winner: 'a' | 'b') => {
    setActionDialog({
      open: true,
      testId,
      action: 'apply_winner',
      winner,
    });
  };

  // Подтверждение действия
  const confirmAction = async () => {
    if (!actionDialog) return;

    const { testId, action, winner } = actionDialog;

    try {
      if (action === 'apply_winner') {
        // Обновляем статус теста
        const { error } = await supabase
          .from('ab_tests')
          .update({
            status: 'completed',
            winner,
            ended_at: new Date().toISOString(),
          })
          .eq('id', testId);

        if (error) throw error;
        toast.success(`Победитель применён: Variant ${winner.toUpperCase()}`);
      }

      setActionDialog(null);
      fetchTests();
    } catch (error) {
      console.error('Error applying action:', error);
      toast.error('Ошибка при выполнении действия');
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

                  {/* Confidence Level & AI Рекомендации */}
                  {test.status === 'running' && (
                    <div className="mt-4 space-y-3">
                      {/* Confidence Progress */}
                      <div className="p-3 rounded-lg bg-muted/30 border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Статистическая значимость</span>
                          </div>
                          <span className={cn(
                            "text-lg font-bold",
                            (test.confidence_level || 0) >= 95 ? "text-green-500" :
                            (test.confidence_level || 0) >= 80 ? "text-yellow-500" :
                            "text-muted-foreground"
                          )}>
                            {(test.confidence_level || 0).toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={test.confidence_level || 0}
                          className={cn(
                            "h-2",
                            (test.confidence_level || 0) >= 95 ? "[&>div]:bg-green-500" :
                            (test.confidence_level || 0) >= 80 ? "[&>div]:bg-yellow-500" :
                            ""
                          )}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {(test.confidence_level || 0) >= (test.auto_winner_threshold || 95)
                            ? "Достаточно данных для определения победителя"
                            : `Нужно ${((test.auto_winner_threshold || 95) - (test.confidence_level || 0)).toFixed(0)}% для авто-завершения`
                          }
                        </p>
                      </div>

                      {/* Победитель определён */}
                      {(test.confidence_level || 0) >= (test.auto_winner_threshold || 95) && (() => {
                        const result = determineWinner(test);
                        if (result.winner) {
                          return (
                            <Alert className="border-green-500/50 bg-green-500/5">
                              <Trophy className="w-4 h-4 text-green-500" />
                              <AlertTitle className="text-green-600">Победитель определён!</AlertTitle>
                              <AlertDescription>
                                <strong>{result.winner === 'a' ? test.variant_a_name : test.variant_b_name}</strong> показывает лучшие результаты.
                                {result.reason && <span className="block mt-1 text-muted-foreground">{result.reason}</span>}
                              </AlertDescription>
                              <div className="mt-3 flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApplyWinner(test.id, result.winner!)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Применить победителя
                                </Button>
                              </div>
                            </Alert>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  {/* AI Рекомендация (если есть) */}
                  {test.ai_recommendation && (
                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI рекомендация:</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{test.ai_recommendation}</p>
                    </div>
                  )}

                  {/* Тип теста badge */}
                  {test.test_category && test.test_category !== 'page' && (
                    <div className="mt-3 flex items-center gap-2">
                      {test.test_category === 'creative' && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          Креатив
                        </Badge>
                      )}
                      {test.test_category === 'audience' && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Аудитория
                        </Badge>
                      )}
                      {test.test_category === 'copy' && (
                        <Badge variant="outline" className="text-xs">
                          <Type className="w-3 h-3 mr-1" />
                          Текст
                        </Badge>
                      )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-primary" />
              Создать A/B тест
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Основные поля */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название теста *</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="Тест креативов январь"
                />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Input
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Сравниваем два варианта..."
                />
              </div>
            </div>

            {/* Выбор типа теста */}
            <div className="space-y-3">
              <Label>Тип теста</Label>
              <div className="grid grid-cols-4 gap-3">
                {TEST_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = newTest.test_category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setNewTest({ ...newTest, test_category: cat.value as any })}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn("w-6 h-6 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <div className="font-medium text-sm">{cat.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{cat.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Форма для типа "Страница" */}
            {newTest.test_category === 'page' && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="w-4 h-4" />
                  Настройки теста страницы
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
                    <Label>Заголовок A (Control) *</Label>
                    <Input
                      value={newTest.variant_a_title}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_title: e.target.value })}
                      placeholder="Текущий заголовок"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Заголовок B (Variant) *</Label>
                    <Input
                      value={newTest.variant_b_title}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_title: e.target.value })}
                      placeholder="Новый заголовок"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Текст A</Label>
                    <Textarea
                      value={newTest.variant_a_text}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_text: e.target.value })}
                      placeholder="Текущий текст"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Текст B</Label>
                    <Textarea
                      value={newTest.variant_b_text}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_text: e.target.value })}
                      placeholder="Новый текст"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Форма для типа "Креатив" */}
            {newTest.test_category === 'creative' && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Video className="w-4 h-4" />
                  Настройки теста креативов
                </div>
                <Alert>
                  <Sparkles className="w-4 h-4" />
                  <AlertTitle>Тестирование креативов Facebook Ads</AlertTitle>
                  <AlertDescription>
                    Выберите два объявления для сравнения. Система автоматически соберёт метрики
                    и определит победителя по CPL.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID объявления A (Control) *</Label>
                    <Input
                      value={newTest.facebook_ad_a_id}
                      onChange={(e) => setNewTest({ ...newTest, facebook_ad_a_id: e.target.value })}
                      placeholder="123456789012345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID объявления B (Variant) *</Label>
                    <Input
                      value={newTest.facebook_ad_b_id}
                      onChange={(e) => setNewTest({ ...newTest, facebook_ad_b_id: e.target.value })}
                      placeholder="123456789012346"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Название A</Label>
                    <Input
                      value={newTest.variant_a_name}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_name: e.target.value })}
                      placeholder="Видео кухня"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Название B</Label>
                    <Input
                      value={newTest.variant_b_name}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_name: e.target.value })}
                      placeholder="Видео ванная"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Форма для типа "Текст" */}
            {newTest.test_category === 'copy' && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Type className="w-4 h-4" />
                  Настройки теста текстов
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Оффер A (Control) *</Label>
                    <Textarea
                      value={newTest.variant_a_title}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_title: e.target.value })}
                      placeholder="Текущий оффер"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Оффер B (Variant) *</Label>
                    <Textarea
                      value={newTest.variant_b_title}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_title: e.target.value })}
                      placeholder="Новый оффер"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Текст объявления A</Label>
                    <Textarea
                      value={newTest.variant_a_text}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_text: e.target.value })}
                      placeholder="Текущий текст объявления"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Текст объявления B</Label>
                    <Textarea
                      value={newTest.variant_b_text}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_text: e.target.value })}
                      placeholder="Новый текст объявления"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Форма для типа "Аудитория" */}
            {newTest.test_category === 'audience' && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  Настройки теста аудиторий
                </div>
                <Alert>
                  <Target className="w-4 h-4" />
                  <AlertTitle>Тестирование аудиторий</AlertTitle>
                  <AlertDescription>
                    Выберите два adset с разным таргетингом для сравнения эффективности.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID AdSet A (Control) *</Label>
                    <Input
                      value={newTest.facebook_adset_a_id}
                      onChange={(e) => setNewTest({ ...newTest, facebook_adset_a_id: e.target.value })}
                      placeholder="123456789012345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID AdSet B (Variant) *</Label>
                    <Input
                      value={newTest.facebook_adset_b_id}
                      onChange={(e) => setNewTest({ ...newTest, facebook_adset_b_id: e.target.value })}
                      placeholder="123456789012346"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Название A</Label>
                    <Input
                      value={newTest.variant_a_name}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_name: e.target.value })}
                      placeholder="Lookalike 3%"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Название B</Label>
                    <Input
                      value={newTest.variant_b_name}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_name: e.target.value })}
                      placeholder="Interest targeting"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Настройки автоматизации */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Scale className="w-4 h-4" />
                Настройки автоматизации
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Мин. выборка (impressions)</Label>
                  <Input
                    type="number"
                    value={newTest.min_sample_size}
                    onChange={(e) => setNewTest({ ...newTest, min_sample_size: parseInt(e.target.value) || 1000 })}
                    min={100}
                    max={100000}
                  />
                  <p className="text-xs text-muted-foreground">Минимум показов для статистики</p>
                </div>
                <div className="space-y-2">
                  <Label>Порог confidence (%)</Label>
                  <Input
                    type="number"
                    value={newTest.auto_winner_threshold}
                    onChange={(e) => setNewTest({ ...newTest, auto_winner_threshold: parseInt(e.target.value) || 95 })}
                    min={80}
                    max={99}
                  />
                  <p className="text-xs text-muted-foreground">Уровень для авто-определения победителя</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetNewTestForm(); }}>
              Отмена
            </Button>
            <Button onClick={handleAddTest}>
              <Plus className="w-4 h-4 mr-2" />
              Создать тест
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения действия */}
      <Dialog open={actionDialog?.open || false} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Подтверждение действия
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {actionDialog?.action === 'apply_winner' && (
              <p>
                Вы уверены, что хотите применить <strong>Variant {actionDialog.winner.toUpperCase()}</strong> как победителя?
                Проигравший вариант будет отмечен, и тест завершится.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Отмена
            </Button>
            <Button onClick={confirmAction}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
