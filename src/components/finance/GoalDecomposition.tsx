import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/externalSupabase';
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
    <div className="space-y-3">
      <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">{label}</Label>
      <div className="relative group">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="bg-black border border-white/20 rounded-lg px-4 py-6 h-auto text-xl font-light text-white focus-visible:ring-0 focus-visible:border-white transition-all placeholder:text-white/20 hover:border-white/40"
          placeholder="0"
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 pointer-events-none font-medium">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-light tracking-tight text-white">
              Финансовый <span className="font-semibold text-emerald-500">Терминал</span>
            </h1>
            <p className="text-sm text-white/40 leading-relaxed max-w-md">
              Спроектируйте финансовую модель вашего бизнеса. Введите ключевые метрики для расчета стратегии.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3 p-6 bg-white/5 rounded-2xl border border-white/10">
              <Label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Цель по выручке (₸)</Label>
              <Input
                type="number"
                value={revenueGoal}
                onChange={(e) => setRevenueGoal(Number(e.target.value))}
                className="bg-transparent border-0 border-b-2 border-white/20 rounded-none px-0 py-4 h-auto text-5xl md:text-6xl font-medium text-white focus-visible:ring-0 focus-visible:border-emerald-500 transition-colors placeholder:text-white/10"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <InputField 
                label="Средний чек" 
                value={avgCheck} 
                onChange={setAvgCheck} 
                suffix="₸" 
              />
              
              <div className="grid grid-cols-2 gap-6">
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

              <div className="grid grid-cols-2 gap-6">
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
              className="w-full h-14 bg-white text-black hover:bg-gray-100 rounded-xl text-base font-bold tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-[0.99]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Wallet className="w-5 h-5 mr-2" />}
              Применить стратегию как KPI
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
            className="group relative overflow-hidden rounded-3xl bg-[#0A0A0A] border border-white/10 p-8 hover:border-violet-500/50 transition-colors duration-500"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity duration-500">
               <DollarSign className="w-12 h-12 text-violet-500" />
            </div>
            <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              Необходимый бюджет
            </div>
            <div className="text-5xl md:text-7xl font-light text-violet-100 tracking-tight">
              {formatCurrency(results.adBudget)}
            </div>
          </motion.div>

          {/* Plan Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0A0A0A] border border-white/10 p-8 rounded-3xl"
          >
            <div className="text-xs font-bold text-white/60 uppercase tracking-widest mb-6">
              Стратегический план (Воронка)
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-3xl font-light text-white mb-1">{results.leadsNeeded}</div>
                <div className="text-xs font-medium text-white/40 uppercase tracking-wider">Лидов</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5 relative">
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 text-white/20">→</div>
                <div className="text-3xl font-light text-white mb-1">{results.visitsNeeded}</div>
                <div className="text-xs font-medium text-white/40 uppercase tracking-wider">Визитов</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5 relative">
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 text-white/20">→</div>
                <div className="text-3xl font-light text-white mb-1">{results.salesNeeded}</div>
                <div className="text-xs font-medium text-white/40 uppercase tracking-wider">Продаж</div>
              </div>
            </div>
          </motion.div>

          {/* Net Profit Card (Moving Border Simulation) */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="relative p-[1px] overflow-hidden rounded-3xl"
          >
            {/* Animated Gradient Border */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,#10b981_180deg,transparent_360deg)] animate-[spin_4s_linear_infinite] opacity-100" />
            <div className="absolute inset-[1px] bg-black rounded-3xl" />
            
            <div className="relative bg-black h-full p-10 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                   <TrendingUp className="w-4 h-4" />
                   Чистая прибыль
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wide">
                  Target
                </div>
              </div>
              
              <div className="text-6xl md:text-8xl font-bold text-emerald-500 tracking-tighter drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                {formatCurrency(results.netProfit)}
              </div>
              
              <div className="mt-6 flex items-center gap-4 text-sm text-emerald-500/60 font-medium">
                <div className="h-px bg-emerald-500/20 flex-1" />
                <div>
                   Рентабельность: <span className="text-emerald-400">{results.adBudget > 0 ? Math.round(((results.netProfit) / (results.adBudget + fixedCosts)) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

