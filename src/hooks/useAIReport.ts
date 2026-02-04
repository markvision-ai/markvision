import { useState } from 'react';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

interface ReportData {
  projectId?: string;
  projectName: string;
  dateRange: { from: Date; to: Date };
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    visits: number;
    sales: number;
    revenue: number;
  };
  metrics: {
    customerCost: number;
    visitCost: number;
    leadCost: number;
    impressionToLeadConv: number;
    leadToVisitConv: number;
    visitToSaleConv: number;
    roas: number;
  };
}

export const useAIReport = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const generateAIReport = async (data: ReportData) => {
    setIsGenerating(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-ai-report', {
        body: {
          projectId: data.projectId,
          projectName: data.projectName,
          dateRange: {
            from: data.dateRange.from.toISOString(),
            to: data.dateRange.to.toISOString(),
          },
          totals: data.totals,
          metrics: data.metrics,
        },
      });

      if (error) {
        throw error;
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setAiAnalysis(result.analysis);
      toast.success('AI-анализ сгенерирован');
      return result.analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка генерации анализа';
      toast.error(message);
      console.error('AI report error:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAnalysis = () => {
    setAiAnalysis(null);
  };

  return {
    isGenerating,
    aiAnalysis,
    generateAIReport,
    clearAnalysis,
  };
};
