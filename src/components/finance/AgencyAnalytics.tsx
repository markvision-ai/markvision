
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

export const AgencyAnalytics = () => {
  const { finances, loading, savingIds, totals, updateFinance } = useAgencyFinances();

  const calculateNetProfit = (finance: typeof finances[0]): number => {
    if (finance.yuri_net_profit !== undefined) {
      return finance.yuri_net_profit;
    }
    return finance.package_revenue - finance.total_expenses;
  };

  const ANNUAL_GOAL_USD = 100000;
  const yuriProfitUSD = totals.yuriNetProfit / KZT_TO_USD;
  const annualProjectionUSD = yuriProfitUSD * 12;
  const progressPercent = Math.min((annualProjectionUSD / ANNUAL_GOAL_USD) * 100, 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Top Metrics - Minimalist Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-none border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Чистая прибыль (мес)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totals.yuriNetProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatUSD(yuriProfitUSD)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Цель: {formatUSD(ANNUAL_GOAL_USD)}/год
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold">{progressPercent.toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground mb-1">
                Прогноз: {formatUSD(annualProjectionUSD)}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="shadow-none border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Общая выручка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totals.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Все проекты</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Проекты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.projectsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              В плюсе: <span className="text-green-600 font-medium">{totals.profitableProjects}</span>
            </p>
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
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[250px] font-medium text-xs uppercase text-muted-foreground">Проект</TableHead>
                <TableHead className="w-[120px] font-medium text-xs uppercase text-muted-foreground">Тариф</TableHead>
                <TableHead className="w-[180px] font-medium text-xs uppercase text-muted-foreground">Выручка</TableHead>
                <TableHead className="font-medium text-xs uppercase text-muted-foreground">Команда</TableHead>
                <TableHead className="w-[180px] font-medium text-xs uppercase text-muted-foreground">Расходы</TableHead>
                <TableHead className="w-[150px] text-right font-medium text-xs uppercase text-muted-foreground">Прибыль</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finances.map((finance) => {
                const netProfit = calculateNetProfit(finance);
                const isSaving = savingIds.has(finance.project_id);
                
                return (
                  <TableRow 
                    key={finance.project_id} 
                    className="border-border/40 hover:bg-muted/30"
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
                          value={finance.total_expenses || ''}
                          onChange={(e) => updateFinance(finance.project_id, 'total_expenses', parseFloat(e.target.value) || 0)}
                          className="h-8 w-32 bg-transparent border-transparent hover:border-border focus:border-primary text-sm font-mono transition-colors pl-2"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">₸</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right py-4">
                      <span className={`font-mono font-medium text-sm ${
                        netProfit >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {formatCurrency(netProfit)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
