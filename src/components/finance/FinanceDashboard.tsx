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
import { AgencyAnalytics } from './AgencyAnalytics';
import { GoalDecomposition } from './GoalDecomposition';
import { FinancialDecomposition } from './FinancialDecomposition';

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string | null;
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
      setTransactions((data as Transaction[]) || []);
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
        currency: 'KZT',
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
  const margin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : '0';

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
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            MarkFinance
          </h2>
          <p className="text-muted-foreground">P&L дашборд и учёт финансов</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSyncAds} 
            disabled={syncing}
            className="border-violet-500/50 text-violet-600 hover:bg-violet-50"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Синхр. QuantumAds
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить расход
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <ArrowUpRight className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Выручка</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <ArrowDownRight className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Расходы</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Чистая прибыль</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(profit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Percent className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Рентабельность</p>
                <p className={`text-2xl font-bold ${Number(margin) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {margin}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="strategy">
        <TabsList className="flex-wrap">
          <TabsTrigger value="strategy">🎯 Стратегия</TabsTrigger>
          <TabsTrigger value="dashboard">P&L Дашборд</TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="agency">Агентская аналитика</TabsTrigger>
          )}
          <TabsTrigger value="decomposition">Декомпозиция</TabsTrigger>
          <TabsTrigger value="platforms">Рекламные площадки</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="agency" className="mt-4">
            <AgencyAnalytics />
          </TabsContent>
        )}

        <TabsContent value="decomposition" className="mt-4">
          <FinancialDecomposition projectId={projectId} />
        </TabsContent>

        <TabsContent value="strategy" className="mt-4">
          <GoalDecomposition projectId={projectId} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Доходы vs Расходы</CardTitle>
              <CardDescription>Сравнение по месяцам за выбранный период</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="income" 
                        name="Доходы" 
                        fill="#22c55e" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="expense" 
                        name="Расходы" 
                        fill="#ef4444" 
                        radius={[4, 4, 0, 0]}
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
          <Card>
            <CardHeader>
              <CardTitle>Структура расходов</CardTitle>
              <CardDescription>Распределение по категориям</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <div className="space-y-4">
                  {expensesByCategory.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{item.category}</span>
                          <span className="text-sm text-muted-foreground">{item.percent}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full transition-all"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-32 text-right text-red-500">
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

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>История транзакций</CardTitle>
                  <CardDescription>
                    Всего {filteredTransactions.length} записей
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Категория" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Экспорт
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Транзакции не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(parseISO(t.transaction_date), 'dd.MM.yyyy', { locale: ru })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={t.type === 'income' ? 'default' : 'destructive'}
                            className="whitespace-nowrap"
                          >
                            {t.type === 'income' ? (
                              <><TrendingUp className="w-3 h-3 mr-1" /> {getCategoryLabel(t.category, t.type)}</>
                            ) : (
                              <><TrendingDown className="w-3 h-3 mr-1" /> {getCategoryLabel(t.category, t.type)}</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {t.description || '—'}
                        </TableCell>
                        <TableCell className={`text-right font-medium whitespace-nowrap ${
                          t.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </TableCell>
                      </TableRow>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить транзакцию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Тип</Label>
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">
                    <span className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      Расход
                    </span>
                  </SelectItem>
                  <SelectItem value="income">
                    <span className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      Доход
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select 
                value={newTransaction.category} 
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Сумма (₸)</Label>
              <Input
                type="number"
                value={newTransaction.amount || ''}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                placeholder="100000"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание (опционально)</Label>
              <Input
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Комментарий к транзакции..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddTransaction}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
