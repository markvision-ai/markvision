import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FlaskConical, Target, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ABTest, TestStats } from './types';
import { ABStatsOverview } from './ABStatsOverview';
import { ABBattleView } from './ABBattleView';
import { ABTestList } from './ABTestList';
import { CreateTestWizard } from './CreateTestWizard';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface ABOptimizerProps {
  projectId: string;
}

export const ABOptimizer = ({ projectId }: ABOptimizerProps) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const isVisible = usePageVisibility();

  useEffect(() => {
    fetchTests();
  }, [projectId]);

  useEffect(() => {
    if (!tests.length || !isVisible) return;
    if (!selectedTestId) {
      const running = tests.find(t => t.status === 'running');
      if (running) setSelectedTestId(running.id);
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30s (visible only)
    return () => clearInterval(interval);
  }, [tests, projectId, selectedTestId, isVisible]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedTests: ABTest[] = (data || []).map((t: any) => ({
        ...t,
        test_category: t.test_category || 'page',
        variant_a_name: t.variant_a_name || 'Вариант А',
        variant_b_name: t.variant_b_name || 'Вариант Б',
        variant_a_visitors: t.variant_a_visitors || 0,
        variant_b_visitors: t.variant_b_visitors || 0,
        variant_a_conversions: t.variant_a_conversions || 0,
        variant_b_conversions: t.variant_b_conversions || 0,
        variant_a_spend: t.variant_a_spend || 0,
        variant_b_spend: t.variant_b_spend || 0,
        variant_a_leads: t.variant_a_leads || 0,
        variant_b_leads: t.variant_b_leads || 0,
        variant_a_impressions: t.variant_a_impressions || 0,
        variant_b_impressions: t.variant_b_impressions || 0,
        confidence_level: t.confidence_level || 95,
        min_sample_size: t.min_sample_size || 100,
        auto_winner_threshold: t.auto_winner_threshold || 95,
      }));

      setTests(mappedTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const activeTests = tests; // Fetch stats for ALL tests to show history
      if (activeTests.length === 0) {
        setStats(null);
        return;
      }

      const testIds = activeTests.map(t => t.id);

      const { data: rawLeads, error: fetchError } = await supabase
        .from('leads')
        .select('id, ab_test_id, ab_test_variant, deal_amount, status')
        .in('ab_test_id', testIds) as { data: any[] | null, error: any };

      if (fetchError) {
        // Handle case where column might not exist yet by providing empty fallback
        console.warn('Leads table might missing ab_test_id column:', fetchError.message);
        setStats({
          totalLeads: 0,
          conversionRate: 0,
          revenue: 0,
          variantA: { leads: 0, conversions: 0, revenue: 0, conversionRate: 0 },
          variantB: { leads: 0, conversions: 0, revenue: 0, conversionRate: 0 },
        });
        return;
      }

      const leads = rawLeads || [];

      // Calculate GLOBAL stats
      const totalLeads = leads.length;
      const conversions = leads.filter((l: any) => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length;
      const revenue = leads.reduce((sum: number, l: any) => sum + (Number(l.deal_amount) || 0), 0);
      const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

      // Stats for SPECIFIC selected test
      const currentTestLeads = leads.filter((l: any) => l.ab_test_id === selectedTestId);
      const variantALeads = currentTestLeads.filter((l: any) => l.ab_test_variant?.toLowerCase() === 'a');
      const variantBLeads = currentTestLeads.filter((l: any) => l.ab_test_variant?.toLowerCase() === 'b');

      // Helper to calc stats for a variant
      const calcVariantStats = (variantLeads: any[]) => {
        const conversions = variantLeads.filter(l => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length;
        const revenue = variantLeads.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0);
        const cr = variantLeads.length > 0 ? (conversions / variantLeads.length) * 100 : 0;
        return { leads: variantLeads.length, conversions, revenue, conversionRate: cr };
      };

      setStats({
        totalLeads,
        conversionRate,
        revenue,
        variantA: calcVariantStats(variantALeads),
        variantB: calcVariantStats(variantBLeads),
      } as TestStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateTest = async (data: any) => {
    // API call to create test
    const { error } = await supabase.from('ab_tests').insert([{
      project_id: projectId,
      status: 'draft',
      ...data
    }]);

    if (error) throw error;
    toast.success('A/B тест успешно создан');
    fetchTests();
  };

  const handleStartTest = async (id: string) => {
    const { error } = await supabase.from('ab_tests').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      toast.error("Не удалось запустить тест");
      return;
    }
    toast.success("Тест запущен");
    fetchTests();
  };

  const handlePauseTest = async (id: string) => {
    const { error } = await supabase.from('ab_tests').update({ status: 'paused' }).eq('id', id);
    if (error) {
      toast.error("Не удалось приостановить тест");
      return;
    }
    toast.success("Тест на паузе");
    fetchTests();
  };

  const activeTest = tests.find(t => t.id === selectedTestId);

  return (
    <div className="space-y-8 min-h-screen p-4 md:p-8 relative z-10 bg-slate-50/50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-white/80 backdrop-blur-3xl rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 shadow-inner border border-white/50">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-foreground uppercase">
              A/B Optimizer
            </h2>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground font-medium">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              AI-аналитика конверсии
            </div>
          </div>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-base"
        >
          <Plus className="w-5 h-5" />
          Новый тест
        </Button>
      </div>

      {/* Overview Stats */}
      <ABStatsOverview tests={tests} stats={stats} loading={loading} />

      {/* Battle View (Hero) */}
      {activeTest && stats && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-foreground uppercase tracking-widest">Текущий эксперимент</h3>
          </div>
          <ABBattleView test={activeTest} stats={stats} />
        </div>
      )}

      {/* Tests List Section */}
      <div className="bg-white/80 backdrop-blur-3xl rounded-[32px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-500" />
            История экспериментов
          </h3>
        </div>
        <ABTestList
          tests={tests}
          onStart={handleStartTest}
          onPause={handlePauseTest}
          onSelect={setSelectedTestId}
          selectedTestId={selectedTestId}
        />
      </div>

      <CreateTestWizard
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreateTest}
      />
    </div>
  );
};
