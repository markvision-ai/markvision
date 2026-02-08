import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { FinancialFact, PlanIndicators } from '@/hooks/useFinancialMonthData';
import { Target, Wallet, CreditCard, Sparkles, TrendingUp, Users, DollarSign, Calculator } from 'lucide-react';

export interface ChannelData {
  revenueGoal: number;
  avgCheck: number;
  crLeadToVisit: number;
  crVisitToSale: number;
  cplBest: number;
  cplAvg: number;
  cplWorst: number;
  calcMode: 'goal' | 'budget';
  budgetInput: number;
  rationaleBest?: string;
  rationaleAvg?: string;
  rationaleWorst?: string;
}

interface ChannelFinancialModelProps {
  channelName: string;
  channelId?: string;
  data: ChannelData;
  onChange?: (data: ChannelData) => void;
  isSummary?: boolean;
  planIndicators?: PlanIndicators;
  fact?: FinancialFact;
}

export const ChannelFinancialModel = ({
  data,
  onChange,
}: ChannelFinancialModelProps) => {
  const handleChange = (field: keyof ChannelData, value: any) => {
    if (onChange) {
      onChange({ ...data, [field]: value });
    }
  };

  // Helper to calculate row data
  const calculateRow = (name: string, cpl: number) => {
    const safeRevenueGoal = Number(data.revenueGoal) || 0;
    const safeAvgCheck = Number(data.avgCheck) || 0;
    const safeCrLeadToVisit = Number(data.crLeadToVisit) || 0;
    const safeCrVisitToSale = Number(data.crVisitToSale) || 0;
    const safeCpl = Number(cpl) || 0;
    const safeBudget = Number(data.budgetInput) || 0;

    let sales = 0, visits = 0, leads = 0, budget = 0, revenue = 0;

    if (data.calcMode === 'goal') {
      // Reverse calculation: Revenue -> Sales -> Visits -> Leads -> Budget
      sales = safeAvgCheck > 0 ? Math.ceil(safeRevenueGoal / safeAvgCheck) : 0;
      // Sales = Visits * (CR Visit->Sale / 100) => Visits = Sales / (CR / 100)
      visits = safeCrVisitToSale > 0 ? Math.ceil(sales / (safeCrVisitToSale / 100)) : 0;
      // Visits = Leads * (CR Lead->Visit / 100) => Leads = Visits / (CR / 100)
      leads = safeCrLeadToVisit > 0 ? Math.ceil(visits / (safeCrLeadToVisit / 100)) : 0;

      budget = leads * safeCpl;
      revenue = sales * safeAvgCheck; // Should match goal approx
    } else {
      // Forward calculation: Budget -> Leads -> Visits -> Sales -> Revenue
      budget = safeBudget;
      leads = safeCpl > 0 ? Math.floor(budget / safeCpl) : 0;
      visits = Math.floor(leads * ((safeCrLeadToVisit || 0) / 100));
      sales = Math.floor(visits * ((safeCrVisitToSale || 0) / 100));
      revenue = sales * safeAvgCheck;
    }

    return {
      name, budget, leads, cpl: safeCpl, visits, sales, avgCheck: safeAvgCheck,
      revenue
    };
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  const renderScenarioRow = (
    scenarioName: string,
    cpl: number,
    onChangeCpl: (val: number) => void,
    rationale: string | undefined,
    onChangeRationale: (val: string) => void,
    rowType: 'best' | 'avg' | 'worst'
  ) => {
    const row = calculateRow(scenarioName, cpl);
    const visitCost = row.visits > 0 ? row.budget / row.visits : 0;
    const cac = row.sales > 0 ? row.budget / row.sales : 0;
    const romi = row.budget > 0 ? ((row.revenue - row.budget) / row.budget) * 100 : 0;

    const rowStyles = {
      best: "bg-emerald-500/5 hover:bg-emerald-500/10 border-l-emerald-500/50",
      avg: "bg-blue-500/5 hover:bg-blue-500/10 border-l-blue-500/50",
      worst: "bg-red-500/5 hover:bg-red-500/10 border-l-red-500/50"
    };

    const textColors = {
      best: "text-emerald-400",
      avg: "text-blue-400",
      worst: "text-red-400"
    };

    return (
      <>
        <TableRow className={cn("border-b border-white/5 transition-all", rowStyles[rowType], "border-l-4")}>
          <TableCell className={cn("font-bold whitespace-nowrap text-sm align-top pt-4 px-4", textColors[rowType])}>
            {scenarioName}
          </TableCell>
          <TableCell className="text-right p-2 align-top">
            <div className="px-2 py-1.5 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-muted-foreground shadow-inner">
              {formatCurrency(row.budget)}
            </div>
          </TableCell>
          <TableCell className="text-right font-mono text-sm font-medium text-foreground/80 align-top pt-4 px-3">{row.leads}</TableCell>
          <TableCell className="text-right p-2 align-top">
            <div className="relative group/input">
              <Input
                type="number"
                value={cpl}
                onChange={(e) => onChangeCpl(Number(e.target.value))}
                className="h-8 text-right font-medium text-sm w-full bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all font-mono"
              />
              <span className="absolute right-8 top-2 text-[10px] text-muted-foreground/50 opacity-0 group-hover/input:opacity-100 transition-opacity pointer-events-none">CPL</span>
            </div>
          </TableCell>
          <TableCell className="text-right font-mono text-sm font-medium text-foreground/80 align-top pt-4 px-3">{row.visits}</TableCell>
          <TableCell className="text-right font-mono text-sm font-medium text-foreground/80 align-top pt-4 px-3">{row.sales}</TableCell>

          <TableCell className="text-right p-2 align-top">
            <div className="flex items-center justify-end gap-1 relative group/cr">
              <Input
                type="number"
                value={data.crLeadToVisit}
                onChange={(e) => handleChange('crLeadToVisit', Number(e.target.value))}
                className="h-8 text-right font-medium text-sm w-16 bg-transparent border-transparent hover:bg-white/5 focus:bg-white/10 transition-all p-0 shadow-none focus:ring-0"
              />
              <span className="text-xs font-medium text-muted-foreground pt-1">%</span>
              <div className="absolute inset-x-0 bottom-1 h-px bg-white/10 group-hover/cr:bg-white/30 transition-colors" />
            </div>
          </TableCell>
          <TableCell className="text-right font-mono text-xs text-muted-foreground align-top pt-4 px-3">{formatCurrency(visitCost)}</TableCell>
          <TableCell className="text-right p-2 align-top">
            <div className="flex items-center justify-end gap-1 relative group/cr">
              <Input
                type="number"
                value={data.crVisitToSale}
                onChange={(e) => handleChange('crVisitToSale', Number(e.target.value))}
                className="h-8 text-right font-medium text-sm w-16 bg-transparent border-transparent hover:bg-white/5 focus:bg-white/10 transition-all p-0 shadow-none focus:ring-0"
              />
              <span className="text-xs font-medium text-muted-foreground pt-1">%</span>
              <div className="absolute inset-x-0 bottom-1 h-px bg-white/10 group-hover/cr:bg-white/30 transition-colors" />
            </div>
          </TableCell>
          <TableCell className="text-right font-mono text-xs text-muted-foreground align-top pt-4 px-3">{formatCurrency(cac)}</TableCell>
          <TableCell className="text-right font-mono text-sm font-bold text-foreground align-top pt-4 px-3 bg-white/5">{formatCurrency(row.revenue)}</TableCell>
          <TableCell className={cn("text-right font-bold text-sm align-top pt-4 px-3", romi > 0 ? "text-emerald-400" : "text-red-400")}>
            {Math.round(romi)}%
          </TableCell>
        </TableRow>
        <TableRow className={cn("border-b border-white/5", rowStyles[rowType], "border-l-4")}>
          <TableCell colSpan={13} className="p-0 px-4 pb-3 pt-0">
            <div className="relative">
              <Textarea
                placeholder={`Обоснование сценария "${scenarioName}"...`}
                value={rationale || ''}
                onChange={(e) => onChangeRationale(e.target.value)}
                className="min-h-[30px] h-[30px] resize-y text-xs bg-black/20 border-white/5 focus:border-white/10 focus-visible:ring-0 placeholder:text-muted-foreground/40 w-full rounded-md transition-all"
              />
            </div>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Premium Glassmorphism Input Form */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Финансовое моделирование
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 font-medium">AI Ready</span>
              </h3>
              <p className="text-xs text-muted-foreground">Рассчитайте необходимый бюджет или целевую выручку</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Goal Input */}
            <div className={cn(
              "group relative p-4 rounded-xl border transition-all duration-300",
              data.calcMode === 'goal'
                ? "bg-primary/5 border-primary/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                : "bg-white/5 border-white/5 hover:border-white/10 opacity-80 hover:opacity-100"
            )}>
              <Label className={cn(
                "text-xs font-semibold mb-2 block flex items-center gap-2 uppercase tracking-wider",
                data.calcMode === 'goal' ? "text-primary" : "text-muted-foreground"
              )}>
                <Target className="w-3.5 h-3.5" /> Целевая выручка
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={data.revenueGoal}
                  onChange={(e) => {
                    handleChange('revenueGoal', Number(e.target.value));
                    handleChange('calcMode', 'goal');
                  }}
                  className="h-10 text-xl font-bold bg-transparent border-none focus:ring-0 p-0 shadow-none font-mono"
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₸</div>
              </div>
              {data.calcMode === 'goal' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>

            {/* Average Check Input */}
            <div className="group relative p-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition-all duration-300">
              <Label className="text-xs font-semibold mb-2 block flex items-center gap-2 uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                <CreditCard className="w-3.5 h-3.5" /> Средний чек
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={data.avgCheck}
                  onChange={(e) => handleChange('avgCheck', Number(e.target.value))}
                  className="h-10 text-xl font-bold bg-transparent border-none focus:ring-0 p-0 shadow-none font-mono"
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₸</div>
              </div>
            </div>

            {/* Budget Input */}
            <div className={cn(
              "group relative p-4 rounded-xl border transition-all duration-300",
              data.calcMode === 'budget'
                ? "bg-primary/5 border-primary/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                : "bg-white/5 border-white/5 hover:border-white/10 opacity-80 hover:opacity-100"
            )}>
              <Label className={cn(
                "text-xs font-semibold mb-2 block flex items-center gap-2 uppercase tracking-wider",
                data.calcMode === 'budget' ? "text-primary" : "text-muted-foreground"
              )}>
                <Wallet className="w-3.5 h-3.5" /> Рекламный бюджет
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={data.budgetInput}
                  onChange={(e) => {
                    handleChange('budgetInput', Number(e.target.value));
                    handleChange('calcMode', 'budget');
                  }}
                  className="h-10 text-xl font-bold bg-transparent border-none focus:ring-0 p-0 shadow-none font-mono"
                />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">₸</div>
              </div>
              {data.calcMode === 'budget' && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Glassmorphism Table */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-white/10 bg-white/5 hover:bg-white/5">
                <TableHead className="w-[140px] font-bold px-4 py-4 text-white uppercase text-xs tracking-wider">Сценарий</TableHead>
                <TableHead className="text-right px-2 py-4 text-muted-foreground text-xs uppercase tracking-wider">Бюджет</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">Лиды</TableHead>
                <TableHead className="text-right px-3 py-4 text-white font-semibold text-xs uppercase tracking-wider">CPL</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">Диагн.</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">Продажи</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">CR (L-V)</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">Cost (D)</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">CR (V-S)</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">CAC</TableHead>
                <TableHead className="text-right px-3 py-4 text-white font-bold text-xs uppercase tracking-wider bg-white/5">Выручка</TableHead>
                <TableHead className="text-right px-3 py-4 text-muted-foreground text-xs uppercase tracking-wider">ROMI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderScenarioRow('Лучший', data.cplBest, (v) => handleChange('cplBest', v), data.rationaleBest, (v) => handleChange('rationaleBest', v), 'best')}
              {renderScenarioRow('Средний', data.cplAvg, (v) => handleChange('cplAvg', v), data.rationaleAvg, (v) => handleChange('rationaleAvg', v), 'avg')}
              {renderScenarioRow('Худший', data.cplWorst, (v) => handleChange('cplWorst', v), data.rationaleWorst, (v) => handleChange('rationaleWorst', v), 'worst')}
            </TableBody>
          </Table>
        </CardContent>
      </div>
    </div>
  );
};
