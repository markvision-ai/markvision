import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinancialMonthData } from '@/hooks/useFinancialMonthData';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UnitEconomics } from './UnitEconomics';
import { SmartGoals } from './SmartGoals';
import { GoalDashboard } from './GoalDashboard';

interface FinancialDecompositionProps {
  projectId: string;
}

export const FinancialDecomposition = ({ projectId }: FinancialDecompositionProps) => {
  // Date Selection
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Global Inputs
  const [revenueGoal, setRevenueGoal] = useState<number | ''>(10000000);
  const [avgCheck, setAvgCheck] = useState<number | ''>(500000);
  const [crLeadToVisit, setCrLeadToVisit] = useState<number | ''>(10);
  const [crVisitToSale, setCrVisitToSale] = useState<number | ''>(30);

  // Scenario Specific Inputs (CPL)
  const [cplBest, setCplBest] = useState<number | ''>(1500);
  const [cplAvg, setCplAvg] = useState<number | ''>(2500);
  const [cplWorst, setCplWorst] = useState<number | ''>(3500);
  const [calcMode, setCalcMode] = useState<'goal' | 'budget'>('goal');
  const [budgetInput, setBudgetInput] = useState<number | ''>(2000000);

  // Fetch Data
  const { loading: dataLoading, plan, planIndicators, fact, savePlan } = useFinancialMonthData(projectId, selectedMonth);

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
    const safeRevenueGoal = Number(revenueGoal) || 0;
    const safeAvgCheck = Number(avgCheck) || 0;
    const safeCrLeadToVisit = Number(crLeadToVisit) || 0;
    const safeCrVisitToSale = Number(crVisitToSale) || 0;
    const safeCpl = Number(cpl) || 0;
    const safeBudget = Number(budgetInput) || 0;

    let sales = 0, visits = 0, leads = 0, budget = 0, revenue = 0;
    if (calcMode === 'goal') {
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

  const handleSaveAndAnalyze = async () => {
    setLoading(true);
    try {
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

      const prompt = `Проанализируй финансовую декомпозицию за ${format(selectedMonth, 'LLLL yyyy', { locale: ru })}...`; // Simplified log

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
    <div className="space-y-6 w-full overflow-x-hidden pb-8 relative">
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
        <div className="flex items-center gap-2">
           {dataLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
           <Button onClick={handleSaveAndAnalyze} disabled={loading} size="sm" className="h-8 text-sm gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Сохранить
            </Button>
        </div>
      </div>

      {/* Top Section: Goal Dashboard & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
           <div className="space-y-1.5">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Цель (Выручка)</Label>
            <Input type="number" value={revenueGoal} onChange={(e) => setRevenueGoal(Number(e.target.value))} className="bg-background font-mono text-sm h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">Ср. чек</Label>
            <Input type="number" value={avgCheck} onChange={(e) => setAvgCheck(Number(e.target.value))} className="bg-background font-mono text-sm h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">CR Лид &rarr; Визит (%)</Label>
            <Input type="number" value={crLeadToVisit} onChange={(e) => setCrLeadToVisit(Number(e.target.value))} className="bg-background font-mono text-sm h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase text-muted-foreground font-bold">CR Визит &rarr; Продажа (%)</Label>
            <Input type="number" value={crVisitToSale} onChange={(e) => setCrVisitToSale(Number(e.target.value))} className="bg-background font-mono text-sm h-9" />
          </div>
          <div className="space-y-1.5">
             <Label className="text-[10px] uppercase text-muted-foreground font-bold">Режим</Label>
             <div className="flex gap-1 h-9 bg-background rounded-md border p-1">
               <button onClick={() => setCalcMode('goal')} className={cn("flex-1 text-xs rounded font-medium transition-colors", calcMode === 'goal' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>От цели</button>
               <button onClick={() => setCalcMode('budget')} className={cn("flex-1 text-xs rounded font-medium transition-colors", calcMode === 'budget' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>От бюджета</button>
             </div>
          </div>
          {calcMode === 'budget' && (
            <div className="md:col-span-5 pt-2">
               <Label className="text-[10px] uppercase text-muted-foreground font-bold">Бюджет</Label>
               <Input type="number" value={budgetInput} onChange={(e) => setBudgetInput(Number(e.target.value))} className="bg-background font-mono text-sm h-9 max-w-[200px]" />
            </div>
          )}
        </div>

        {/* Dashboards */}
        <div className="lg:col-span-2">
           <GoalDashboard plan={planIndicators} fact={fact} />
        </div>
        <div className="lg:col-span-1">
           <UnitEconomics avgCheck={Number(avgCheck) || 0} cac={scenarios[1].cac} />
        </div>
      </div>

      {/* Middle Section: Financial Model Table (Preserved) */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 bg-muted/30">
          <CardTitle className="text-base font-medium">Финансовая модель</CardTitle>
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
                        value={index === 0 ? cplBest : index === 1 ? cplAvg : cplWorst}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (index === 0) setCplBest(val);
                          else if (index === 1) setCplAvg(val);
                          else setCplWorst(val);
                        }}
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

      {/* Bottom Section: SMART Goals */}
      <div className="grid grid-cols-1">
         <SmartGoals />
      </div>
    </div>
  );
};
