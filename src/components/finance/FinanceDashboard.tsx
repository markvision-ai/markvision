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
  TrendingDown,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  List
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
import { AgencyAnalytics } from './AgencyAnalytics';
import { FinancialDecomposition } from './FinancialDecomposition';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ... (types and interfaces remain the same) ...
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

  const isSuperAdmin = user?.id === SUPER_ADMIN_UID;
  const { syncing, syncAdSpend } = useAdSpendSync(projectId);

  const handleSyncAds = async () => {
    const result = await syncAdSpend();
    if (result) {
      fetchTransactions();
    }
  };

  useEffect(() => {
    fetchTransactions();
    const channel = supabase.channel('finance-transactions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `project_id=eq.${projectId}` }, () => fetchTransactions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
        transaction_date: item.created_at,
        created_at: item.created_at,
        project_id: item.project_id
      }));

      setTransactions(formattedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
      }]);

      if (error) throw error;

      toast.success('Транзакция добавлена');
      setIsAddDialogOpen(false);
      setNewTransaction({ type: 'expense', category: 'salary', amount: 0, description: '' });
    } catch (error) {
      toast.error('Ошибка при добавлении транзакции');
    }
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (datePreset) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': startDate = subDays(now, 7); break;
      case 'month': startDate = subDays(now, 30); break;
      case 'quarter': startDate = subDays(now, 90); break;
      case 'year': startDate = subDays(now, 365); break;
      case 'all': default: startDate = null;
    }

    return transactions.filter(t => {
      const dateStr = t.transaction_date || t.created_at;
      const transactionDate = parseISO(dateStr);
      const dateMatch = !startDate || transactionDate >= startDate;
      const categoryMatch = categoryFilter === 'all' || t.category === categoryFilter;
      return dateMatch && categoryMatch;
    });
  }, [transactions, datePreset, categoryFilter]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;

  const chartData = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number; profit: number }> = {};

    filteredTransactions.forEach(t => {
      const dateStr = t.transaction_date || t.created_at;
      if (!dateStr) return;
      const date = parseISO(dateStr);
      const monthKey = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMM', { locale: ru });

      if (!months[monthKey]) months[monthKey] = { month: monthLabel, income: 0, expense: 0, profit: 0 };
      if (t.type === 'income') months[monthKey].income += t.amount;
      else months[monthKey].expense += t.amount;
      months[monthKey].profit = months[monthKey].income - months[monthKey].expense;
    });

    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, data]) => data);
  }, [filteredTransactions]);

  const expensesByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories).map(([category, amount]) => ({
      category: getCategoryLabel(category, 'expense'),
      amount,
      percent: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0'
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpense]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl">
          <p className="font-medium mb-2 text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-bold text-foreground">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const [activeTab, setActiveTab] = useState('decomposition');

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">

      {/* Header controls & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            MarkFinance
          </h2>
          <p className="text-muted-foreground mt-1 ml-11">Финансовое планирование и P&L</p>
        </div>

        {activeTab !== 'decomposition' && (
          <div className="flex flex-wrap items-center gap-2 bg-secondary/30 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-[130px] h-9 border-none bg-transparent hover:bg-white/5 focus:ring-0">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map(preset => <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <Button variant="ghost" size="sm" onClick={fetchTransactions} className="h-9 hover:bg-white/5">
              <RefreshCw className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={handleSyncAds} disabled={syncing} className="h-9 hover:bg-white/5 text-violet-400 hover:text-violet-300">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            </Button>

            <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {activeTab !== 'decomposition' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="interstellar-glass border-white/5 group hover:border-emerald-500/30 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-emerald-400">{formatCurrency(totalIncome)}</h3>
                  <p className="text-sm font-medium text-muted-foreground">Выручка</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="interstellar-glass border-white/5 group hover:border-red-500/30 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                    <ArrowDownRight className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-red-400">{formatCurrency(totalExpense)}</h3>
                  <p className="text-sm font-medium text-muted-foreground">Расходы</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="interstellar-glass border-white/5 group hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={cn("text-2xl font-bold tracking-tight", profit >= 0 ? "text-primary" : "text-red-400")}>{formatCurrency(profit)}</h3>
                  <p className="text-sm font-medium text-muted-foreground">Чистая прибыль</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="interstellar-glass border-white/5 group hover:border-purple-500/30 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <Percent className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={cn("text-2xl font-bold tracking-tight", margin >= 0 ? "text-purple-400" : "text-red-400")}>{margin}%</h3>
                  <p className="text-sm font-medium text-muted-foreground">Рентабельность</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full sm:w-auto bg-secondary/50 p-1 rounded-2xl border border-white/5 backdrop-blur-sm flex-wrap h-auto">
          {[
            { id: 'decomposition', label: 'Декомпозиция', icon: TrendingUp },
            { id: 'dashboard', label: 'P&L Дашборд', icon: BarChart3 },
            ...(isSuperAdmin ? [{ id: 'agency', label: 'Агентская аналитика', icon: Building2 }] : []),
            { id: 'platforms', label: 'Площадки', icon: PieChartIcon },
            { id: 'transactions', label: 'Транзакции', icon: List }
          ].map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-xl px-4 py-2.5 gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border border-primary/20 transition-all font-medium flex-1 text-xs sm:text-sm"
            >
              <tab.icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === 'decomposition' && (
            <TabsContent value="decomposition" className="mt-6 focus-visible:outline-none">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <FinancialDecomposition projectId={projectId} />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'dashboard' && (
            <TabsContent value="dashboard" className="mt-6 space-y-6 focus-visible:outline-none">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="interstellar-glass border-white/5 shadow-xl lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Доходы vs Расходы</CardTitle>
                    <CardDescription>Динамика по месяцам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                          <Legend />
                          <Bar dataKey="income" name="Доходы" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="expense" name="Расходы" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="interstellar-glass border-white/5 shadow-xl">
                  <CardHeader>
                    <CardTitle>Структура расходов</CardTitle>
                    <CardDescription>По категориям</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {expensesByCategory.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.category}</span>
                            <span className="font-medium">{item.percent}%</span>
                          </div>
                          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percent}%` }}
                              transition={{ duration: 0.8, delay: idx * 0.1 }}
                              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                            />
                          </div>
                          <div className="text-xs text-right text-muted-foreground">{formatCurrency(item.amount)}</div>
                        </div>
                      ))}
                      {expensesByCategory.length === 0 && <div className="text-center py-10 text-muted-foreground">Нет данных</div>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'agency' && isSuperAdmin && (
            <TabsContent value="agency" className="mt-6 focus-visible:outline-none">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <AgencyAnalytics />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'platforms' && (
            <TabsContent value="platforms" className="mt-6 focus-visible:outline-none">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <PlatformSpendChart projectId={projectId} />
              </motion.div>
            </TabsContent>
          )}

          {activeTab === 'transactions' && (
            <TabsContent value="transactions" className="mt-6 focus-visible:outline-none">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Card className="interstellar-glass border-white/5 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>История операций</CardTitle>
                    <div className="flex gap-2">
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px] bg-background/50 border-white/10">
                          <Filter className="w-3.5 h-3.5 mr-2" />
                          <SelectValue placeholder="Категория" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все категории</SelectItem>
                          {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-white/5 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-white/60">Дата</TableHead>
                            <TableHead className="text-white/60">Категория</TableHead>
                            <TableHead className="text-white/60">Описание</TableHead>
                            <TableHead className="text-white/60 text-right">Сумма</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTransactions.map((t) => (
                            <TableRow key={t.id} className="border-white/5 hover:bg-white/5 transition-colors">
                              <TableCell className="font-mono text-xs text-muted-foreground">{format(parseISO(t.transaction_date || t.created_at), 'dd.MM.yyyy')}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("bg-transparent border-white/10", t.type === 'income' ? 'text-emerald-400' : 'text-red-400')}>
                                  {t.type === 'income' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                  {getCategoryLabel(t.category, t.type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-[200px] truncate">{t.description || '—'}</TableCell>
                              <TableCell className={cn("text-right font-mono font-medium", t.type === 'income' ? "text-emerald-400" : "text-red-400")}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredTransactions.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Нет данных</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md interstellar-glass border-white/10 bg-black/80 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Новая транзакция</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select value={newTransaction.type} onValueChange={(v: any) => setNewTransaction({ ...newTransaction, type: v, category: v === 'income' ? 'sales' : 'salary' })}>
                  <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">🔴 Расход</SelectItem>
                    <SelectItem value="income">🟢 Доход</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Сумма</Label>
                <Input type="number" value={newTransaction.amount || ''} onChange={e => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })} className="bg-white/5 border-white/10 font-mono" placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={newTransaction.category} onValueChange={v => setNewTransaction({ ...newTransaction, category: v })}>
                <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} className="bg-white/5 border-white/10" placeholder="Комментарий" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleAddTransaction} className="bg-primary hover:bg-primary/90 text-primary-foreground">Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
