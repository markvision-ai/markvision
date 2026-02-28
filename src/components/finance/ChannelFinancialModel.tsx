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
    row: 'bg-secondary/5 border-l-4 border-l-secondary',
    label: 'text-secondary font-black uppercase tracking-widest text-[10px]',
    romi: 'text-secondary',
  },
  avg: {
    row: 'bg-white/5 border-l-4 border-l-white/20',
    label: 'text-white/60 font-black uppercase tracking-widest text-[10px]',
    romi: 'text-white/80',
  },
  worst: {
    row: 'bg-primary/5 border-l-4 border-l-primary',
    label: 'text-primary font-black uppercase tracking-widest text-[10px]',
    romi: 'text-primary',
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
        <TableRow className={cn('border-b border-white/5', styles.row)}>
          <TableCell className={cn('w-[120px] pl-6 pr-3 py-5 align-middle', styles.label)}>{name}</TableCell>
          <TableCell className="text-right py-5 px-2 align-middle w-[120px]">
            <Input
              type="number"
              min={0}
              value={cpl || ''}
              onChange={(e) => onCplChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="h-10 text-right text-sm font-black tabular-nums w-full min-w-[80px] bg-white/5 border-white/10 rounded-xl focus:border-primary/50 text-white"
            />
          </TableCell>
          <TableCell className="text-right py-5 px-4 font-black text-sm tabular-nums text-white/60 align-middle">{leadsNeeded}</TableCell>
          <TableCell className="text-right py-5 px-4 font-black text-sm tabular-nums text-white/60 align-middle">{visitsNeeded}</TableCell>
          <TableCell className="text-right py-5 px-4 font-black text-sm tabular-nums text-white/60 align-middle">{salesNeeded}</TableCell>
          <TableCell className="text-right py-5 px-4 font-black text-sm tabular-nums text-white/60 align-middle">{formatCurrency(budget)}</TableCell>
          <TableCell className="text-right py-5 px-4 font-black text-sm tabular-nums text-white align-middle">{formatCurrency(revenueFromGoal)}</TableCell>
          <TableCell className={cn('text-right py-5 px-6 font-black text-lg tabular-nums align-middle shadow-sm', styles.romi)}>{Math.round(romi)}%</TableCell>
        </TableRow>
        <TableRow className={cn('border-b border-white/5', styles.row)}>
          <TableCell colSpan={8} className="px-4 pb-3 pt-0 align-top">
            <Textarea
              placeholder={`Обоснование сценария «${name}» (необязательно)`}
              value={rationale || ''}
              onChange={(e) => onRationaleChange(e.target.value)}
              className="min-h-[40px] max-h-32 text-[10px] font-black uppercase tracking-wider bg-white/5 border-white/10 rounded-xl resize-y w-full placeholder:text-white/20 text-white/50 p-4"
            />
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl shadow-interstellar border border-white/10 rounded-[3rem] overflow-hidden">
      <CardContent className="p-0">
        {/* Параметры */}
        <div className="p-10 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white">Декомпозиция от цели</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Измените параметры — таблица пересчитается</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40 ml-1 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-primary" /> Целевая выручка
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
                className="h-12 font-black tabular-nums bg-white/5 border-white/10 rounded-2xl text-white text-lg focus:border-primary/50"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40 ml-1 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-secondary" /> Средний чек
              </Label>
              <Input
                type="number"
                min={0}
                value={data.avgCheck || ''}
                onChange={(e) => handleChange('avgCheck', Number(e.target.value) || 0)}
                placeholder="100 000"
                className="h-12 font-black tabular-nums bg-white/5 border-white/10 rounded-2xl text-white text-lg focus:border-secondary/50"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40 ml-1">Конверсия визит → продажа, %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={data.crVisitToSale ?? ''}
                onChange={(e) => handleChange('crVisitToSale', Number(e.target.value) || 0)}
                placeholder="50"
                className="h-12 font-black tabular-nums bg-white/5 border-white/10 rounded-2xl text-white text-lg focus:border-white/30"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/40 ml-1">Конверсия лид → визит, %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={data.crLeadToVisit ?? ''}
                onChange={(e) => handleChange('crLeadToVisit', Number(e.target.value) || 0)}
                placeholder="50"
                className="h-12 font-black tabular-nums bg-white/5 border-white/10 rounded-2xl text-white text-lg focus:border-white/30"
              />
            </div>
          </div>
        </div>

        {/* Сценарии */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-white/5 bg-white/[0.02]">
                <TableHead className="w-[120px] pl-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Сценарий</TableHead>
                <TableHead className="text-right py-5 px-2 w-[120px] text-[10px] font-black uppercase tracking-[0.2em] text-white/30">CPL, ₸</TableHead>
                <TableHead className="text-right py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Лиды</TableHead>
                <TableHead className="text-right py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Визиты</TableHead>
                <TableHead className="text-right py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Продажи</TableHead>
                <TableHead className="text-right py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Бюджет</TableHead>
                <TableHead className="text-right py-5 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Выручка</TableHead>
                <TableHead className="text-right py-5 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">ROMI</TableHead>
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
