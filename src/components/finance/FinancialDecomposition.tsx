import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowRight, 
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialDecompositionProps {
  projectId: string;
}

interface ScenarioMetrics {
  name: string;
  cr1: number; // Клик в Лид (не используется в прямом расчете от бюджета, но полезно для справки)
  cr2: number; // Лид в Визит
  cr3: number; // Визит в Продажу
  color: string;
  bg: string;
}

interface CalculatedScenario {
  name: string;
  sales: number;
  visits: number;
  leads: number;
  cac: number;
  visitCost: number;
  cpl: number;
  romi: number;
  revenue: number;
  budget: number;
  metrics: ScenarioMetrics;
}

export const FinancialDecomposition = ({ projectId }: FinancialDecompositionProps) => {
  // Входные данные
  const [revenueGoal, setRevenueGoal] = useState<number>(10000000);
  const [avgCheck, setAvgCheck] = useState<number>(500000);
  const [adBudget, setAdBudget] = useState<number>(1000000);
  const [fixedCosts, setFixedCosts] = useState<number>(0);
  
  // Состояние
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('medicine'); // medicine, info, goods
  
  // Сценарии
  const [scenarios, setScenarios] = useState<CalculatedScenario[]>([]);

  // Пресеты конверсий
  const presets = {
    medicine: {
      best: { cr1: 3, cr2: 20, cr3: 40 },
      avg: { cr1: 1.5, cr2: 10, cr3: 25 },
      worst: { cr1: 0.8, cr2: 5, cr3: 15 }
    },
    info: {
      best: { cr1: 25, cr2: 30, cr3: 15 },
      avg: { cr1: 15, cr2: 15, cr3: 8 },
      worst: { cr1: 5, cr2: 5, cr3: 2 }
    },
    goods: {
      best: { cr1: 5, cr2: 100, cr3: 5 }, // cr2 100% т.к. обычно сразу заказ
      avg: { cr1: 2, cr2: 100, cr3: 2 },
      worst: { cr1: 0.5, cr2: 100, cr3: 0.5 }
    }
  };

  useEffect(() => {
    calculateScenarios();
  }, [revenueGoal, avgCheck, adBudget, activeTab]);

  const calculateScenarios = () => {
    const currentPreset = presets[activeTab as keyof typeof presets];
    
    const scenarioConfig: ScenarioMetrics[] = [
      { 
        name: 'Лучший', 
        ...currentPreset.best,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
      },
      { 
        name: 'Средний', 
        ...currentPreset.avg,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10'
      },
      { 
        name: 'Худший', 
        ...currentPreset.worst,
        color: 'text-red-500',
        bg: 'bg-red-500/10'
      }
    ];

    const calculated = scenarioConfig.map(metric => {
      // Формулы из ТЗ:
      // Кол-во продаж = Цель по выручке / Средний чек
      // Кол-во визитов = Кол-во продаж / CR3
      // Кол-во лидов = Кол-во визитов / CR2
      // Но у нас фиксированный бюджет для расчета стоимости, 
      // ИЛИ мы хотим понять что получим на этот бюджет?
      // ТЗ: "Кол-во продаж = Цель по выручке / Средний чек" - это целевой расчет.
      // Но тогда бюджет может не совпадать.
      // В ТЗ написано: "CAC = Маркетинговый бюджет / Кол-во продаж".
      // Значит мы считаем от ЦЕЛИ.
      
      const sales = Math.ceil(revenueGoal / (avgCheck || 1));
      const visits = Math.ceil(sales / ((metric.cr3 || 1) / 100));
      const leads = Math.ceil(visits / ((metric.cr2 || 1) / 100));
      
      const cac = Math.round(adBudget / (sales || 1));
      const visitCost = Math.round(adBudget / (visits || 1));
      const cpl = Math.round(adBudget / (leads || 1));
      
      const revenue = sales * avgCheck;
      const profit = revenue - adBudget - fixedCosts; // Упрощенный ROMI
      const romi = Math.round(((revenue - adBudget) / (adBudget || 1)) * 100);

      return {
        name: metric.name,
        sales,
        visits,
        leads,
        cac,
        visitCost,
        cpl,
        romi,
        revenue,
        budget: adBudget,
        metrics: metric
      };
    });

    setScenarios(calculated);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSendPlan = async () => {
    setLoading(true);
    try {
      // 1. Сохраняем "Средний" сценарий как KPI проекта
      const avgScenario = scenarios[1];
      const { error: kpiError } = await supabase
        .from('project_kpi')
        .upsert({
          project_id: projectId,
          revenue_goal: revenueGoal,
          avg_check: avgCheck,
          budget_needed: adBudget,
          sales_plan: avgScenario.sales,
          visits_plan: avgScenario.visits,
          leads_plan: avgScenario.leads,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' });

      if (kpiError) throw kpiError;

      // 2. Отправляем задачу в AI Bridge
      const prompt = `Проанализируй финансовую декомпозицию.
Цель: ${formatCurrency(revenueGoal)}
Средний чек: ${formatCurrency(avgCheck)}
Бюджет: ${formatCurrency(adBudget)}

Сценарии (Лиды -> Визиты -> Продажи):
Лучший: ${scenarios[0].leads} -> ${scenarios[0].visits} -> ${scenarios[0].sales} (ROMI ${scenarios[0].romi}%)
Средний: ${scenarios[1].leads} -> ${scenarios[1].visits} -> ${scenarios[1].sales} (ROMI ${scenarios[1].romi}%)
Худший: ${scenarios[2].leads} -> ${scenarios[2].visits} -> ${scenarios[2].sales} (ROMI ${scenarios[2].romi}%)

Дай 3 конкретных совета как приблизиться к Лучшему сценарию.`;

      const { error: aiError } = await supabase
        .from('ai_bridge_tasks')
        .insert({
          project_id: projectId,
          prompt: prompt,
          status: 'pending'
        });

      if (aiError) throw aiError;

      toast.success('План сохранен и отправлен на анализ ИИ');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка при отправке плана');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, value, onChange, suffix = '' }: any) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-1">{label}</Label>
      <div className="relative group">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-background border-input border rounded-lg px-4 py-3 h-auto text-lg text-foreground focus-visible:ring-1 focus-visible:ring-ring transition-all placeholder:text-muted-foreground/50 hover:border-accent-foreground/30"
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none font-medium">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Финансовая декомпозиция</h2>
          <p className="text-muted-foreground">Моделирование сценариев и расчет юнит-экономики</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block">
          <TabsList>
            <TabsTrigger value="medicine">Медицина</TabsTrigger>
            <TabsTrigger value="info">Инфобизнес</TabsTrigger>
            <TabsTrigger value="goods">Товары</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Блок А: Ввод данных */}
        <Card className="lg:col-span-4 h-fit border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Параметры модели
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <InputField 
              label="Цель по выручке" 
              value={revenueGoal} 
              onChange={setRevenueGoal} 
              suffix="₸" 
            />
            <InputField 
              label="Средний чек" 
              value={avgCheck} 
              onChange={setAvgCheck} 
              suffix="₸" 
            />
            <InputField 
              label="Рекламный бюджет" 
              value={adBudget} 
              onChange={setAdBudget} 
              suffix="₸" 
            />
            
            <div className="pt-4">
              <Button 
                onClick={handleSendPlan}
                disabled={loading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Отправить план в AI
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Блок Б и В: Визуализация и Таблица */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Визуальная воронка (Схематично) */}
          <div className="grid grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.name} className={cn("border-l-4 overflow-hidden relative", 
                scenario.name === 'Лучший' ? "border-l-emerald-500" : 
                scenario.name === 'Средний' ? "border-l-yellow-500" : "border-l-red-500"
              )}>
                <div className={cn("absolute inset-0 opacity-5 pointer-events-none", scenario.metrics.bg)} />
                <CardHeader className="pb-2">
                  <CardTitle className={cn("text-sm uppercase tracking-wider font-bold", scenario.metrics.color)}>
                    {scenario.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Лиды:</span>
                    <span className="font-mono font-medium">{scenario.leads}</span>
                  </div>
                  <div className="w-full h-px bg-border/50" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Визиты:</span>
                    <span className="font-mono font-medium">{scenario.visits}</span>
                  </div>
                  <div className="w-full h-px bg-border/50" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Продажи:</span>
                    <span className="font-mono font-bold text-foreground">{scenario.sales}</span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">ROMI:</span>
                      <span className={cn("text-lg font-bold", 
                        scenario.romi > 100 ? "text-emerald-500" : "text-foreground"
                      )}>{scenario.romi}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Таблица сравнения */}
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">Детальное сравнение</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[100px]">Сценарий</TableHead>
                    <TableHead className="text-right">Бюджет</TableHead>
                    <TableHead className="text-right">Лиды</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                    <TableHead className="text-right">Визиты</TableHead>
                    <TableHead className="text-right">Цена визита</TableHead>
                    <TableHead className="text-right">Продажи</TableHead>
                    <TableHead className="text-right">CAC</TableHead>
                    <TableHead className="text-right">ROMI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((row) => (
                    <TableRow key={row.name} className="hover:bg-muted/50 border-border/50">
                      <TableCell className="font-medium">
                        <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", 
                          row.name === 'Лучший' ? "bg-emerald-400/10 text-emerald-500 ring-emerald-400/20" : 
                          row.name === 'Средний' ? "bg-yellow-400/10 text-yellow-500 ring-yellow-400/20" : 
                          "bg-red-400/10 text-red-500 ring-red-400/20"
                        )}>
                          {row.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(row.budget)}</TableCell>
                      <TableCell className="text-right font-mono">{row.leads}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(row.cpl)}</TableCell>
                      <TableCell className="text-right font-mono">{row.visits}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(row.visitCost)}</TableCell>
                      <TableCell className="text-right font-bold">{row.sales}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(row.cac)}</TableCell>
                      <TableCell className={cn("text-right font-bold", row.romi > 0 ? "text-emerald-500" : "text-red-500")}>
                        {row.romi}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
