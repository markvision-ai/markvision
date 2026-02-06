import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { FinancialFact, PlanIndicators } from '@/hooks/useFinancialMonthData';

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
    colorClass: string
  ) => {
    const row = calculateRow(scenarioName, cpl);
    const visitCost = row.visits > 0 ? row.budget / row.visits : 0;
    const cac = row.sales > 0 ? row.budget / row.sales : 0;
    const romi = row.budget > 0 ? ((row.revenue - row.budget) / row.budget) * 100 : 0;

    return (
      <>
        <TableRow className={cn("hover:bg-muted/30 border-b border-slate-300", colorClass)}>
          <TableCell className="font-semibold whitespace-nowrap text-sm text-foreground align-top pt-3 border-r border-slate-300 px-3">{scenarioName}</TableCell>
          <TableCell className="text-right p-1.5 align-top border-r border-slate-300">
             <Input 
               type="number" 
               value={data.calcMode === 'goal' ? Math.round(row.budget) : data.budgetInput} 
               onChange={(e) => handleChange('budgetInput', Number(e.target.value))}
               disabled={data.calcMode === 'goal'}
               className={cn(
                 "h-8 text-right font-medium text-sm w-full border-none shadow-none focus-visible:ring-0 bg-transparent p-0",
                 data.calcMode === 'goal' 
                   ? "text-slate-600 cursor-not-allowed" 
                   : "text-foreground hover:bg-black/5"
               )}
             />
          </TableCell>
          <TableCell className="text-right font-mono text-sm font-medium text-foreground align-top pt-3 border-r border-slate-300 px-3">{row.leads}</TableCell>
          <TableCell className="text-right p-1.5 align-top border-r border-slate-300">
            <Input 
               type="number" 
               value={cpl} 
               onChange={(e) => onChangeCpl(Number(e.target.value))}
               className="h-8 text-right font-medium text-sm w-full border-none shadow-none focus-visible:ring-0 bg-transparent p-0 hover:bg-black/5"
             />
          </TableCell>
          <TableCell className="text-right font-mono text-sm font-medium text-foreground align-top pt-3 border-r border-slate-300 px-3">{row.visits}</TableCell>
          <TableCell className="text-right font-mono text-sm font-medium text-foreground align-top pt-3 border-r border-slate-300 px-3">{row.sales}</TableCell>
          <TableCell className="text-right p-1.5 align-top border-r border-slate-300">
            <Input 
               type="number" 
               value={data.avgCheck} 
               onChange={(e) => handleChange('avgCheck', Number(e.target.value))}
               className="h-8 text-right font-medium text-sm w-full border-none shadow-none focus-visible:ring-0 bg-transparent p-0 hover:bg-black/5"
             />
          </TableCell>
          <TableCell className="text-right p-1.5 align-top border-r border-slate-300">
            <div className="flex items-center justify-end gap-1">
               <Input 
                 type="number" 
                 value={data.crLeadToVisit} 
                 onChange={(e) => handleChange('crLeadToVisit', Number(e.target.value))}
                 className="h-8 text-right font-medium text-sm w-full border-none shadow-none focus-visible:ring-0 bg-transparent p-0 hover:bg-black/5"
               />
               <span className="text-xs font-medium text-muted-foreground pt-2">%</span>
            </div>
          </TableCell>
          <TableCell className="text-right font-mono text-xs text-muted-foreground align-top pt-3 border-r border-slate-300 px-3">{formatCurrency(visitCost)}</TableCell>
          <TableCell className="text-right p-1.5 align-top border-r border-slate-300">
            <div className="flex items-center justify-end gap-1">
               <Input 
                 type="number" 
                 value={data.crVisitToSale} 
                 onChange={(e) => handleChange('crVisitToSale', Number(e.target.value))}
                 className="h-8 text-right font-medium text-sm w-full border-none shadow-none focus-visible:ring-0 bg-transparent p-0 hover:bg-black/5"
               />
               <span className="text-xs font-medium text-muted-foreground pt-2">%</span>
            </div>
          </TableCell>
          <TableCell className="text-right font-mono text-xs text-muted-foreground align-top pt-3 border-r border-slate-300 px-3">{formatCurrency(cac)}</TableCell>
          <TableCell className="text-right font-mono text-sm font-bold text-foreground align-top pt-3 border-r border-slate-300 px-3">{formatCurrency(row.revenue)}</TableCell>
          <TableCell className={cn("text-right font-bold text-sm align-top pt-3 px-3", romi > 0 ? "text-emerald-600" : "text-red-600")}>
            {Math.round(romi)}%
          </TableCell>
        </TableRow>
        <TableRow className={cn("hover:bg-muted/30 border-b border-slate-300", colorClass)}>
          <TableCell colSpan={13} className="p-0 px-2 pb-2 pt-0 border-r border-l border-slate-300">
             <Textarea 
               placeholder={`Обоснование сценария "${scenarioName}"...`}
               value={rationale || ''}
               onChange={(e) => onChangeRationale(e.target.value)}
               className="min-h-[30px] h-[30px] resize-y text-xs bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/50 w-full"
             />
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-end bg-muted/20 p-3 rounded-lg border border-border/50">
        <div className="grid gap-1.5">
           <Label className="text-xs font-medium text-muted-foreground">Режим расчета</Label>
           <div className="flex items-center gap-1 bg-background border rounded-md p-0.5">
              <Button 
                 variant={data.calcMode === 'goal' ? 'secondary' : 'ghost'} 
                 size="sm" 
                 onClick={() => handleChange('calcMode', 'goal')}
                 className="text-xs h-7 px-3 shadow-none"
              >
                 От Цели (Выручка)
              </Button>
              <Button 
                 variant={data.calcMode === 'budget' ? 'secondary' : 'ghost'} 
                 size="sm" 
                 onClick={() => handleChange('calcMode', 'budget')}
                 className="text-xs h-7 px-3 shadow-none"
              >
                 От Бюджета
              </Button>
           </div>
        </div>

        {data.calcMode === 'goal' && (
          <div className="grid gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
            <Label className="text-xs font-medium text-muted-foreground">Целевая выручка (KZT)</Label>
            <Input 
               type="number" 
               value={data.revenueGoal} 
               onChange={(e) => handleChange('revenueGoal', Number(e.target.value))}
               className="h-8 w-[180px] font-mono"
            />
          </div>
        )}
      </div>

      {/* Scenario Calculation Table */}
      <Card className="border-none shadow-none overflow-hidden rounded-none">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="w-full border-collapse border border-slate-300">
            <TableHeader>
               <TableRow className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase tracking-wider">
                  <TableHead className="w-[140px] font-bold px-3 py-2 border-r border-slate-300 text-left text-slate-700 bg-slate-100">Сценарий</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[120px] text-slate-700 bg-slate-100">Бюджет</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[80px] text-slate-700 bg-slate-100">Лиды</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[100px] text-slate-700 bg-slate-100">CPL</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[80px] text-slate-700 bg-slate-100">Диагн.</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[80px] text-slate-700 bg-slate-100">Продажи</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[110px] text-slate-700 bg-slate-100">Ср. чек</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[90px] text-slate-700 bg-slate-100">CR (L-V)</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[90px] text-slate-700 bg-slate-100">Cost (D)</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[90px] text-slate-700 bg-slate-100">CR (V-S)</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[90px] text-slate-700 bg-slate-100">CAC</TableHead>
                  <TableHead className="text-right px-3 py-2 border-r border-slate-300 w-[110px] text-slate-700 bg-slate-100">Выручка</TableHead>
                  <TableHead className="text-right px-3 py-2 w-[80px] text-slate-700 bg-slate-100">ROMI</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {renderScenarioRow('Лучший', data.cplBest, (v) => handleChange('cplBest', v), data.rationaleBest, (v) => handleChange('rationaleBest', v), "bg-emerald-50/30")}
               {renderScenarioRow('Средний', data.cplAvg, (v) => handleChange('cplAvg', v), data.rationaleAvg, (v) => handleChange('rationaleAvg', v), "bg-yellow-50/30")}
               {renderScenarioRow('Худший', data.cplWorst, (v) => handleChange('cplWorst', v), data.rationaleWorst, (v) => handleChange('rationaleWorst', v), "bg-red-50/30")}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
