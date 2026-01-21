import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, Users, Crown } from 'lucide-react';
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
    if (value >= 100000) {
      return (value / 1000).toFixed(0) + ' тыс ₸';
    }
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value) + ' ₸';
  };

  if (loading) {
    return (
      <div className="premium-card p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-12 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="premium-card p-6 overflow-hidden relative group">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Средний LTV клиента</h3>
      </div>
      
      {/* Main LTV Value */}
      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-3xl md:text-4xl font-bold text-primary">
          {formatCurrency(data.averageLtv)}
        </span>
        <Badge className="bg-primary/10 text-primary border-0 text-xs">
          AVG
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1.5">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Общий LTV</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(data.totalLtv)}</p>
        </div>
        
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Оплативших</span>
          </div>
          <p className="text-lg font-bold text-foreground">{data.paidCustomersCount}</p>
        </div>
      </div>

      {/* Top Customers */}
      {data.topCustomers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            Топ клиенты по LTV
          </p>
          <div className="space-y-1.5">
            {data.topCustomers.map((customer, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-lg transition-colors",
                  index === 0 
                    ? "bg-amber-500/10 border border-amber-500/20" 
                    : "bg-muted/20 border border-border/20"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    index === 0 ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                    {customer.name}
                  </span>
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs font-bold",
                    index === 0 && "bg-amber-500/20 text-amber-500 border-0"
                  )}
                >
                  {formatCurrency(customer.ltv)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
