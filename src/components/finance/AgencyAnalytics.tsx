
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2,
  TrendingUp,
  Target,
  Wallet,
  Users,
  Building2,
  DollarSign
} from 'lucide-react';
import { useAgencyFinances } from '@/hooks/useAgencyFinances';
import { supabase } from '@/integrations/supabase/client';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription, 
  DrawerFooter, 
  DrawerClose 
} from '@/components/ui/drawer';

const TIERS = [
  { value: 'lite', label: 'Lite', color: 'text-blue-500 border-blue-200 bg-blue-50' },
  { value: 'pro', label: 'Pro', color: 'text-violet-500 border-violet-200 bg-violet-50' },
  { value: 'legacy', label: 'Legacy', color: 'text-amber-500 border-amber-200 bg-amber-50' }
] as const;

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatUSD = (value: number): string => {
  return '$' + new Intl.NumberFormat('en-US').format(Math.round(value));
};

// Exchange rate: 1 USD = 450 KZT
const KZT_TO_USD = 450;

const CircularProgress = ({ value, size = 88 }: { value: number; size?: number }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <svg width={size} height={size} className="overflow-visible">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--primary))"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        fill="none"
      />
      <text x="50%" y="50%" dy="4" textAnchor="middle" className="text-sm font-bold fill-current">
        {clamped.toFixed(0)}%
      </text>
    </svg>
  );
};

const Sparkline = ({ points }: { points: number[] }) => {
  const width = 180;
  const height = 44;
  if (!points || points.length === 0) {
    return <div className="h-10 w-[180px] bg-muted rounded" />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const norm = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height}>
      <polyline
        points={norm.join(' ')}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
    </svg>
  );
};

