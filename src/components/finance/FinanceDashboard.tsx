import { useState, useEffect } from 'react';
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
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  CreditCard,
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  transaction_date: string;
  created_at: string;
}

interface FinanceDashboardProps {
  projectId: string;
}

export const FinanceDashboard = ({ projectId }: FinanceDashboardProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense' | 'transfer',
    category: '',
    amount: 0,
    description: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, [projectId]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('project_id', projectId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const { error } = await supabase.from('transactions').insert([{
        project_id: projectId,
        ...newTransaction,
      }]);

      if (error) throw error;
      
      toast.success('Транзакция добавлена');
      setIsAddDialogOpen(false);
      setNewTransaction({ type: 'income', category: '', amount: 0, description: '' });
      fetchTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Ошибка при добавлении транзакции');
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0;

  // Prepare chart data
  const chartData = transactions
    .slice(0, 30)
    .reverse()
    .reduce((acc: any[], t) => {
      const date = new Date(t.transaction_date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
      const existing = acc.find(d => d.date === date);
      if (existing) {
        if (t.type === 'income') existing.income += t.amount;
        else if (t.type === 'expense') existing.expense += t.amount;
      } else {
        acc.push({
          date,
          income: t.type === 'income' ? t.amount : 0,
          expense: t.type === 'expense' ? t.amount : 0,
        });
      }
      return acc;
    }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Финансы
          </h2>
          <p className="text-muted-foreground">P&L, транзакции и денежный поток</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <ArrowUpRight className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Доходы</p>
                <p className="text-2xl font-bold text-green-500">{totalIncome.toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <ArrowDownRight className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Расходы</p>
                <p className="text-2xl font-bold text-red-500">{totalExpense.toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Прибыль</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {profit.toLocaleString()} ₽
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <PiggyBank className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Маржа</p>
                <p className="text-2xl font-bold">{margin}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
          <TabsTrigger value="realtime">Реалтайм</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Динамика доходов и расходов</CardTitle>
              <CardDescription>За последние 30 дней</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--chart-1))"
                      fill="url(#incomeGradient)"
                      name="Доходы"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="hsl(var(--destructive))"
                      fill="url(#expenseGradient)"
                      name="Расходы"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>История транзакций</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Транзакции не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          {new Date(t.transaction_date).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.type === 'income' ? 'default' : 'destructive'}>
                            {t.type === 'income' ? (
                              <><TrendingUp className="w-3 h-3 mr-1" /> Доход</>
                            ) : t.type === 'expense' ? (
                              <><TrendingDown className="w-3 h-3 mr-1" /> Расход</>
                            ) : (
                              <><CreditCard className="w-3 h-3 mr-1" /> Перевод</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell>{t.description || '—'}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          t.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₽
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Финансы в реальном времени
              </CardTitle>
              <CardDescription>Мониторинг денежного потока</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Сегодня</h4>
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <p className="text-sm text-muted-foreground">Поступления</p>
                    <p className="text-3xl font-bold text-green-500">
                      +{transactions
                        .filter(t => t.type === 'income' && new Date(t.transaction_date).toDateString() === new Date().toDateString())
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <p className="text-sm text-muted-foreground">Списания</p>
                    <p className="text-3xl font-bold text-red-500">
                      -{transactions
                        .filter(t => t.type === 'expense' && new Date(t.transaction_date).toDateString() === new Date().toDateString())
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()} ₽
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Последние операции</h4>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {t.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">{t.category}</span>
                        </div>
                        <span className={`font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()} ₽
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить транзакцию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newTransaction.type}
                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as any })}
              >
                <option value="income">Доход</option>
                <option value="expense">Расход</option>
                <option value="transfer">Перевод</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Input
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                placeholder="Продажи, Реклама, ФОТ..."
              />
            </div>
            <div className="space-y-2">
              <Label>Сумма (₽)</Label>
              <Input
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Комментарий к транзакции"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddTransaction} disabled={!newTransaction.category || !newTransaction.amount}>
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
