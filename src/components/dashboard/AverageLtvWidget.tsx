import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        // Fetch all paid leads with LTV
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
        
        // Top 3 customers by LTV
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
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(value) + ' ₸';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 border-emerald-500/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 border-emerald-500/20 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          Средний LTV клиента
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main LTV Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-bold text-emerald-600">
            {formatCurrency(data.averageLtv)}
          </span>
          <Badge className="bg-emerald-500/20 text-emerald-600 border-0 text-xs">
            AVG
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Общий LTV</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(data.totalLtv)}</p>
          </div>
          
          <div className="p-3 rounded-xl bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Оплативших</span>
            </div>
            <p className="text-lg font-bold">{data.paidCustomersCount}</p>
          </div>
        </div>

        {/* Top Customers */}
        {data.topCustomers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              Топ клиенты по LTV
            </p>
            <div className="space-y-1.5">
              {data.topCustomers.map((customer, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    index === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      index === 0 ? "bg-amber-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {customer.name}
                    </span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs font-bold",
                      index === 0 && "bg-amber-500/20 text-amber-600"
                    )}
                  >
                    {formatCurrency(customer.ltv)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