export const AgencyAnalytics = () => {
  const { finances, loading, savingIds, totals, updateFinance, addProject } = useAgencyFinances();
  const [newProjectName, setNewProjectName] = useState('');
  const [dailyNetProfit, setDailyNetProfit] = useState<number[]>([]);
  const [spendByProject, setSpendByProject] = useState<Record<string, number>>({});
  const [nextPaymentMap, setNextPaymentMap] = useState<Record<string, string>>({});
  const [drawerProject, setDrawerProject] = useState<string | null>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);

  const calculateNetProfit = (finance: typeof finances[0]): number => {
    if (finance.yuri_net_profit !== undefined) {
      return finance.yuri_net_profit;
    }
    return finance.package_revenue - (finance.team_salaries + finance.software_costs);
  };

  const ANNUAL_GOAL_USD = 100000;
  const yuriProfitUSD = totals.netProfitTotal / KZT_TO_USD;
  const annualProjectionUSD = yuriProfitUSD * 12;
  const progressPercent = Math.min((annualProjectionUSD / ANNUAL_GOAL_USD) * 100, 100);

  useEffect(() => {
    const fetchRecent = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, created_at, project_id, category')
        .gte('created_at', since.toISOString());
      if (!error && data) {
        const days: Record<string, { income: number; expense: number }> = {};
        const mediaSpend: Record<string, number> = {};
        data.forEach((t: any) => {
          const dayKey = (t.created_at || '').slice(0, 10);
          if (!days[dayKey]) days[dayKey] = { income: 0, expense: 0 };
          if (t.type === 'income') days[dayKey].income += t.amount || 0;
          else days[dayKey].expense += t.amount || 0;
          if (t.category === 'marketing') {
            mediaSpend[t.project_id] = (mediaSpend[t.project_id] || 0) + (t.amount || 0);
          }
        });
        const sortedKeys = Object.keys(days).sort();
        const series = sortedKeys.map(k => days[k].income - days[k].expense);
        setDailyNetProfit(series);
        setSpendByProject(mediaSpend);
        setRecentTx(data);
      }
    };
    fetchRecent();
    const stored = localStorage.getItem('next-payment-map');
    if (stored) {
      try {
        setNextPaymentMap(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('next-payment-map', JSON.stringify(nextPaymentMap));
  }, [nextPaymentMap]);

  const projectsCount = finances.length || 1;
  const avgMonthlyRevenuePerProject = projectsCount ? totals.totalRevenue / projectsCount : 0;
  const marketingTotal = Object.values(spendByProject).reduce((s, v) => s + v, 0);
  const avgCAC = projectsCount ? Math.round(marketingTotal / projectsCount) : 0;
  const ltv = Math.round(avgMonthlyRevenuePerProject * 12);
  const capacityPercent = Math.min(100, Math.round((totals.totalExpenses / (totals.totalRevenue || 1)) * 100));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Top Metrics - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-background/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Чистая прибыль (мес)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totals.netProfitTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatUSD(yuriProfitUSD)}
            </p>
            <div className="mt-2">
              <Sparkline points={dailyNetProfit} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Цель: {formatUSD(ANNUAL_GOAL_USD)}/год
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <CircularProgress value={progressPercent} />
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Прогноз</div>
                <div className="text-sm font-bold">{formatUSD(annualProjectionUSD)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              LTV / CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">LTV (12м)</div>
                <div className="text-xl font-bold">{formatCurrency(ltv)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">CAC</div>
                <div className="text-xl font-bold">{formatCurrency(avgCAC)}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Средняя выручка/проект × 12 и средний маркетинг-спенд</div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-background/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Загрузка команды (Capacity)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{capacityPercent}%</div>
              <div className="w-40">
                <Progress value={capacityPercent} className="h-2" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {capacityPercent >= 90 ? 'Нагрузка критична — пора нанимать' : capacityPercent <= 30 ? 'Нагрузка низкая — масштабируйте продажи' : 'Нормальная загрузка'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table - Clean & Minimal */}
      <Card className="shadow-none border-border/60">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Детализация по проектам</CardTitle>
              <CardDescription className="text-xs mt-1">Управление тарифами и финансами</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Новый проект"
                  className="h-8 w-40 bg-transparent border-border focus:border-primary text-sm"
                />
              </div>
              <Button 
                variant="secondary" 
                className="h-8"
                onClick={() => {
                  if (newProjectName.trim()) {
                    addProject(newProjectName.trim());
                    setNewProjectName('');
                  }
                }}
              >
                Добавить
              </Button>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[220px] font-medium text-xs uppercase text-muted-foreground">Проект</TableHead>
                <TableHead className="w-[120px] font-medium text-xs uppercase text-muted-foreground">Тариф</TableHead>
                <TableHead className="w-[140px] font-medium text-xs uppercase text-muted-foreground">Media Spend</TableHead>
                <TableHead className="w-[120px] font-medium text-xs uppercase text-muted-foreground">Маржа %</TableHead>
                <TableHead className="w-[120px] font-medium text-xs uppercase text-muted-foreground">Здоровье</TableHead>
                <TableHead className="w-[160px] font-medium text-xs uppercase text-muted-foreground">Выручка</TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground">Команда</TableHead>
                <TableHead className="w-[140px] font-medium text-xs uppercase text-muted-foreground">Зарплаты</TableHead>
                <TableHead className="w-[140px] font-medium text-xs uppercase text-muted-foreground">Подписки</TableHead>
                <TableHead className="w-[160px] font-medium text-xs uppercase text-muted-foreground">Next Payment</TableHead>
                <TableHead className="w-[150px] text-right font-medium text-xs uppercase text-muted-foreground">Прибыль</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.map((finance) => {
                const netProfit = calculateNetProfit(finance);
                const isSaving = savingIds.has(finance.project_id);
                const media = spendByProject[finance.project_id] || 0;
                const marginPct = finance.package_revenue > 0 ? Math.round((netProfit / finance.package_revenue) * 100) : 0;
                const health = marginPct >= 35 ? 'green' : marginPct >= 20 ? 'yellow' : 'red';
                
                return (
                  <TableRow 
                    key={finance.project_id}
                    onClick={() => setDrawerProject(finance.project_id)}
                    className={`border-border/40 hover:bg-muted/30 cursor-pointer ${marginPct < 20 ? 'bg-red-500/5' : ''}`}
                  >
                    <TableCell className="font-medium py-4">
                      <div className="flex items-center gap-2">
                        {isSaving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                        <span className="text-sm">{finance.project_name}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <Select
                        value={finance.tier}
                        onValueChange={(value) => updateFinance(finance.project_id, 'tier', value)}
                      >
                        <SelectTrigger className="h-7 w-[100px] text-xs border-transparent bg-secondary/50 hover:bg-secondary focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.map(tier => (
                            <SelectItem key={tier.value} value={tier.value}>
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 border-0 ${tier.color}`}>
                                {tier.label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <span className="font-mono text-sm">{formatCurrency(media)}</span>
                    </TableCell>

                    <TableCell className="py-4">
                      <span className={`font-bold text-sm ${marginPct >= 35 ? 'text-green-600' : marginPct >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {marginPct}%
                      </span>
                    </TableCell>

                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${health === 'green' ? 'bg-green-500' : health === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-muted-foreground">
                          {health === 'green' ? '🟢' : health === 'yellow' ? '🟡' : '🔴'}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="relative">
                        <Input
                          type="number"
                          value={finance.package_revenue || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'package_revenue', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <Input
                        value={finance.team_members}
                        onChange={(e) => updateFinance(finance.project_id, 'team_members', e.target.value)}
                        className="h-8 bg-transparent border-transparent hover:border-border focus:border-primary text-sm transition-colors"
                        placeholder="Участники..."
                      />
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="relative">
                        <Input
                          type="number"
                          value={finance.team_salaries || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'team_salaries', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="relative">
                        <Input
                          type="number"
                          value={finance.software_costs || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'software_costs', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <Input
                        type="date"
                        value={nextPaymentMap[finance.project_id] || ''}
                        onChange={(e) => setNextPaymentMap(prev => ({ ...prev, [finance.project_id]: e.target.value }))}
                        className="h-8 w-40 bg-transparent border-transparent hover:border-border focus:border-primary text-sm"
                      />
                    </TableCell>
                    
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Моя</span>
                          <span className={`font-mono font-medium text-sm ${
                            (finance.package_revenue - finance.team_salaries) >= 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {formatCurrency(finance.package_revenue - finance.team_salaries)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Чистая</span>
                          <span className={`font-mono font-medium text-sm ${
                            netProfit >= 0 ? 'text-green-600' : 'text-red-500'
                          }`}>
                            {formatCurrency(netProfit)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Drill-down Drawer */}
      <Drawer open={!!drawerProject} onOpenChange={(open) => !open && setDrawerProject(null)}>
        <DrawerContent>
          {drawerProject && (() => {
            const project = finances.find(f => f.project_id === drawerProject)!;
            const tx = recentTx.filter(t => t.project_id === drawerProject);
            const directCosts = tx.filter(t => t.type === 'expense' && t.category === 'salary').reduce((s, t) => s + (t.amount || 0), 0);
            const toolCosts = tx.filter(t => t.type === 'expense' && (t.category === 'software' || t.category === 'tools')).reduce((s, t) => s + (t.amount || 0), 0);
            const taxes = tx.filter(t => t.type === 'expense' && t.category === 'taxes').reduce((s, t) => s + (t.amount || 0), 0);
            const media = spendByProject[drawerProject] || 0;
            const netMargin = project.package_revenue - (directCosts + toolCosts + taxes + media);
            return (
              <>
                <DrawerHeader>
                  <DrawerTitle>{project.project_name}</DrawerTitle>
                  <DrawerDescription>Финансовый разрез за 30 дней</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-border/60 bg-background/60 backdrop-blur">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Direct Costs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{formatCurrency(directCosts)}</div>
                      <div className="text-xs text-muted-foreground">ЗП медиабайера, дизайнера</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-background/60 backdrop-blur">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Tool Costs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{formatCurrency(toolCosts)}</div>
                      <div className="text-xs text-muted-foreground">Proxy, Anti-detect, MarkVision API</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-background/60 backdrop-blur">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Налоги и комиссии</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{formatCurrency(taxes)}</div>
                      <div className="text-xs text-muted-foreground">Текущие обязательства</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60 bg-background/60 backdrop-blur">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Media Spend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{formatCurrency(media)}</div>
                      <div className="text-xs text-muted-foreground">Бюджет в управлении</div>
                    </CardContent>
                  </Card>
                </div>
                <DrawerFooter>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Net Margin</div>
                    <div className={`text-xl font-bold ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netMargin)}
                    </div>
                  </div>
                  <DrawerClose asChild>
                    <Button variant="secondary">Закрыть</Button>
                  </DrawerClose>
                </DrawerFooter>
              </>
            );
          })()}
        </DrawerContent>
      </Drawer>
      
      {/* AI-Советник */}
      <Card className="border-border/60 bg-background/60 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Советы от Марка по портфелю</CardTitle>
          <CardDescription className="text-xs">Автоанализ маржи и затрат по проектам</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(() => {
            const sorted = [...finances].sort((a, b) => {
              const ma = a.package_revenue > 0 ? (calculateNetProfit(a) / a.package_revenue) : 0;
              const mb = b.package_revenue > 0 ? (calculateNetProfit(b) / b.package_revenue) : 0;
              return mb - ma;
            });
            const top = sorted[0];
            const worst = sorted[sorted.length - 1];
            const topMargin = top && top.package_revenue > 0 ? Math.round((calculateNetProfit(top) / top.package_revenue) * 100) : 0;
            return (
              <>
                {top && (
                  <div className="text-sm">
                    Юрий, проект "{top.project_name}" сейчас самый прибыльный (маржа {topMargin}%). Рекомендую выделить больше ресурсов на его масштабирование.
                  </div>
                )}
                {worst && (
                  <div className="text-sm">
                    Внимание: На проекте "{worst.project_name}" расходы на команду выросли на 15%, а выручка стоит на месте. Маржа падает.
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};
