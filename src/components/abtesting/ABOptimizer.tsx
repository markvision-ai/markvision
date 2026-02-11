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

interface ABOptimizerProps {
  projectId: string;
}

export const ABOptimizer = ({ projectId }: ABOptimizerProps) => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, [projectId]);

  useEffect(() => {
    if (tests.length > 0) {
      if (!selectedTestId) {
        const running = tests.find(t => t.status === 'running');
        if (running) setSelectedTestId(running.id);
      }
      fetchStats();
      // Poll every 60s instead of 5s to reduce network load
      const interval = setInterval(fetchStats, 60000);
      return () => clearInterval(interval);
    }
  }, [tests.length, projectId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
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

      const { data: leads, error } = await supabase
        .from('leads')
        .select('id, ab_test_id, ab_test_variant, deal_amount, status')
        .in('ab_test_id', testIds)
        .not('ab_test_id', 'is', null);

      if (error) throw error;

      // Calculate GLOBAL stats
      const totalLeads = leads?.length || 0;
      const conversions = leads?.filter(l => l.status && ['won', 'closed', 'sold'].includes(l.status.toLowerCase())).length || 0;
      const revenue = leads?.reduce((sum, l) => sum + (Number(l.deal_amount) || 0), 0) || 0;
      const conversionRate = totalLeads > 0 ? (conversions / totalLeads) * 100 : 0;

      // Stats for SPECIFIC selected test
      const currentTestLeads = leads?.filter(l => l.ab_test_id === selectedTestId) || [];
      const variantALeads = currentTestLeads.filter(l => l.ab_test_variant === 'a') || [];
      const variantBLeads = currentTestLeads.filter(l => l.ab_test_variant === 'b') || [];

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
      });
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
    <div className="space-y-8 min-h-screen bg-[#0B0C15] p-6"> {/* Ensure background matches if not inherited */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-end sm:items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
            <FlaskConical className="w-8 h-8 text-primary" />
            A/B Optimizer
          </h2>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Target className="w-4 h-4" />
            AI-аналитика конверсии
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-white text-black hover:bg-white/90 font-bold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
          <Plus className="w-4 h-4 mr-2" />
          Новый тест
        </Button>
      </div>

      {/* Overview Stats */}
      <ABStatsOverview tests={tests} stats={stats} loading={loading} />

      {/* Battle View (Hero) */}
      {activeTest && stats && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Анализ текущего эксперимента</h3>
          </div>
          <ABBattleView test={activeTest} stats={stats} />
        </div>
      )}

      {/* Tests List */}
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">История экспериментов</h3>
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
