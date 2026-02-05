import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { UnitEconomics } from './UnitEconomics';
import { SmartGoals } from './SmartGoals';
import { GoalDashboard } from './GoalDashboard';
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
}

interface ChannelFinancialModelProps {
  channelName: string;
  channelId?: string;
  data: ChannelData;
  onChange?: (data: ChannelData) => void;
  isSummary?: boolean;
  planIndicators?: PlanIndicators; // For GoalDashboard
  fact?: FinancialFact; // For GoalDashboard
}

export const ChannelFinancialModel = ({ 
  channelName, 
  channelId = 'default',
  data, 
  onChange, 
  isSummary = false,
  planIndicators,
  fact
}: ChannelFinancialModelProps) => {
  
  const getInputId = (field: string) => `input-${channelId}-${field}`;

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
      sales = Math.ceil(safeRevenueGoal / (safeAvgCheck || 1));
      visits = Math.ceil(sales / ((safeCrVisitToSale || 1) / 100));
      leads = Math.ceil(visits / ((safeCrLeadToVisit || 1) / 100));
      budget = leads * safeCpl;
      revenue = sales * safeAvgCheck;
    } else {
      budget = safeBudget;
      leads = safeCpl > 0 ? Math.floor(budget / safeCpl) : 0;
      visits = Math.floor(leads * ((safeCrLeadToVisit || 0) / 100));
      sales = Math.floor(visits * ((safeCrVisitToSale || 0) / 100));
      revenue = sales * safeAvgCheck;
    }
    
    const cpv = visits > 0 ? Math.round(budget / visits) : 0;
    const cac = sales > 0 ? Math.round(budget / sales) : 0;
    const romi = budget > 0 ? Math.round(((revenue - budget) / budget) * 100) : 0;

    return {
      name, budget, leads, cpl: safeCpl, visits, sales, avgCheck: safeAvgCheck,
      crLeadToVisit: safeCrLeadToVisit, cpv, crVisitToSale: safeCrVisitToSale, cac, revenue, romi
    };
  };

  const scenarios = [
    calculateRow('Лучший сценарий', data.cplBest),
    calculateRow('Средний сценарий', data.cplAvg),
    calculateRow('Худший сценарий', data.cplWorst),
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
           <div className="space-y-1.5">
            <Label htmlFor={getInputId('revenueGoal')} className="text-[10px] uppercase text-muted-foreground font-bold">Цель (Выручка)</Label>
            <Input 
              id={getInputId('revenueGoal')}
              type="number" 
              value={data.revenueGoal} 
              onChange={(e) => handleChange('revenueGoal', Number(e.target.value))} 
              className="bg-background font-mono text-sm h-9" 
              disabled={isSummary}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={getInputId('avgCheck')} className="text-[10px] uppercase text-muted-foreground font-bold">Ср. чек</Label>
            <Input 
              id={getInputId('avgCheck')}
              type="number" 
              value={data.avgCheck} 
              onChange={(e) => handleChange('avgCheck', Number(e.target.value))} 
              className="bg-background font-mono text-sm h-9" 
              disabled={isSummary}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={getInputId('crLeadToVisit')} className="text-[10px] uppercase text-muted-foreground font-bold">CR Лид &rarr; Визит (%)</Label>
            <Input 
              id={getInputId('crLeadToVisit')}
              type="number" 
              value={data.crLeadToVisit} 
              onChange={(e) => handleChange('crLeadToVisit', Number(e.target.value))} 
              className="bg-background font-mono text-sm h-9" 
              disabled={isSummary}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={getInputId('crVisitToSale')} className="text-[10px] uppercase text-muted-foreground font-bold">CR Визит &rarr; Продажа (%)</Label>
            <Input 
              id={getInputId('crVisitToSale')}
              type="number" 
              value={data.crVisitToSale} 
              onChange={(e) => handleChange('crVisitToSale', Number(e.target.value))} 
              className="bg-background font-mono text-sm h-9" 
              disabled={isSummary}
            />
          </div>
          <div className="space-y-1.5">
             <Label className="text-[10px] uppercase text-muted-foreground font-bold">Режим</Label>
             <div className="flex gap-1 h-9 bg-background rounded-md border p-1">
               <button 
                 onClick={() => !isSummary && handleChange('calcMode', 'goal')} 
                 className={cn("flex-1 text-xs rounded font-medium transition-colors", data.calcMode === 'goal' ? "bg-primary text-primary-foreground" : "hover:bg-muted", isSummary && "cursor-default opacity-50")}
               >
                 От цели
               </button>
               <button 
                 onClick={() => !isSummary && handleChange('calcMode', 'budget')} 
                 className={cn("flex-1 text-xs rounded font-medium transition-colors", data.calcMode === 'budget' ? "bg-primary text-primary-foreground" : "hover:bg-muted", isSummary && "cursor-default opacity-50")}
               >
                 От бюджета
               </button>
             </div>
          </div>
          {data.calcMode === 'budget' && (
            <div className="md:col-span-5 pt-2">
               <Label htmlFor={getInputId('budgetInput')} className="text-[10px] uppercase text-muted-foreground font-bold">Бюджет</Label>
               <Input 
                 id={getInputId('budgetInput')}
                 type="number" 
                 value={data.budgetInput} 
                 onChange={(e) => handleChange('budgetInput', Number(e.target.value))} 
                 className="bg-background font-mono text-sm h-9 max-w-[200px]" 
                 disabled={isSummary}
               />
            </div>
          )}
        </div>

        {/* Dashboards */}
        <div className="lg:col-span-2">
           {planIndicators && fact ? (
             <GoalDashboard plan={planIndicators} fact={fact} />
           ) : (
             <Card className="h-full flex items-center justify-center p-6 text-muted-foreground text-sm border-dashed">
               Дашборд доступен только в общем режиме
             </Card>
           )}
        </div>
        <div className="lg:col-span-1">
           <UnitEconomics avgCheck={Number(data.avgCheck) || 0} cac={scenarios[1].cac} />
        </div>
      </div>

      {/* Financial Model Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/30">
          <CardTitle className="text-base font-medium">Финансовая модель ({channelName})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50 border-b border-border h-9">
                  <TableHead className="w-[140px] font-bold text-foreground px-4 py-2 text-xs uppercase tracking-wider">Сценарий</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs uppercase tracking-wider">Бюджет</TableHead>
                  <TableHead className="text-center bg-blue-500/10 text-blue-600 font-semibold border-x border-blue-100/20 px-2 py-2 text-xs uppercase tracking-wider">Лиды</TableHead>
                  <TableHead className="text-center w-[80px] px-2 py-2 text-xs uppercase tracking-wider">CPL</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs uppercase tracking-wider">Визиты</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs uppercase tracking-wider">Продажи</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs uppercase tracking-wider">Ср. чек</TableHead>
                  <TableHead className="text-center px-2 py-2 text-[10px] uppercase tracking-wider leading-tight">CR Л&rarr;В</TableHead>
                  <TableHead className="text-center px-2 py-2 text-[10px] uppercase tracking-wider leading-tight">CPV</TableHead>
                  <TableHead className="text-center px-2 py-2 text-[10px] uppercase tracking-wider leading-tight">CR В&rarr;П</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs uppercase tracking-wider">CAC</TableHead>
                  <TableHead className="text-center font-bold px-2 py-2 text-xs uppercase tracking-wider">Выручка</TableHead>
                  <TableHead className="text-center font-bold px-2 py-2 text-xs uppercase tracking-wider">ROMI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((row, index) => (
                  <TableRow key={row.name} className={cn(
                    "hover:bg-muted/30 transition-colors h-10",
                    index === 0 ? "bg-emerald-500/5" : 
                    index === 1 ? "bg-yellow-500/5" : "bg-red-500/5"
                  )}>
                    <TableCell className="font-medium whitespace-nowrap text-sm px-4 py-2">{row.name}</TableCell>
                    <TableCell className="text-center font-mono text-sm px-2 py-2">{formatCurrency(row.budget)}</TableCell>
                    <TableCell className="text-center font-bold bg-blue-500/5 border-x border-blue-100/20 px-2 py-2 text-sm">{row.leads}</TableCell>
                    <TableCell className="text-center p-1">
                      <Input 
                        type="number"
                        className="h-7 w-16 mx-auto text-center font-mono text-sm px-1 bg-background/50"
                        value={index === 0 ? data.cplBest : index === 1 ? data.cplAvg : data.cplWorst}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (index === 0) handleChange('cplBest', val);
                          else if (index === 1) handleChange('cplAvg', val);
                          else handleChange('cplWorst', val);
                        }}
                        disabled={isSummary}
                      />
                    </TableCell>
                    <TableCell className="text-center px-2 py-2 text-sm">{row.visits}</TableCell>
                    <TableCell className="text-center font-bold px-2 py-2 text-sm">{row.sales}</TableCell>
                    <TableCell className="text-center font-mono text-sm px-2 py-2">{formatCurrency(row.avgCheck)}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground px-2 py-2">{row.crLeadToVisit}%</TableCell>
                    <TableCell className="text-center font-mono text-sm px-2 py-2">{formatCurrency(row.cpv)}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground px-2 py-2">{row.crVisitToSale}%</TableCell>
                    <TableCell className="text-center font-mono text-sm px-2 py-2">{formatCurrency(row.cac)}</TableCell>
                    <TableCell className="text-center font-bold text-foreground px-2 py-2 text-sm">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className={cn("text-center font-bold px-2 py-2 text-sm", 
                      row.romi > 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {row.romi}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SMART Goals */}
      <div className="grid grid-cols-1">
         <SmartGoals channel={channelName === 'Сводная' ? 'summary' : channelName.toLowerCase()} />
      </div>
    </div>
  );
};
