import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
  };

  if (loading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="group bg-card/50 backdrop-blur-sm border border-border/40 hover:border-border/60 hover:bg-card/60 rounded-xl p-4 transition-all duration-200">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>

        {/* Main Value */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Средний LTV
          </p>
          <p className="text-xl font-semibold text-foreground tracking-tight leading-none">
            {formatCurrency(data.averageLtv)}
          </p>
        </div>

        {/* Compact Stats */}
        <div className="flex gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-medium text-muted-foreground/70 mb-0.5">Общий</p>
            <p className="text-xs font-semibold text-foreground">
              {formatCurrency(data.totalLtv)}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] font-medium text-muted-foreground/70 mb-0.5">Клиентов</p>
            <p className="text-xs font-semibold text-foreground">
              {data.paidCustomersCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
