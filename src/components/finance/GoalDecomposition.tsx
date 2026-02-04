import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Target, TrendingUp, Users, DollarSign, Calculator, Save, Wallet } from 'lucide-react';

interface GoalDecompositionProps {
  projectId: string;
}

export const GoalDecomposition = ({ projectId }: GoalDecompositionProps) => {
  // Inputs
  const [revenueGoal, setRevenueGoal] = useState<number>(5000000);
  const [fixedCosts, setFixedCosts] = useState<number>(500000);
  
  // Sliders
  const [avgCheck, setAvgCheck] = useState<number>(50000);
  const [convVisitSale, setConvVisitSale] = useState<number>(30); // %
  const [convLeadVisit, setConvLeadVisit] = useState<number>(40); // %
  const [cpl, setCpl] = useState<number>(3000); // ₸

  // Results
  const [results, setResults] = useState({
    salesNeeded: 0,
    visitsNeeded: 0,
    leadsNeeded: 0,
    adBudget: 0,
    netProfit: 0
  });

  const [isHovered, setIsHovered] = useState<number | null>(null);

  useEffect(() => {
    calculateResults();
  }, [revenueGoal, fixedCosts, avgCheck, convVisitSale, convLeadVisit, cpl]);

  const calculateResults = () => {
    // Avoid division by zero
    const safeAvgCheck = avgCheck || 1;
    const safeConvVisitSale = convVisitSale || 1;
    const safeConvLeadVisit = convLeadVisit || 1;

    const salesNeeded = Math.ceil(revenueGoal / safeAvgCheck);
    const visitsNeeded = Math.ceil(salesNeeded / (safeConvVisitSale / 100));
    const leadsNeeded = Math.ceil(visitsNeeded / (safeConvLeadVisit / 100));
    
    const adBudget = Math.ceil(leadsNeeded * cpl);
    const netProfit = revenueGoal - adBudget - fixedCosts;

    setResults({
      salesNeeded,
      visitsNeeded,
      leadsNeeded,
      adBudget,
      netProfit
    });
  };

  const handleSaveKPI = async () => {
    try {
      const { error } = await supabase
        .from('project_kpi')
        .upsert({
          project_id: projectId,
          revenue_goal: revenueGoal,
          avg_check: avgCheck,
          conv_visit_sale: convVisitSale,
          conv_lead_visit: convLeadVisit,
          cpl_forecast: cpl,
          fixed_costs: fixedCosts,
          budget_needed: results.adBudget,
          sales_plan: results.salesNeeded,
          visits_plan: results.visitsNeeded,
          leads_plan: results.leadsNeeded,
          updated_at: new Date().toISOString()
        }, { onConflict: 'project_id' });

      if (error) {
        console.error('Error saving KPI:', error);
        if (error.code === '42P01') { // undefined_table
           toast.error('Ошибка: Таблица project_kpi не найдена. Пожалуйста, создайте её в Supabase.');
        } else {
           toast.error('Ошибка при сохранении KPI');
        }
        return;
      }

      toast.success('План успешно зафиксирован как KPI');
    } catch (err) {
      console.error(err);
      toast.error('Произошла ошибка при сохранении');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  const resultCards = [
    {
      id: 1,
      title: 'Рекламный Бюджет',
      icon: <Wallet className="w-6 h-6 text-blue-400" />,
      value: formatCurrency(results.adBudget),
      subtext: 'Инвестиции в маркетинг',
      color: 'blue'
    },
    {
      id: 2,
      title: 'План Продаж',
      icon: <Target className="w-6 h-6 text-violet-400" />,
      value: `${results.leadsNeeded} / ${results.visitsNeeded} / ${results.salesNeeded}`,
      subtext: 'Лиды / Визиты / Продажи',
      color: 'violet'
    },
    {
      id: 3,
      title: 'Чистая Прибыль',
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      value: formatCurrency(results.netProfit),
      subtext: `Выручка - Реклама - Фикс (${formatCurrency(fixedCosts)})`,
      color: 'emerald'
    }
  ];

  return (
    <div className="space-y-8 p-6 bg-black/20 rounded-2xl border border-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-violet-400" />
            Декомпозиция Цели
          </h2>
          <p className="text-muted-foreground text-sm">
            Рассчитайте юнит-экономику и зафиксируйте KPI для ИИ
          </p>
        </div>
        <Button 
          onClick={handleSaveKPI}
          className="bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] transition-all"
        >
          <Save className="w-4 h-4 mr-2" />
          Зафиксировать план как KPI
        </Button>
      </div>

      {/* Main Goal Input */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-blue-500/10 blur-3xl" />
        <Card className="relative bg-black/40 border-white/10 overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
          <CardContent className="pt-6">
            <Label className="text-xs font-medium text-violet-300 uppercase tracking-wider mb-2 block">
              Ваша цель по выручке (₸)
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={revenueGoal}
                onChange={(e) => setRevenueGoal(Number(e.target.value))}
                className="text-4xl md:text-5xl font-bold h-auto py-4 bg-transparent border-none shadow-none focus-visible:ring-0 px-0 text-white placeholder:text-white/20"
                placeholder="0"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hidden md:block">
                {formatCurrency(revenueGoal)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Check */}
        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground">Средний чек</Label>
            <span className="font-mono text-white">{avgCheck.toLocaleString()} ₸</span>
          </div>
          <Slider
            value={[avgCheck]}
            min={5000}
            max={1000000}
            step={1000}
            onValueChange={(v) => setAvgCheck(v[0])}
            className="[&_.range-thumb]:bg-blue-500 [&_.range-track]:bg-blue-500/20"
          />
        </div>

        {/* Conv Lead -> Visit */}
        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground">Лид → Визит</Label>
            <span className="font-mono text-white">{convLeadVisit}%</span>
          </div>
          <Slider
            value={[convLeadVisit]}
            min={1}
            max={100}
            step={1}
            onValueChange={(v) => setConvLeadVisit(v[0])}
            className="[&_.range-thumb]:bg-violet-500 [&_.range-track]:bg-violet-500/20"
          />
        </div>

        {/* Conv Visit -> Sale */}
        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground">Визит → Оплата</Label>
            <span className="font-mono text-white">{convVisitSale}%</span>
          </div>
          <Slider
            value={[convVisitSale]}
            min={1}
            max={100}
            step={1}
            onValueChange={(v) => setConvVisitSale(v[0])}
            className="[&_.range-thumb]:bg-pink-500 [&_.range-track]:bg-pink-500/20"
          />
        </div>

        {/* CPL */}
        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between items-center">
            <Label className="text-muted-foreground">Цена Лида (CPL)</Label>
            <span className="font-mono text-white">{cpl} ₸</span>
          </div>
          <Slider
            value={[cpl]}
            min={100}
            max={20000}
            step={100}
            onValueChange={(v) => setCpl(v[0])}
            className="[&_.range-thumb]:bg-amber-500 [&_.range-track]:bg-amber-500/20"
          />
        </div>
      </div>

      {/* Additional Costs Input (Collapsible or just small) */}
      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 w-full max-w-md">
        <Label className="text-muted-foreground whitespace-nowrap">Мой фикс (ЗП, Аренда и т.д.):</Label>
        <Input 
          type="number" 
          value={fixedCosts} 
          onChange={(e) => setFixedCosts(Number(e.target.value))}
          className="bg-transparent border-white/10 text-right font-mono"
        />
      </div>

      {/* Results Cards (Hover Effect Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {resultCards.map((card, idx) => (
          <div
            key={card.id}
            className="relative group block p-2 h-full w-full"
            onMouseEnter={() => setIsHovered(idx)}
            onMouseLeave={() => setIsHovered(null)}
          >
            <div className={cn(
              "relative h-full rounded-2xl p-6 overflow-hidden bg-zinc-900 border border-white/10 transition-all duration-300",
              isHovered === idx ? "border-white/20 scale-[1.02]" : ""
            )}>
              {/* Hover Glow */}
              <div 
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl",
                  card.color === 'blue' && "bg-blue-500/10",
                  card.color === 'violet' && "bg-violet-500/10",
                  card.color === 'emerald' && "bg-emerald-500/10"
                )} 
              />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg bg-white/5",
                    card.color === 'blue' && "text-blue-400",
                    card.color === 'violet' && "text-violet-400",
                    card.color === 'emerald' && "text-emerald-400"
                  )}>
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-white/90">{card.title}</h3>
                </div>

                <div>
                  <div className={cn(
                    "text-2xl font-bold tracking-tight mb-1",
                    card.color === 'blue' && "text-blue-100",
                    card.color === 'violet' && "text-violet-100",
                    card.color === 'emerald' && "text-emerald-400"
                  )}>
                    {card.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{card.subtext}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
