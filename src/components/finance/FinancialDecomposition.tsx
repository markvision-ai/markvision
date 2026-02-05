import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialDecompositionProps {
  projectId: string;
}

export const FinancialDecomposition = ({ projectId }: FinancialDecompositionProps) => {
  // Global Inputs
  const [revenueGoal, setRevenueGoal] = useState<number>(10000000); // Цель по выручке
  const [avgCheck, setAvgCheck] = useState<number>(500000);
  const [crLeadToVisit, setCrLeadToVisit] = useState<number>(10);
  const [crVisitToSale, setCrVisitToSale] = useState<number>(30);

  // Scenario Specific Inputs (CPL)
  const [cplBest, setCplBest] = useState<number>(1500);
  const [cplAvg, setCplAvg] = useState<number>(2500);
  const [cplWorst, setCplWorst] = useState<number>(3500);

  const [loading, setLoading] = useState(false);

  // Helper to calculate row data
  const calculateRow = (name: string, cpl: number) => {
    // 1. Sales Needed = Revenue Goal / Avg Check
    const sales = Math.ceil(revenueGoal / (avgCheck || 1));
    
    // 2. Visits Needed = Sales Needed / (CR Visit->Sale / 100)
    const visits = Math.ceil(sales / ((crVisitToSale || 1) / 100));
    
    // 3. Leads Needed = Visits Needed / (CR Lead->Visit / 100)
    const leads = Math.ceil(visits / ((crLeadToVisit || 1) / 100));
    
    // 4. Budget Required = Leads Needed * CPL
    const budget = leads * cpl;
    
    // 5. Revenue (Forecast) = Sales * Avg Check (Should match goal approx)
    const revenue = sales * avgCheck;
    
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
      cpl,
      visits,
      sales,
      avgCheck,
      crLeadToVisit,
      cpv,
      crVisitToSale,
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

  const handleSaveAndAnalyze = async () => {
    setLoading(true);
    try {
      // Save Average Scenario as KPI
      const avg = scenarios[1];
      const { error: kpiError } = await supabase
        .from('project_kpi')
        .upsert({
          project_id: projectId,
          revenue_goal: revenueGoal,
          avg_check: avgCheck,
          budget_needed: avg.budget,
          sales_plan: avg.sales,
          visits_plan: avg.visits,
          leads_plan: avg.leads,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' });

      if (kpiError) throw kpiError;

      // Send to AI
      const prompt = `Проанализируй финансовую декомпозицию.
Цель по выручке: ${formatCurrency(revenueGoal)}
Средний чек: ${formatCurrency(avgCheck)}
Требуемый бюджет (Средний сценарий): ${formatCurrency(avg.budget)}
CR Лид->Визит: ${crLeadToVisit}%
CR Визит->Продажа: ${crVisitToSale}%

Сценарии:
1. Лучший (CPL ${cplBest}): Бюджет ${formatCurrency(scenarios[0].budget)} -> ${scenarios[0].leads} лидов -> ${scenarios[0].sales} продаж. ROMI: ${scenarios[0].romi}%
2. Средний (CPL ${cplAvg}): Бюджет ${formatCurrency(scenarios[1].budget)} -> ${scenarios[1].leads} лидов -> ${scenarios[1].sales} продаж. ROMI: ${scenarios[1].romi}%
3. Худший (CPL ${cplWorst}): Бюджет ${formatCurrency(scenarios[2].budget)} -> ${scenarios[2].leads} лидов -> ${scenarios[2].sales} продаж. ROMI: ${scenarios[2].romi}%

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
    <div className="space-y-6 w-full overflow-x-auto pb-4">
      {/* Global Settings Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-bold">Цель (Выручка)</Label>
          <Input 
            type="number" 
            value={revenueGoal} 
            onChange={(e) => setRevenueGoal(Number(e.target.value))} 
            className="bg-background font-mono text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-bold">Ср. чек</Label>
          <Input 
            type="number" 
            value={avgCheck} 
            onChange={(e) => setAvgCheck(Number(e.target.value))} 
            className="bg-background font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-bold">CR Лид -> Визит (%)</Label>
          <Input 
            type="number" 
            value={crLeadToVisit} 
            onChange={(e) => setCrLeadToVisit(Number(e.target.value))} 
            className="bg-background font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground font-bold">CR Визит -> Продажа (%)</Label>
          <Input 
            type="number" 
            value={crVisitToSale} 
            onChange={(e) => setCrVisitToSale(Number(e.target.value))} 
            className="bg-background font-mono"
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg font-medium">Финансовая модель</CardTitle>
          <Button onClick={handleSaveAndAnalyze} disabled={loading} size="sm">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Сохранить план
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50 border-b border-border">
                  <TableHead className="w-[180px] font-bold text-foreground">Сценарий</TableHead>
                  <TableHead className="text-center">Бюджет</TableHead>
                  <TableHead className="text-center bg-blue-500/10 text-blue-600 font-semibold border-x border-blue-100/20">Лиды</TableHead>
                  <TableHead className="text-center w-[100px]">CPL</TableHead>
                  <TableHead className="text-center">Визиты</TableHead>
                  <TableHead className="text-center">Продажи</TableHead>
                  <TableHead className="text-center">Ср. чек</TableHead>
                  <TableHead className="text-center text-xs">CR Лид<br/>→Визит</TableHead>
                  <TableHead className="text-center text-xs">Цена<br/>Визита</TableHead>
                  <TableHead className="text-center text-xs">CR Визит<br/>→Продажа</TableHead>
                  <TableHead className="text-center">CAC</TableHead>
                  <TableHead className="text-center font-bold">Выручка</TableHead>
                  <TableHead className="text-center font-bold">ROMI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((row, index) => (
                  <TableRow key={row.name} className={cn(
                    "hover:bg-muted/30 transition-colors",
                    index === 0 ? "bg-emerald-500/5" : 
                    index === 1 ? "bg-yellow-500/5" : "bg-red-500/5"
                  )}>
                    <TableCell className="font-medium whitespace-nowrap text-xs">{row.name}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatCurrency(row.budget)}</TableCell>
                    
                    {/* Calculated Leads */}
                    <TableCell className="text-center font-bold bg-blue-500/5 border-x border-blue-100/20">{row.leads}</TableCell>
                    
                    {/* Editable CPL */}
                    <TableCell className="text-center p-2">
                      <Input 
                        type="number"
                        className="h-7 w-20 mx-auto text-center font-mono text-xs px-1"
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
                    
                    <TableCell className="text-center">{row.visits}</TableCell>
                    <TableCell className="text-center font-bold">{row.sales}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatCurrency(row.avgCheck)}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{row.crLeadToVisit}%</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatCurrency(row.cpv)}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">{row.crVisitToSale}%</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatCurrency(row.cac)}</TableCell>
                    <TableCell className="text-center font-bold text-foreground">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className={cn("text-center font-bold", 
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
    </div>
  );
};
