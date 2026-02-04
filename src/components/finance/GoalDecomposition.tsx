import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Wallet, Target, Users, Percent, TrendingUp, DollarSign } from 'lucide-react';

interface GoalDecompositionProps {
  projectId: string;
}

export const GoalDecomposition = ({ projectId }: GoalDecompositionProps) => {
  // Inputs
  const [revenueGoal, setRevenueGoal] = useState<number>(10000000);
  const [avgCheck, setAvgCheck] = useState<number>(50000);
  const [convVisitSale, setConvVisitSale] = useState<number>(30); // %
  const [convLeadVisit, setConvLeadVisit] = useState<number>(40); // %
  const [cpl, setCpl] = useState<number>(3000); // ₸
  const [fixedCosts, setFixedCosts] = useState<number>(500000);

  const [loading, setLoading] = useState(false);

  // Results
  const [results, setResults] = useState({
    salesNeeded: 0,
    visitsNeeded: 0,
    leadsNeeded: 0,
    adBudget: 0,
    netProfit: 0
  });

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
    setLoading(true);
    // Enforce safe project ID
    const targetProjectId = projectId || '64c94e87-630c-470e-8ab1-8f7c8c835efa';

    try {
      const { error } = await supabase
        .from('project_kpi')
        .upsert({
          project_id: targetProjectId,
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
        toast.error('Ошибка при сохранении KPI');
        return;
      }

      toast.success('Стратегия успешно сохранена как KPI');
    } catch (err) {
      console.error(err);
      toast.error('Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  const InputField = ({ label, value, onChange, prefix = '', suffix = '' }: any) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-1">{label}</Label>
      <div className="relative group">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-background border-input border rounded-lg px-4 py-3 h-auto text-lg text-foreground focus-visible:ring-1 focus-visible:ring-ring transition-all placeholder:text-muted-foreground/50 hover:border-accent-foreground/30"
          placeholder="0"
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
    <div className="w-full bg-background text-foreground p-4 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Финансовый <span className="text-primary">Терминал</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Спроектируйте финансовую модель вашего бизнеса. Введите ключевые метрики для расчета стратегии.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 p-5 bg-card rounded-xl border border-border shadow-sm">
              <Label className="text-xs font-bold text-primary uppercase tracking-wide">Цель по выручке (₸)</Label>
              <Input
                type="number"
                value={revenueGoal}
                onChange={(e) => setRevenueGoal(Number(e.target.value))}
                className="bg-transparent border-0 border-b border-border rounded-none px-0 py-2 h-auto text-3xl md:text-4xl font-medium text-foreground focus-visible:ring-0 focus-visible:border-primary transition-colors placeholder:text-muted-foreground/20 shadow-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-5">
              <InputField 
                label="Средний чек" 
                value={avgCheck} 
                onChange={setAvgCheck} 
                suffix="₸" 
              />
              
              <div className="grid grid-cols-2 gap-5">
                <InputField 
                  label="Конверсия в визит" 
                  value={convLeadVisit} 
                  onChange={setConvLeadVisit} 
                  suffix="%" 
                />
                <InputField 
                  label="Конверсия в продажу" 
                  value={convVisitSale} 
                  onChange={setConvVisitSale} 
                  suffix="%" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <InputField 
                  label="Прогноз CPL" 
                  value={cpl} 
                  onChange={setCpl} 
                  suffix="₸" 
                />
                <InputField 
                  label="Фикс. расходы" 
                  value={fixedCosts} 
                  onChange={setFixedCosts} 
                  suffix="₸" 
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveKPI}
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-semibold tracking-wide uppercase transition-all shadow-md active:scale-[0.99]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
              Применить стратегию
            </Button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pt-10 lg:pt-0">
          
          {/* Budget Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-3xl bg-card border border-border p-8 hover:border-primary/50 transition-colors duration-500 shadow-sm"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
               <DollarSign className="w-12 h-12 text-primary" />
            </div>
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Необходимый бюджет
            </div>
            <div className="text-5xl md:text-7xl font-light text-foreground tracking-tight">
              {formatCurrency(results.adBudget)}
            </div>
          </motion.div>

          {/* Plan Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border p-8 rounded-3xl shadow-sm"
          >
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
              Стратегический план (Воронка)
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center p-4 rounded-2xl bg-muted/50 border border-border/50">
                <div className="text-3xl font-light text-foreground mb-1">{results.leadsNeeded}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Лидов</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-muted/50 border border-border/50 relative">
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 text-muted-foreground/20">→</div>
                <div className="text-3xl font-light text-foreground mb-1">{results.visitsNeeded}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Визитов</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-muted/50 border border-border/50 relative">
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 text-muted-foreground/20">→</div>
                <div className="text-3xl font-light text-foreground mb-1">{results.salesNeeded}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Продаж</div>
              </div>
            </div>
          </motion.div>

          {/* Net Profit Card (Moving Border Simulation) */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="relative p-[1px] overflow-hidden rounded-3xl shadow-md"
          >
            {/* Animated Gradient Border */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,#10b981_180deg,transparent_360deg)] animate-[spin_4s_linear_infinite] opacity-100" />
            <div className="absolute inset-[1px] bg-card rounded-3xl" />
            
            <div className="relative bg-card h-full p-10 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <TrendingUp className="w-4 h-4" />
                   Чистая прибыль
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wide">
                  Target
                </div>
              </div>
              
              <div className="text-6xl md:text-8xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tighter drop-shadow-sm">
                {formatCurrency(results.netProfit)}
              </div>
              
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground font-medium">
                <div className="h-px bg-emerald-500/20 flex-1" />
                <div>
                   Рентабельность: <span className="text-emerald-600 dark:text-emerald-400">{results.adBudget > 0 ? Math.round(((results.netProfit) / (results.adBudget + fixedCosts)) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

