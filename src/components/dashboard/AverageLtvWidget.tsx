import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AverageLtvWidgetProps {
  projectId: string;
}

interface LtvData {
  totalLtv: number;
  paidCustomersCount: number;
  averageLtv: number;
  topCustomers: Array<{ name: string; ltv: number }>;
}

export const AverageLtvWidget = ({ projectId }: AverageLtvWidgetProps) => {
  const [data, setData] = useState<LtvData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLtvData = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const { data: leads, error } = await supabase
          .from('leads')
          .select('id, name, ltv, status')
          .eq('project_id', projectId)
          .eq('status', 'Оплачено')
          .not('ltv', 'is', null)
          .gt('ltv', 0)
          .order('ltv', { ascending: false });

        if (error) throw error;

        const paidLeads = leads || [];
        const totalLtv = paidLeads.reduce((sum, lead) => sum + (lead.ltv || 0), 0);
        const paidCustomersCount = paidLeads.length;
        const averageLtv = paidCustomersCount > 0 ? totalLtv / paidCustomersCount : 0;
        
        const topCustomers = paidLeads.slice(0, 3).map(lead => ({
          name: lead.name || 'Без имени',
          ltv: lead.ltv || 0
        }));

        setData({
          totalLtv,
          paidCustomersCount,
          averageLtv,
          topCustomers
        });
      } catch (error) {
        console.error('Error fetching LTV data:', error);
        setData({
          totalLtv: 0,
          paidCustomersCount: 0,
          averageLtv: 0,
          topCustomers: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLtvData();
  }, [projectId]);

  const formatCurrency = (value: number) => {
    // Только "млн" для миллионов, остальное полностью
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  };

  if (loading) {
    return (
      <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-8 w-24 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="group bg-card/80 backdrop-blur-xl border border-border/50 hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-500">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

      {/* Компактный горизонтальный layout */}
      <div className="relative z-10 flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 backdrop-blur-sm flex items-center justify-center">
          <Banknote className="w-6 h-6 text-primary" />
        </div>

        {/* Main Value */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-medium text-muted-foreground mb-1">Средний LTV</h3>
          <span className="text-xl md:text-2xl font-bold text-foreground whitespace-nowrap">
            {formatCurrency(data.averageLtv)}
          </span>
        </div>

        {/* Compact Stats */}
        <div className="flex gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground mb-0.5">Общий</p>
            <p className="text-sm font-semibold text-foreground whitespace-nowrap">
              {formatCurrency(data.totalLtv)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground mb-0.5">Клиентов</p>
            <p className="text-sm font-semibold text-foreground">
              {data.paidCustomersCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
