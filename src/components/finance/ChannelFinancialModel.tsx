import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { FinancialFact, PlanIndicators } from '@/hooks/useFinancialMonthData';
import { Target, CreditCard, Calculator } from 'lucide-react';

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

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);

const SCENARIO_STYLES = {
  best: {
    row: 'bg-blue-500/5 border-l-4 border-l-blue-500',
    label: 'text-blue-700 dark:text-blue-400 font-semibold',
    romi: 'text-blue-600 dark:text-blue-400',
  },
  avg: {
    row: 'bg-slate-500/5 dark:bg-slate-500/10 border-l-4 border-l-slate-500 dark:border-l-slate-400',
    label: 'text-slate-700 dark:text-slate-300 font-semibold',
    romi: 'text-slate-600 dark:text-slate-400',
  },
  worst: {
    row: 'bg-red-500/5 border-l-4 border-l-red-500',
    label: 'text-red-700 dark:text-red-400 font-semibold',
    romi: 'text-red-600 dark:text-red-400',
  },
} as const;

export const ChannelFinancialModel = ({
  data,
  onChange,
}: ChannelFinancialModelProps) => {
  const handleChange = (field: keyof ChannelData, value: any) => {
    if (onChange) onChange({ ...data, [field]: value });
  };

  const rev = Number(data.revenueGoal) || 0;
  const avgCheck = Number(data.avgCheck) || 0;
  const crVisitToSale = Number(data.crVisitToSale) || 0;
  const crLeadToVisit = Number(data.crLeadToVisit) || 0;

  const salesNeeded = avgCheck > 0 ? Math.ceil(rev / avgCheck) : 0;
  const visitsNeeded = crVisitToSale > 0 ? Math.ceil(salesNeeded / (crVisitToSale / 100)) : 0;
  const leadsNeeded = crLeadToVisit > 0 ? Math.ceil(visitsNeeded / (crLeadToVisit / 100)) : 0;

  const budgetFromGoal = (cpl: number) => leadsNeeded * (Number(cpl) || 0);
  const revenueFromGoal = salesNeeded * avgCheck;

  const scenarioRow = (
    name: string,
    cpl: number,
    onCplChange: (v: number) => void,
    rationale: string | undefined,
    onRationaleChange: (v: string) => void,
    rowType: 'best' | 'avg' | 'worst'
  ) => {
    const budget = budgetFromGoal(cpl);
    const romi = budget > 0 ? ((revenueFromGoal - budget) / budget) * 100 : 0;
    const styles = SCENARIO_STYLES[rowType];
    return (
      <>
        <TableRow className={cn('border-b border-white/50', styles.row)}>
          <TableCell className={cn('w-[100px] pl-4 pr-3 py-3 align-middle', styles.label)}>{name}</TableCell>
          <TableCell className="text-right py-3 px-2 align-middle w-[100px]">
            <Input
              type="number"
              min={0}
              value={cpl || ''}
              onChange={(e) => onCplChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="h-9 text-right text-sm font-mono w-full min-w-[72px] bg-background border-white/50"
            />
          </TableCell>
          <TableCell className="text-right py-3 px-3 font-mono text-sm tabular-nums text-foreground align-middle">{leadsNeeded}</TableCell>
          <TableCell className="text-right py-3 px-3 font-mono text-sm tabular-nums text-foreground align-middle">{visitsNeeded}</TableCell>
          <TableCell className="text-right py-3 px-3 font-mono text-sm tabular-nums text-foreground align-middle">{salesNeeded}</TableCell>
          <TableCell className="text-right py-3 px-3 font-mono text-sm tabular-nums text-foreground align-middle">{formatCurrency(budget)}</TableCell>
          <TableCell className="text-right py-3 px-3 font-mono text-sm font-medium tabular-nums text-foreground align-middle">{formatCurrency(revenueFromGoal)}</TableCell>
          <TableCell className={cn('text-right py-3 px-3 font-mono text-sm font-semibold tabular-nums align-middle', styles.romi)}>{Math.round(romi)}%</TableCell>
        </TableRow>
        <TableRow className={cn('border-b border-white/50', styles.row)}>
          <TableCell colSpan={8} className="px-4 pb-3 pt-0 align-top">
            <Textarea
              placeholder={`Обоснование сценария «${name}» (необязательно)`}
              value={rationale || ''}
              onChange={(e) => onRationaleChange(e.target.value)}
              className="min-h-[28px] max-h-20 text-xs bg-background/50 border-white/50 rounded-md resize-y w-full placeholder:text-muted-foreground/60"
            />
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Card className="bg-card border border-white/50 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Параметры */}
        <div className="p-5 sm:p-6 border-b border-white/50 bg-muted/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Декомпозиция от цели</h3>
              <p className="text-xs text-muted-foreground">Измените параметры — таблица пересчитается</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Целевая выручка
              </Label>
              <Input
                type="number"
                min={0}
                value={data.revenueGoal || ''}
                onChange={(e) => {
                  handleChange('revenueGoal', Number(e.target.value) || 0);
                  handleChange('calcMode', 'goal');
                }}
                placeholder="500 000"
                className="h-10 font-mono bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Средний чек
              </Label>
              <Input
                type="number"
                min={0}
                value={data.avgCheck || ''}
                onChange={(e) => handleChange('avgCheck', Number(e.target.value) || 0)}
                placeholder="100 000"
                className="h-10 font-mono bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Конверсия визит → продажа, %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={data.crVisitToSale ?? ''}
                onChange={(e) => handleChange('crVisitToSale', Number(e.target.value) || 0)}
                placeholder="50"
                className="h-10 font-mono bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Конверсия лид → визит, %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={data.crLeadToVisit ?? ''}
                onChange={(e) => handleChange('crLeadToVisit', Number(e.target.value) || 0)}
                placeholder="50"
                className="h-10 font-mono bg-background"
              />
            </div>
          </div>
        </div>

        {/* Сценарии */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/50 bg-muted/40">
                <TableHead className="w-[100px] pl-4 py-3 text-xs font-semibold text-foreground uppercase tracking-wider">Сценарий</TableHead>
                <TableHead className="text-right py-3 px-2 w-[100px] text-xs font-semibold text-foreground uppercase tracking-wider">CPL, ₸</TableHead>
                <TableHead className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Лиды</TableHead>
                <TableHead className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Визиты</TableHead>
                <TableHead className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Продажи</TableHead>
                <TableHead className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Бюджет</TableHead>
                <TableHead className="text-right py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Выручка</TableHead>
                <TableHead className="text-right py-3 px-3 text-xs font-semibold text-foreground uppercase tracking-wider">ROMI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarioRow('Лучший', data.cplBest, (v) => handleChange('cplBest', v), data.rationaleBest, (v) => handleChange('rationaleBest', v), 'best')}
              {scenarioRow('Средний', data.cplAvg, (v) => handleChange('cplAvg', v), data.rationaleAvg, (v) => handleChange('rationaleAvg', v), 'avg')}
              {scenarioRow('Худший', data.cplWorst, (v) => handleChange('cplWorst', v), data.rationaleWorst, (v) => handleChange('rationaleWorst', v), 'worst')}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
