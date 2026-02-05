import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, Save, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinancialMonthData } from '@/hooks/useFinancialMonthData';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FinancialDecompositionProps {
  projectId: string;
}

export const FinancialDecomposition = ({ projectId }: FinancialDecompositionProps) => {
  // Date Selection
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Global Inputs
  const [revenueGoal, setRevenueGoal] = useState<number | ''>(10000000); // Цель по выручке
  const [avgCheck, setAvgCheck] = useState<number | ''>(500000);
  const [crLeadToVisit, setCrLeadToVisit] = useState<number | ''>(10);
  const [crVisitToSale, setCrVisitToSale] = useState<number | ''>(30);

  // Scenario Specific Inputs (CPL)
  const [cplBest, setCplBest] = useState<number | ''>(1500);
  const [cplAvg, setCplAvg] = useState<number | ''>(2500);
  const [cplWorst, setCplWorst] = useState<number | ''>(3500);

  // Fetch Data
  const { loading: dataLoading, plan, fact, savePlan } = useFinancialMonthData(projectId, selectedMonth);

  // Sync state with fetched plan
  useEffect(() => {
    if (plan) {
      setRevenueGoal(plan.revenue_goal);
      setAvgCheck(plan.avg_check);
      setCrLeadToVisit(plan.cr_lead_visit);
      setCrVisitToSale(plan.cr_visit_sale);
      setCplBest(plan.cpl_best);
      setCplAvg(plan.cpl_avg);
      setCplWorst(plan.cpl_worst);
    }
  }, [plan]);

  const [loading, setLoading] = useState(false);

  // Helper to calculate row data
  const calculateRow = (name: string, cpl: number | '') => {
    // Safely parse inputs to numbers, defaulting to 0 for calculations if empty
    const safeRevenueGoal = Number(revenueGoal) || 0;
    const safeAvgCheck = Number(avgCheck) || 0;
    const safeCrLeadToVisit = Number(crLeadToVisit) || 0;
    const safeCrVisitToSale = Number(crVisitToSale) || 0;
    const safeCpl = Number(cpl) || 0;

    // 1. Sales Needed = Revenue Goal / Avg Check
    const sales = Math.ceil(safeRevenueGoal / (safeAvgCheck || 1));
    
    // 2. Visits Needed = Sales Needed / (CR Visit->Sale / 100)
    const visits = Math.ceil(sales / ((safeCrVisitToSale || 1) / 100));
    
    // 3. Leads Needed = Visits Needed / (CR Lead->Visit / 100)
    const leads = Math.ceil(visits / ((safeCrLeadToVisit || 1) / 100));
    
    // 4. Budget Required = Leads Needed * CPL
    const budget = leads * safeCpl;
    
    // 5. Revenue (Forecast) = Sales * Avg Check (Should match goal approx)
    const revenue = sales * safeAvgCheck;
    
    // 6. CPV (Cost Per Visit) = Budget / Visits
    const cpv = visits > 0 ? Math.round(budget / visits) : 0;
    
    // 7. CAC (Cost Per Customer) = Budget / Sales
    const cac = sales > 0 ? Math.round(budget / sales) : 0;
    
    // 8. ROMI = (Revenue - Budget) / Budget * 100
    const romi = budget > 0 ? Math.round(((revenue - budget) / budget) * 100) : 0;

    return {
      name,
      budget,
      leads,
      cpl: safeCpl,
      visits,
      sales,
      avgCheck: safeAvgCheck,
      crLeadToVisit: safeCrLeadToVisit,
      cpv,
      crVisitToSale: safeCrVisitToSale,
      cac,
      revenue,
      romi
    };
  };

  const scenarios = [
    calculateRow('Лучший сценарий', cplBest),
    calculateRow('Средний сценарий', cplAvg),
    calculateRow('Худший сценарий', cplWorst),
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  const calcPercent = (fact: number, plan: number) => {
    if (!plan) return 0;
    return Math.round((fact / plan) * 100);
  };

  const getPercentColor = (percent: number) => {
    if (percent >= 100) return 'text-green-600 font-bold';
    if (percent >= 80) return 'text-emerald-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-red-500';
  };

  const handleSaveAndAnalyze = async () => {
    setLoading(true);
    try {
      // Save Plan for selected month
      const avg = scenarios[1];
      const newPlan = {
        revenue_goal: Number(revenueGoal) || 0,
        avg_check: Number(avgCheck) || 0,
        cr_lead_visit: Number(crLeadToVisit) || 0,
        cr_visit_sale: Number(crVisitToSale) || 0,
        cpl_best: Number(cplBest) || 0,
        cpl_avg: Number(cplAvg) || 0,
        cpl_worst: Number(cplWorst) || 0,
      };

      const success = await savePlan(newPlan);
      if (!success) throw new Error('Failed to save plan');

      // Also update global project_kpi for backward compatibility if it's current month
      /* 
      if (format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM')) {
        const { error: kpiError } = await supabase
          .from('project_kpi')
          .upsert({
            project_id: projectId,
            revenue_goal: newPlan.revenue_goal,
            avg_check: newPlan.avg_check,
            budget_needed: avg.budget,
            sales_plan: avg.sales,
            visits_plan: avg.visits,
            leads_plan: avg.leads,
            updated_at: new Date().toISOString()
          } as any, { onConflict: 'project_id' });
        if (kpiError) console.error('Error updating global KPI:', kpiError);
      }
      */

      // Send to AI
      const prompt = `Проанализируй финансовую декомпозицию за ${format(selectedMonth, 'LLLL yyyy', { locale: ru })}.
Цель по выручке: ${formatCurrency(Number(revenueGoal) || 0)}
Средний чек: ${formatCurrency(Number(avgCheck) || 0)}
Требуемый бюджет (Средний сценарий): ${formatCurrency(avg.budget)}
CR Лид->Визит: ${crLeadToVisit}%
CR Визит->Продажа: ${crVisitToSale}%

Сценарии:
1. Лучший (CPL ${cplBest}): Бюджет ${formatCurrency(scenarios[0].budget)} -> ${scenarios[0].leads} лидов -> ${scenarios[0].sales} продаж. ROMI: ${scenarios[0].romi}%
2. Средний (CPL ${cplAvg}): Бюджет ${formatCurrency(scenarios[1].budget)} -> ${scenarios[1].leads} лидов -> ${scenarios[1].sales} продаж. ROMI: ${scenarios[1].romi}%
3. Худший (CPL ${cplWorst}): Бюджет ${formatCurrency(scenarios[2].budget)} -> ${scenarios[2].leads} лидов -> ${scenarios[2].sales} продаж. ROMI: ${scenarios[2].romi}%

ФАКТ (на текущий момент):
Расходы: ${formatCurrency(fact.expenses)}
Лиды: ${fact.leads}
Визиты: ${fact.visits}
Продажи: ${fact.sales}
Выручка: ${formatCurrency(fact.revenue)}

Дай рекомендации по оптимизации бюджета и повышению конверсий.`;

      const { error: aiError } = await supabase
        .from('ai_bridge_tasks')
        .insert({
          project_id: projectId,
          prompt: prompt,
          status: 'pending'
        });

      if (aiError) throw aiError;

      toast.success('План сохранен и отправлен на анализ');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full overflow-x-auto pb-2">
      {/* Month Selection */}
      <div className="flex items-center justify-between bg-card p-2 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
             <ChevronLeft className="h-4 w-4" />
           </Button>
           <div className="text-lg font-semibold capitalize min-w-[140px] text-center">
             {format(selectedMonth, 'LLLL yyyy', { locale: ru })}
           </div>
           <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
             <ChevronRight className="h-4 w-4" />
           </Button>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
           {dataLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
           <span className="hidden md:inline">Данные за выбранный месяц</span>
        </div>
      </div>

      {/* Global Settings Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Цель (Выручка)</Label>
          <Input 
            type="number" 
            value={revenueGoal} 
            onChange={(e) => setRevenueGoal(Number(e.target.value))} 
            className="bg-background font-mono text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground font-bold">Ср. чек</Label>
          <Input 
            type="number" 
            value={avgCheck} 
            onChange={(e) => setAvgCheck(Number(e.target.value))} 
            className="bg-background font-mono text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground font-bold">CR Лид &rarr; Визит (%)</Label>
          <Input 
            type="number" 
            value={crLeadToVisit} 
            onChange={(e) => setCrLeadToVisit(Number(e.target.value))} 
            className="bg-background font-mono text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase text-muted-foreground font-bold">CR Визит &rarr; Продажа (%)</Label>
          <Input 
            type="number" 
            value={crVisitToSale} 
            onChange={(e) => setCrVisitToSale(Number(e.target.value))} 
            className="bg-background font-mono text-sm h-8"
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-base font-medium">Финансовая модель</CardTitle>
          <Button onClick={handleSaveAndAnalyze} disabled={loading} size="sm" className="h-7 text-xs">
            {loading ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Save className="w-3 h-3 mr-2" />}
            Сохранить план
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50 border-b border-border h-8">
                  <TableHead className="w-[140px] font-bold text-foreground px-2 py-1 text-xs">Сценарий</TableHead>
                  <TableHead className="text-center px-2 py-1 text-xs">Бюджет</TableHead>
                  <TableHead className="text-center bg-blue-500/10 text-blue-600 font-semibold border-x border-blue-100/20 px-2 py-1 text-xs">Лиды</TableHead>
                  <TableHead className="text-center w-[80px] px-2 py-1 text-xs">CPL</TableHead>
                  <TableHead className="text-center px-2 py-1 text-xs">Визиты</TableHead>
                  <TableHead className="text-center px-2 py-1 text-xs">Продажи</TableHead>
                  <TableHead className="text-center px-2 py-1 text-xs">Ср. чек</TableHead>
                  <TableHead className="text-center text-[10px] px-2 py-1 leading-tight">CR Лид<br/>→Визит</TableHead>
                  <TableHead className="text-center text-[10px] px-2 py-1 leading-tight">Цена<br/>Визита</TableHead>
                  <TableHead className="text-center text-[10px] px-2 py-1 leading-tight">CR Визит<br/>→Продажа</TableHead>
                  <TableHead className="text-center px-2 py-1 text-xs">CAC</TableHead>
                  <TableHead className="text-center font-bold px-2 py-1 text-xs">Выручка</TableHead>
                  <TableHead className="text-center font-bold px-2 py-1 text-xs">ROMI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((row, index) => (
                  <TableRow key={row.name} className={cn(
                    "hover:bg-muted/30 transition-colors h-10",
                    index === 0 ? "bg-emerald-500/5" : 
                    index === 1 ? "bg-yellow-500/5" : "bg-red-500/5"
                  )}>
                    <TableCell className="font-medium whitespace-nowrap text-xs px-2 py-1">{row.name}</TableCell>
                    <TableCell className="text-center font-mono text-xs px-2 py-1">{formatCurrency(row.budget)}</TableCell>
                    
                    {/* Calculated Leads */}
                    <TableCell className="text-center font-bold bg-blue-500/5 border-x border-blue-100/20 px-2 py-1 text-xs">{row.leads}</TableCell>
                    
                    {/* Editable CPL */}
                    <TableCell className="text-center p-1">
                      <Input 
                        type="number"
                        className="h-6 w-16 mx-auto text-center font-mono text-xs px-1"
                        value={
                          index === 0 ? cplBest : 
                          index === 1 ? cplAvg : cplWorst
                        }
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (index === 0) setCplBest(val);
                          else if (index === 1) setCplAvg(val);
                          else setCplWorst(val);
                        }}
                      />
                    </TableCell>
                    
                    <TableCell className="text-center px-2 py-1 text-xs">{row.visits}</TableCell>
                    <TableCell className="text-center font-bold px-2 py-1 text-xs">{row.sales}</TableCell>
                    <TableCell className="text-center font-mono text-xs px-2 py-1">{formatCurrency(row.avgCheck)}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground px-2 py-1">{row.crLeadToVisit}%</TableCell>
                    <TableCell className="text-center font-mono text-xs px-2 py-1">{formatCurrency(row.cpv)}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground px-2 py-1">{row.crVisitToSale}%</TableCell>
                    <TableCell className="text-center font-mono text-xs px-2 py-1">{formatCurrency(row.cac)}</TableCell>
                    <TableCell className="text-center font-bold text-foreground px-2 py-1 text-xs">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className={cn("text-center font-bold px-2 py-1 text-xs", 
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

      {/* Plan vs Fact Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden mt-6">
        <CardHeader className="py-3 px-4 bg-muted/30">
          <CardTitle className="text-base font-medium">План / Факт за {format(selectedMonth, 'LLLL yyyy', { locale: ru })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Показатель</TableHead>
                <TableHead>Расходы</TableHead>
                <TableHead>Показы</TableHead>
                <TableHead>Клики</TableHead>
                <TableHead>Лиды</TableHead>
                <TableHead>Подписчики</TableHead>
                <TableHead>Визиты</TableHead>
                <TableHead>Продажи</TableHead>
                <TableHead>Выручка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* FACT Row */}
              <TableRow>
                <TableCell className="font-bold">ФАКТ</TableCell>
                <TableCell>{formatCurrency(fact.expenses)}</TableCell>
                <TableCell>{fact.impressions}</TableCell>
                <TableCell>{fact.clicks}</TableCell>
                <TableCell>{fact.leads}</TableCell>
                <TableCell>{fact.subscribers}</TableCell>
                <TableCell>{fact.visits}</TableCell>
                <TableCell>{fact.sales}</TableCell>
                <TableCell>{formatCurrency(fact.revenue)}</TableCell>
              </TableRow>
              {/* % Compl Row */}
              <TableRow>
                <TableCell className="font-medium text-muted-foreground">% выполн.</TableCell>
                <TableCell className={getPercentColor(calcPercent(fact.expenses, scenarios[1].budget))}>{calcPercent(fact.expenses, scenarios[1].budget)}%</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell className={getPercentColor(calcPercent(fact.leads, scenarios[1].leads))}>{calcPercent(fact.leads, scenarios[1].leads)}%</TableCell>
                <TableCell>-</TableCell>
                <TableCell className={getPercentColor(calcPercent(fact.visits, scenarios[1].visits))}>{calcPercent(fact.visits, scenarios[1].visits)}%</TableCell>
                <TableCell className={getPercentColor(calcPercent(fact.sales, scenarios[1].sales))}>{calcPercent(fact.sales, scenarios[1].sales)}%</TableCell>
                <TableCell className={getPercentColor(calcPercent(fact.revenue, scenarios[1].revenue))}>{calcPercent(fact.revenue, scenarios[1].revenue)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
