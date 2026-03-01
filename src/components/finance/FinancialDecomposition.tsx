import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import { useFinancialMonthData } from '@/hooks/useFinancialMonthData';
import { format, subMonths, addMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DecompositionCalculator } from './DecompositionCalculator';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface FinancialDecompositionProps {
  projectId: string;
}

export const FinancialDecomposition = ({ projectId }: FinancialDecompositionProps) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { loading: dataLoading, plan, fact, savePlan } = useFinancialMonthData(projectId, selectedMonth);

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-card/40 backdrop-blur-3xl shadow-interstellar border border-white/10 rounded-[2.5rem] p-4">
        <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-1.5 border border-white/5">
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange('prev')} className="rounded-xl w-10 h-10 hover:bg-white/10 text-white/60">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <AnimatePresence mode="wait">
            <motion.span
              key={selectedMonth.toISOString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-xs font-black min-w-[160px] text-center uppercase tracking-[0.2em] text-white/80"
            >
              {format(selectedMonth, 'LLLL yyyy', { locale: ru })}
            </motion.span>
          </AnimatePresence>
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange('next')} className="rounded-xl w-10 h-10 hover:bg-white/10 text-white/60">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex rounded-2xl h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px]">
            <Share2 className="w-4 h-4 mr-2" />
            Поделиться
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <DecompositionCalculator projectId={projectId} />
      </div>
    </div>
  );
};
