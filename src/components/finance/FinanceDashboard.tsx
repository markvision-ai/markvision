import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Percent,
  Zap,
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAdSpendSync } from '@/hooks/useAdSpendSync';
import { PlatformSpendChart } from './PlatformSpendChart';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AgencyAnalytics } from './AgencyAnalytics';
import { FinancialDecomposition } from './FinancialDecomposition';

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency?: string | null;
  description: string | null;
  transaction_date: string | null;
  created_at: string;
  lead_id?: string | null;
  project_id: string;
}

export interface FinanceDashboardProps {
  projectId: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'marketing', label: 'Маркетинг / Реклама' },
  { value: 'salary', label: 'Зарплаты (ФОТ)' },
  { value: 'rent', label: 'Аренда' },
  { value: 'software', label: 'Подписки / Софт' },
  { value: 'taxes', label: 'Налоги' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'other', label: 'Прочие расходы' },
];

const INCOME_CATEGORIES = [
  { value: 'sales', label: 'Продажи' },
  { value: 'services', label: 'Услуги' },
  { value: 'refund', label: 'Возврат' },
  { value: 'other', label: 'Прочие доходы' },
];

const DATE_PRESETS = [
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: '7 дней' },
  { value: 'month', label: '30 дней' },
  { value: 'quarter', label: '90 дней' },
  { value: 'year', label: 'Год' },
  { value: 'all', label: 'Всё время' },
];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const getCategoryLabel = (category: string, type: string): string => {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.find(c => c.value === category)?.label || category;
};

const SUPER_ADMIN_UID = 'd94043b0-1c76-4017-84de-df0dbf00a2c9';

