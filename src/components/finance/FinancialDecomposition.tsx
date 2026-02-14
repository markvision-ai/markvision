import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useFinancialMonthData } from '@/hooks/useFinancialMonthData';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChannelFinancialModel, ChannelData } from './ChannelFinancialModel';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialDecompositionProps {
  projectId: string;
}

const DEFAULT_DATA: ChannelData = {
  revenueGoal: 3000000,
  avgCheck: 500000,
  crLeadToVisit: 10,
  crVisitToSale: 30,
  cplBest: 1500,
  cplAvg: 2500,
  cplWorst: 3500,
  calcMode: 'goal',
  budgetInput: 1000000,
  rationaleBest: '',
  rationaleAvg: '',
  rationaleWorst: '',
};

export const FinancialDecomposition = ({ projectId }: FinancialDecompositionProps) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [saveLoading, setSaveLoading] = useState(false);
  const { loading: dataLoading, plan, fact, savePlan } = useFinancialMonthData(projectId, selectedMonth);
  const [modelData, setModelData] = useState<ChannelData>(DEFAULT_DATA);

  useEffect(() => {
    if (plan) {
      setModelData(prev => ({
        ...prev,
        revenueGoal: plan.revenue_goal || prev.revenueGoal,
        avgCheck: plan.avg_check || prev.avgCheck,
        crLeadToVisit: plan.cr_lead_visit || prev.crLeadToVisit,
        crVisitToSale: plan.cr_visit_sale || prev.crVisitToSale,
        cplBest: plan.cpl_best || prev.cplBest,
        cplAvg: plan.cpl_avg || prev.cplAvg,
        cplWorst: plan.cpl_worst || prev.cplWorst,
        rationaleBest: plan.rationale_best || prev.rationaleBest || '',
        rationaleAvg: plan.rationale_avg || prev.rationaleAvg || '',
        rationaleWorst: plan.rationale_worst || prev.rationaleWorst || '',
      }));
    }
  }, [plan]);

  useEffect(() => {
    const monthStr = format(selectedMonth, 'yyyy-MM');
    const storageKey = `financial_model_ui_${projectId}_${monthStr}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setModelData(prev => ({
          ...prev,
          calcMode: parsed.calcMode || 'goal',
          budgetInput: parsed.budgetInput || prev.budgetInput,
          rationaleBest: parsed.rationaleBest || prev.rationaleBest || '',
          rationaleAvg: parsed.rationaleAvg || prev.rationaleAvg || '',
          rationaleWorst: parsed.rationaleWorst || prev.rationaleWorst || ''
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [projectId, selectedMonth]);

  useEffect(() => {
    const monthStr = format(selectedMonth, 'yyyy-MM');
    const storageKey = `financial_model_ui_${projectId}_${monthStr}`;
    localStorage.setItem(storageKey, JSON.stringify({
      calcMode: modelData.calcMode,
      budgetInput: modelData.budgetInput,
      rationaleBest: modelData.rationaleBest,
      rationaleAvg: modelData.rationaleAvg,
      rationaleWorst: modelData.rationaleWorst
    }));
  }, [modelData, projectId, selectedMonth]);


  const handleSaveAndAnalyze = async () => {
    setSaveLoading(true);
    try {
      const newPlan = {
        revenue_goal: modelData.revenueGoal,
        avg_check: modelData.avgCheck,
        cr_lead_visit: modelData.crLeadToVisit,
        cr_visit_sale: modelData.crVisitToSale,
        cpl_best: modelData.cplBest,
        cpl_avg: modelData.cplAvg,
        cpl_worst: modelData.cplWorst,
        rationale_best: modelData.rationaleBest,
        rationale_avg: modelData.rationaleAvg,
        rationale_worst: modelData.rationaleWorst,
      };

      const success = await savePlan(newPlan);
      if (!success) throw new Error('Failed to save plan');

      const prompt = `Проанализируй финансовую декомпозицию за ${format(selectedMonth, 'LLLL yyyy', { locale: ru })}. 
      Цель: ${modelData.revenueGoal}, Бюджет: ${modelData.budgetInput}, CPL: ${modelData.cplAvg}.`;

      const { error: aiError } = await supabase
        .from('ai_bridge_tasks')
        .insert({
          project_id: projectId,
          prompt: prompt,
          status: 'pending'
        });

      if (aiError) console.error('AI Task Error:', aiError);

      toast.success('Данные сохранены и отправлены на анализ');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка при сохранении');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setSelectedMonth(current =>
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden pb-8 relative">
      {/* Month Selection Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-3 shadow-sm">
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-1">
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange('prev')} className="rounded-lg w-8 h-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <AnimatePresence mode="wait">
            <motion.span
              key={selectedMonth.toISOString()}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-sm font-semibold min-w-[140px] text-center capitalize text-foreground"
            >
              {format(selectedMonth, 'LLLL yyyy', { locale: ru })}
            </motion.span>
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange('next')} className="rounded-lg w-8 h-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex" disabled>
            <Share2 className="w-4 h-4 mr-2" />
            Поделиться
          </Button>
          <Button onClick={handleSaveAndAnalyze} disabled={saveLoading} className="gap-2">
            {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Сохранить модель
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <ChannelFinancialModel
          channelName="Финансовая модель"
          data={modelData}
          onChange={setModelData}
          isSummary={false}
          fact={fact}
        />
      </div>
    </div>
  );
};
