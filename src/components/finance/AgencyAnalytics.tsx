import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableFooter
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Zap,
  Loader2,
  Sparkles,
  TrendingUp,
  Target,
  Wallet
} from 'lucide-react';
import { useAgencyFinances } from '@/hooks/useAgencyFinances';

const TIERS = [
  { value: 'lite', label: 'Lite', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { value: 'pro', label: 'Pro', color: 'bg-violet-500/20 text-violet-400 border-violet-500/50' },
  { value: 'legacy', label: 'Legacy', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' }
] as const;

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatUSD = (value: number): string => {
  return '$' + new Intl.NumberFormat('en-US').format(Math.round(value));
};

// Exchange rate: 1 USD = 450 KZT (примерный курс)
const KZT_TO_USD = 450;

export const AgencyAnalytics = () => {
  const { finances, loading, savingIds, totals, updateFinance } = useAgencyFinances();

  // Calculate net profit for a project
  const calculateNetProfit = (finance: typeof finances[0]): number => {
    if (finance.yuri_net_profit !== undefined) {
      return finance.yuri_net_profit;
    }
    return finance.package_revenue - finance.total_expenses;
  };

  // Annual goal: $100,000
  const ANNUAL_GOAL_USD = 100000;
  const ANNUAL_GOAL_KZT = ANNUAL_GOAL_USD * KZT_TO_USD;
  const MONTHLY_GOAL_KZT = ANNUAL_GOAL_KZT / 12;
  
  // Current progress
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
    <div className="space-y-6">
      {/* TOTAL RADAR - GLOW CARD */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-transparent">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-transparent opacity-50 blur-3xl" />
        
        <CardContent className="relative pt-8 pb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left: Main Profit */}
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/20 backdrop-blur">
                <Zap className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-emerald-400/80 font-medium mb-1">
                  💰 Чистая прибыль Юрия за месяц
                </p>
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-bold text-emerald-400 tabular-nums tracking-tight glow-text">
                    {formatCurrency(totals.yuriNetProfit)}
                  </p>
                  <p className="text-2xl text-emerald-400/60">
                    ({formatUSD(yuriProfitUSD)})
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Goal Progress */}
            <div className="w-full lg:w-96">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-muted-foreground">
                    Цель: {formatUSD(ANNUAL_GOAL_USD)} / год
                  </span>
                </div>
                <span className="text-sm font-semibold text-emerald-400">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
              
              <Progress 
                value={progressPercent} 
                className="h-3 bg-emerald-950/30"
              />
              
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Прогноз: {formatUSD(annualProjectionUSD)} / год</span>
                <span className={annualProjectionUSD >= ANNUAL_GOAL_USD ? 'text-emerald-400' : 'text-orange-400'}>
                  {annualProjectionUSD >= ANNUAL_GOAL_USD 
                    ? `+${formatUSD(annualProjectionUSD - ANNUAL_GOAL_USD)}` 
                    : `${formatUSD(annualProjectionUSD - ANNUAL_GOAL_USD)}`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-emerald-500/20">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Выручка</p>
              <p className="text-lg font-bold text-blue-400">{formatCurrency(totals.totalRevenue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Расходы</p>
              <p className="text-lg font-bold text-orange-400">{formatCurrency(totals.totalExpenses)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Проектов в ₸+</p>
              <p className="text-lg font-bold text-emerald-400">{totals.profitableProjects} / {totals.projectsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-violet-400" />
            <CardTitle className="text-lg">Детализация по проектам</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">
                    Проект
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-28">
                    Тариф
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-36">
                    Выручка ₸
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium min-w-48">
                    Команда
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-36">
                    Расходы (ЗП+Софт) ₸
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-muted-foreground/70 font-medium w-36 text-right">
                    💰 Прибыль Юрия
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finances.map((finance) => {
                  const netProfit = calculateNetProfit(finance);
                  const isSaving = savingIds.has(finance.project_id);
                  
                  return (
                    <TableRow 
                      key={finance.project_id} 
                      className="border-border/30 hover:bg-muted/5 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isSaving && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                          <span className="truncate max-w-[200px]">{finance.project_name}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={finance.tier}
                          onValueChange={(value) => updateFinance(finance.project_id, 'tier', value)}
                        >
                          <SelectTrigger className="h-8 bg-background/50 border-border/50 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIERS.map(tier => (
                              <SelectItem key={tier.value} value={tier.value}>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${tier.color}`}
                                >
                                  {tier.label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          value={finance.package_revenue || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateFinance(finance.project_id, 'package_revenue', value);
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value !== finance.package_revenue) {
                              updateFinance(finance.project_id, 'package_revenue', value);
                            }
                          }}
                          className="h-8 bg-background/50 border-border/50 text-sm"
                          placeholder="0"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          value={finance.team_members}
                          onChange={(e) => {
                            updateFinance(finance.project_id, 'team_members', e.target.value);
                          }}
                          onBlur={(e) => {
                            if (e.target.value !== finance.team_members) {
                              updateFinance(finance.project_id, 'team_members', e.target.value);
                            }
                          }}
                          className="h-8 bg-background/50 border-border/50 text-sm"
                          placeholder="Алия, Иван, Марина"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          value={finance.total_expenses || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateFinance(finance.project_id, 'total_expenses', value);
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            if (value !== finance.total_expenses) {
                              updateFinance(finance.project_id, 'total_expenses', value);
                            }
                          }}
                          className="h-8 bg-background/50 border-border/50 text-sm"
                          placeholder="0"
                        />
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {netProfit > 0 && <Sparkles className="w-3 h-3 text-emerald-400" />}
                          <span className={`font-bold text-sm glow-text ${
                            netProfit >= 0 
                              ? 'text-emerald-400' 
                              : 'text-red-400'
                          }`}>
                            {formatCurrency(netProfit)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/10 border-t-2 border-border/50">
                  <TableCell className="font-bold text-foreground">
                    ИТОГО
                  </TableCell>
                  <TableCell />
                  <TableCell className="font-semibold text-blue-400">
                    {formatCurrency(totals.totalRevenue)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="font-semibold text-orange-400">
                    {formatCurrency(totals.totalExpenses)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className={`font-bold text-lg glow-text ${
                        totals.yuriNetProfit >= 0 
                          ? 'text-emerald-400' 
                          : 'text-red-400'
                      }`}>
                        {formatCurrency(totals.yuriNetProfit)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <style>{`
        .glow-text {
          text-shadow: 0 0 20px currentColor;
        }
      `}</style>
    </div>
  );
};