export const FinanceDashboard = ({ projectId }: FinanceDashboardProps) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [datePreset, setDatePreset] = useState('month');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'salary',
    amount: 0,
    description: '',
  });

  // Check if user is super admin (Yuri)
  const isSuperAdmin = user?.id === SUPER_ADMIN_UID;

  // QuantumAds sync hook
  const { syncing, syncAdSpend } = useAdSpendSync(projectId);

  const handleSyncAds = async () => {
    const result = await syncAdSpend();
    if (result) {
      fetchTransactions();
    }
  };

  // Fetch transactions and set up realtime subscription
  useEffect(() => {
    fetchTransactions();

    // Realtime subscription for instant updates
    const channel = supabase
      .channel('finance-transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (import.meta.env.DEV) {
            console.log('💰 Finance realtime update:', payload.eventType);
          }
          // Refetch on any change for consistency
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: Transaction[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type || 'expense',
        category: item.category || 'other',
        amount: item.amount || 0,
        currency: item.currency || 'KZT',
        description: item.description || '',
        transaction_date: item.created_at, // Use created_at as fallback
        created_at: item.created_at,
        project_id: item.project_id
      }));

      setTransactions(formattedData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching transactions:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (newTransaction.amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }
    if (!newTransaction.category) {
      toast.error('Выберите категорию');
      return;
    }

    try {
      const { error } = await supabase.from('transactions').insert([{
        project_id: projectId,
        type: newTransaction.type,
        category: newTransaction.category,
        amount: newTransaction.amount,
        description: newTransaction.description,
        // created_at will be set automatically
      }]);

      if (error) throw error;

      toast.success('Транзакция добавлена');
      setIsAddDialogOpen(false);
      setNewTransaction({ type: 'expense', category: 'salary', amount: 0, description: '' });
      // No need to fetchTransactions - realtime will handle it
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error adding transaction:', error);
      }
      toast.error('Ошибка при добавлении транзакции');
    }
  };

  // Filter transactions by date
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (datePreset) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
      case 'all':
      default:
        startDate = null;
    }

    return transactions.filter(t => {
      const dateStr = t.transaction_date || t.created_at;
      const transactionDate = parseISO(dateStr);
      const dateMatch = !startDate || transactionDate >= startDate;
      const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
      return dateMatch && categoryMatch;
    });
  }, [transactions, datePreset, categoryFilter]);

  // Calculate metrics
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

  // Prepare monthly chart data
  const chartData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number; profit: number }> = {};

    filteredTransactions.forEach(t => {
      const dateStr = t.transaction_date || t.created_at;
      if (!dateStr) return;
      const date = parseISO(dateStr);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM', { locale: ru });

      if (!months[monthKey]) {
        months[monthKey] = { month: monthLabel, income: 0, expense: 0, profit: 0 };
      }

      if (t.type === 'income') {
        months[monthKey].income += t.amount;
      } else {
        months[monthKey].expense += t.amount;
      }
      months[monthKey].profit = months[monthKey].income - months[monthKey].expense;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [filteredTransactions]);

  // Category breakdown for expenses
  const expensesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};

    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return Object.entries(categories)
      .map(([category, amount]) => ({
        category: getCategoryLabel(category, 'expense'),
        amount,
        percent: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpense]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#020617]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-interstellar">
          <p className="font-black text-white/90 uppercase tracking-widest text-xs mb-3">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs font-black uppercase tracking-tight flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const [activeTab, setActiveTab] = useState('decomposition');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            MarkFinance
          </h2>
          <p className="text-sm text-white/40 mt-1 font-medium tracking-wide">P&L дашборд и учёт финансов</p>
        </div>

        {/* Hide controls when Decomposition is active */}
        {activeTab !== 'decomposition' && (
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/10 rounded-2xl h-12 text-white/70 font-black uppercase tracking-widest text-[10px]">
                <Calendar className="w-4 h-4 mr-2 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#020617]/90 backdrop-blur-3xl border-white/10 text-white">
                {DATE_PRESETS.map(preset => (
                  <SelectItem key={preset.value} value={preset.value} className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-[10px] font-black">
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchTransactions} className="rounded-2xl h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px]">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
            <Button
              variant="outline"
              onClick={handleSyncAds}
              disabled={syncing}
              className="rounded-2xl h-12 border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 font-black uppercase tracking-widest text-[10px] shadow-interstellar"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Синхр. QuantumAds
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-2xl h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-interstellar">
              <Plus className="w-4 h-4 mr-2" />
              Добавить расход
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards - Hide on Decomposition tab as well? User said "section button", but maybe KPI cards are also noise? 
          Let's stick to the buttons for now as per "section button". 
          Actually, let's keep KPI cards unless requested.
      */}
      {activeTab !== 'decomposition' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'Выручка',
              value: formatCurrency(totalIncome),
              icon: ArrowUpRight,
              color: 'text-secondary',
              bg: 'bg-secondary/10 border-secondary/20'
            },
            {
              label: 'Расходы',
              value: formatCurrency(totalExpense),
              icon: ArrowDownRight,
              color: 'text-primary',
              bg: 'bg-primary/10 border-primary/20'
            },
            {
              label: 'Чистая прибыль',
              value: formatCurrency(profit),
              icon: Wallet,
              color: profit >= 0 ? 'text-secondary' : 'text-primary',
              bg: profit >= 0 ? 'bg-secondary/10 border-secondary/20' : 'bg-primary/10 border-primary/20'
            },
            {
              label: 'Рентабельность',
              value: `${margin}%`,
              icon: Percent,
              color: 'text-white',
              bg: 'bg-white/10 border-white/20'
            }
          ].map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-card/40 backdrop-blur-xl shadow-interstellar border border-white/10 transition-all duration-500 hover:border-primary/40 hover:-translate-y-1 group relative overflow-hidden rounded-[2.5rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <CardContent className="p-8 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-4 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-500 group-hover:scale-110", card.bg)}>
                      <card.icon className={cn("w-6 h-6", card.color)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black tracking-tighter text-white/90 group-hover:text-white transition-colors">{card.value}</h3>
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto bg-white/5 backdrop-blur-xl p-1.5 rounded-[2rem] border border-white/10 shadow-interstellar h-14 flex-nowrap overflow-x-auto no-scrollbar">
          <TabsTrigger value="decomposition" className="rounded-[1.5rem] px-8 py-3 data-[state=active]:bg-white/10 data-[state=active]:text-primary data-[state=active]:shadow-lg border border-transparent transition-all font-black uppercase tracking-[0.15em] text-[10px] text-white/40 hover:text-white">Декомпозиция</TabsTrigger>
          <TabsTrigger value="dashboard" className="rounded-[1.5rem] px-8 py-3 data-[state=active]:bg-white/10 data-[state=active]:text-primary data-[state=active]:shadow-lg border border-transparent transition-all font-black uppercase tracking-[0.15em] text-[10px] text-white/40 hover:text-white">P&L Дашборд</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="agency" className="rounded-[1.5rem] px-8 py-3 data-[state=active]:bg-white/10 data-[state=active]:text-primary data-[state=active]:shadow-lg border border-transparent transition-all font-black uppercase tracking-[0.15em] text-[10px] text-white/40 hover:text-white">Агентская аналитика</TabsTrigger>
          )}
          <TabsTrigger value="platforms" className="rounded-[1.5rem] px-8 py-3 data-[state=active]:bg-white/10 data-[state=active]:text-primary data-[state=active]:shadow-lg border border-transparent transition-all font-black uppercase tracking-[0.15em] text-[10px] text-white/40 hover:text-white">Рекламные площадки</TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-[1.5rem] px-8 py-3 data-[state=active]:bg-white/10 data-[state=active]:text-primary data-[state=active]:shadow-lg border border-transparent transition-all font-black uppercase tracking-[0.15em] text-[10px] text-white/40 hover:text-white">Транзакции</TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="agency" className="mt-4">
            <AgencyAnalytics />
          </TabsContent>
        )}

        <TabsContent value="decomposition" className="mt-4">
          <FinancialDecomposition projectId={projectId} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
          {/* Bar Chart */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-interstellar border border-white/10 rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 p-10">
              <CardTitle className="text-xl font-black uppercase tracking-[0.2em] text-white">Доходы vs Расходы</CardTitle>
              <CardDescription className="text-white/40 font-black uppercase tracking-[0.1em] mt-2">Сравнение по месяцам за выбранный период</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <div className="h-[350px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        fontWeight="900"
                        tickLine={false}
                        axisLine={false}
                        tick={{ dy: 10 }}
                        className="uppercase tracking-widest"
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.3)"
                        fontSize={10}
                        fontWeight="900"
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        tickLine={false}
                        axisLine={false}
                        className="uppercase tracking-widest"
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                      <Bar
                        dataKey="income"
                        name="Доходы"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name="Расходы"
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Нет данных за выбранный период
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-interstellar border border-white/10 rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 p-10">
              <CardTitle className="text-xl font-black uppercase tracking-[0.2em] text-white">Структура расходов</CardTitle>
              <CardDescription className="text-white/40 font-black uppercase tracking-[0.1em] mt-2">Распределение по категориям</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              {expensesByCategory.length > 0 ? (
                <div className="space-y-4">
                  {expensesByCategory.map((item, index) => (
                    <div key={index} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-black uppercase tracking-widest text-white/80">{item.category}</span>
                          <span className="text-xs font-black text-white/40">{item.percent}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000 group-hover:bg-primary/80"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-black w-32 text-right text-primary tabular-nums">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Нет расходов за выбранный период
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Spend Tab - New Pie Chart */}
        <TabsContent value="platforms" className="mt-4 space-y-6">
          <PlatformSpendChart projectId={projectId} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-8">
          <Card className="bg-card/40 backdrop-blur-xl shadow-interstellar border border-white/10 rounded-[3rem] overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 p-10">
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-[0.2em] text-white">История транзакций</CardTitle>
                  <CardDescription className="text-white/40 font-black uppercase tracking-[0.1em] mt-2">
                    Всего {filteredTransactions.length} записей
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px] bg-white/5 border-white/10 rounded-2xl h-12 text-white/70 font-black uppercase tracking-widest text-[10px]">
                      <Filter className="w-4 h-4 mr-2 text-primary" />
                      <SelectValue placeholder="Категория" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#020617]/90 backdrop-blur-3xl border-white/10 text-white">
                      <SelectItem value="all" className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-[10px] font-black">Все категории</SelectItem>
                      {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(cat => (
                        <SelectItem key={cat.value} value={cat.value} className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-[10px] font-black">
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="rounded-2xl h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px]">
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-white/5 bg-white/[0.02]">
                    <TableHead className="px-10 py-5 text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Дата</TableHead>
                    <TableHead className="px-10 py-5 text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Категория</TableHead>
                    <TableHead className="px-10 py-5 text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Описание</TableHead>
                    <TableHead className="px-10 py-5 text-right text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/5">
                  {loading ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="text-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                        <p className="mt-4 text-white/40 font-black uppercase tracking-widest text-[10px]">Загрузка транзакций...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="text-center py-20 text-white/40 font-black uppercase tracking-widest text-[10px]">
                        Транзакции не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-10 py-5 whitespace-nowrap text-white/60 text-xs font-black uppercase tabular-nums">
                          {format(parseISO(t.transaction_date || ''), 'dd.MM.yyyy', { locale: ru })}
                        </td>
                        <td className="px-10 py-5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "whitespace-nowrap rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0",
                              t.type === 'income' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                            )}
                          >
                            {t.type === 'income' ? (
                              <><TrendingUp className="w-3 h-3 mr-1.5" /> {getCategoryLabel(t.category, t.type)}</>
                            ) : (
                              <><TrendingDown className="w-3 h-3 mr-1.5" /> {getCategoryLabel(t.category, t.type)}</>
                            )}
                          </Badge>
                        </td>
                        <td className="px-10 py-5 max-w-[250px] truncate text-white/40 text-sm font-medium">
                          {t.description || '—'}
                        </td>
                        <td className={cn(
                          "px-10 py-5 text-right font-black whitespace-nowrap tabular-nums text-lg",
                          t.type === 'income' ? 'text-secondary' : 'text-primary'
                        )}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#020617]/95 backdrop-blur-3xl border-white/10 rounded-[2rem] shadow-interstellar text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest text-center">Добавить транзакцию</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6 font-black uppercase tracking-widest text-[10px]">
            <div className="space-y-3">
              <Label className="text-white/40 ml-1">Тип транзакции</Label>
              <Select
                value={newTransaction.type}
                onValueChange={(value: 'income' | 'expense') => {
                  setNewTransaction({
                    ...newTransaction,
                    type: value,
                    category: value === 'income' ? 'sales' : 'salary'
                  });
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#020617]/90 backdrop-blur-3xl border-white/10 text-white">
                  <SelectItem value="expense" className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-[10px] font-black">
                    <span className="flex items-center gap-3">
                      <ArrowDownRight className="w-4 h-4 text-primary" />
                      Расход
                    </span>
                  </SelectItem>
                  <SelectItem value="income" className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-[10px] font-black">
                    <span className="flex items-center gap-3">
                      <ArrowUpRight className="w-4 h-4 text-secondary" />
                      Доход
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-white/40 ml-1">Категория</Label>
              <Select
                value={newTransaction.category}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#020617]/90 backdrop-blur-3xl border-white/10 text-white">
                  {(newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="focus:bg-white/10 focus:text-white uppercase tracking-widest text-[10px] font-black">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-white/40 ml-1">Сумма (₸)</Label>
              <Input
                type="number"
                value={newTransaction.amount || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                placeholder="100 000"
                className="bg-white/5 border-white/10 rounded-xl h-12 font-mono text-lg text-secondary"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-white/40 ml-1">Описание</Label>
              <Input
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Комментарий к транзакции..."
                className="bg-white/5 border-white/10 rounded-xl h-12 text-sm text-white/80"
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px] flex-1">
              Отмена
            </Button>
            <Button onClick={handleAddTransaction} className="rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] flex-1 shadow-interstellar">
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
