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
  const [budget, setBudget] = useState<number>(100000);
  const [avgCheck, setAvgCheck] = useState<number>(500000);
  const [crLeadToDiag, setCrLeadToDiag] = useState<number>(10);
  const [crDiagToSale, setCrDiagToSale] = useState<number>(30);

  // Scenario Specific Inputs (CPL)
  const [cplBest, setCplBest] = useState<number>(1500);
  const [cplAvg, setCplAvg] = useState<number>(2500);
  const [cplWorst, setCplWorst] = useState<number>(3500);

  const [loading, setLoading] = useState(false);

  // Helper to calculate row data
  const calculateRow = (name: string, cpl: number) => {
    // 1. Leads = Budget / CPL
    const leads = Math.floor(budget / (cpl || 1));
    
    // 2. Diagnostics = Leads * CR1
    const diagnostics = Math.floor(leads * (crLeadToDiag / 100));
    
    // 3. Sales = Diagnostics * CR2
    const sales = Math.floor(diagnostics * (crDiagToSale / 100));
    
    // 4. Revenue = Sales * Avg Check
    const revenue = sales * avgCheck;
    
    // 5. Cost per Diagnostic = Budget / Diagnostics
    const costPerDiag = diagnostics > 0 ? Math.round(budget / diagnostics) : 0;
    
    // 6. Cost per Patient (CAC) = Budget / Sales
    const cac = sales > 0 ? Math.round(budget / sales) : 0;
    
    // 7. ROMI = (Revenue - Budget) / Budget * 100
    const romi = budget > 0 ? Math.round(((revenue - budget) / budget) * 100) : 0;

    return {
      name,
      budget,
      leads,
      cpl,
      diagnostics,
      sales,
      avgCheck,
      crLeadToDiag,
      costPerDiag,
      crDiagToSale,
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
          revenue_goal: avg.revenue, // Using calculated revenue as goal based on budget
          avg_check: avgCheck,
          budget_needed: budget,
          sales_plan: avg.sales,
          visits_plan: avg.diagnostics, // Using diagnostics as visits
          leads_plan: avg.leads,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' });

      if (kpiError) throw kpiError;

      // Send to AI
      const prompt = `Проанализируй финансовую декомпозицию (Лидген Инста План).
Бюджет: ${formatCurrency(budget)}
Средний чек: ${formatCurrency(avgCheck)}
CR Лид->Диагностика: ${crLeadToDiag}%
CR Диагностика->Продажа: ${crDiagToSale}%

Сценарии:
1. Лучший (CPL ${cplBest}): ${scenarios[0].leads} лидов -> ${scenarios[0].sales} продаж. Выручка: ${formatCurrency(scenarios[0].revenue)}. ROMI: ${scenarios[0].romi}%
2. Средний (CPL ${cplAvg}): ${scenarios[1].leads} лидов -> ${scenarios[1].sales} продаж. Выручка: ${formatCurrency(scenarios[1].revenue)}. ROMI: ${scenarios[1].romi}%
3. Худший (CPL ${cplWorst}): ${scenarios[2].leads} лидов -> ${scenarios[2].sales} продаж. Выручка: ${formatCurrency(scenarios[2].revenue)}. ROMI: ${scenarios[2].romi}%

Дай рекомендации по снижению CPL и повышению конверсий.`;

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
          <Label>Бюджет (₸)</Label>
          <Input 
            type="number" 
            value={budget} 
            onChange={(e) => setBudget(Number(e.target.value))} 
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label>Средний чек (₸)</Label>
          <Input 
            type="number" 
            value={avgCheck} 
            onChange={(e) => setAvgCheck(Number(e.target.value))} 
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label>CR в Диагностику (%)</Label>
          <Input 
            type="number" 
            value={crLeadToDiag} 
            onChange={(e) => setCrLeadToDiag(Number(e.target.value))} 
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label>CR в Продажу (%)</Label>
          <Input 
            type="number" 
            value={crDiagToSale} 
            onChange={(e) => setCrDiagToSale(Number(e.target.value))} 
            className="bg-background"
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg font-medium">Лидген инста План</CardTitle>
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
                  <TableHead className="w-[180px] font-bold text-foreground">Варианты событий</TableHead>
                  <TableHead className="text-center">Бюджет</TableHead>
                  <TableHead className="text-center bg-blue-500/10 text-blue-600 font-semibold border-x border-blue-100/20">Кол-во лидов<br/>(заявок)</TableHead>
                  <TableHead className="text-center w-[120px]">Стоимость<br/>лида (CPL)</TableHead>
                  <TableHead className="text-center">Кол-во<br/>диагностик</TableHead>
                  <TableHead className="text-center">Кол-во<br/>продаж</TableHead>
                  <TableHead className="text-center">Средний<br/>чек</TableHead>
                  <TableHead className="text-center">CR из лида<br/>в Диагностику</TableHead>
                  <TableHead className="text-center">Стоимость<br/>Диагностики</TableHead>
                  <TableHead className="text-center">CR из диаг.<br/>в продажу</TableHead>
                  <TableHead className="text-center">Стоимость<br/>пациента</TableHead>
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
                    <TableCell className="font-medium whitespace-nowrap">{row.name}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatCurrency(row.budget)}</TableCell>
                    
                    {/* Calculated Leads */}
                    <TableCell className="text-center font-bold bg-blue-500/5 border-x border-blue-100/20">{row.leads}</TableCell>
                    
                    {/* Editable CPL */}
                    <TableCell className="text-center p-2">
                      <Input 
                        type="number"
                        className="h-8 w-24 mx-auto text-center font-mono text-xs"
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
                    
                    <TableCell className="text-center">{row.diagnostics}</TableCell>
                    <TableCell className="text-center font-bold">{row.sales}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatCurrency(row.avgCheck)}</TableCell>
                    <TableCell className="text-center">{row.crLeadToDiag}%</TableCell>
                    <TableCell className="text-center font-mono text-xs">{formatCurrency(row.costPerDiag)}</TableCell>
                    <TableCell className="text-center">{row.crDiagToSale}%</TableCell>
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
