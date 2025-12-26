import { useMemo } from 'react';
import { Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface CRMFunnelProps {
  leads: Lead[];
  loading: boolean;
}

interface FunnelStep {
  id: string;
  label: string;
  count: number;
  amount: number;
  color: string;
}

export const CRMFunnel = ({ leads, loading }: CRMFunnelProps) => {
  const funnelData = useMemo(() => {
    const newCount = leads.filter(l => l.status === 'new' || !l.status).length;
    const appointmentCount = leads.filter(l => l.status === 'appointment').length;
    const paidLeads = leads.filter(l => l.status === 'paid');
    const paidCount = paidLeads.length;
    const totalAmount = paidLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);

    const steps: FunnelStep[] = [
      { id: 'new', label: 'Новые лиды', count: leads.length, amount: 0, color: 'hsl(220, 90%, 56%)' },
      { id: 'appointment', label: 'Записаны', count: appointmentCount + paidCount, amount: 0, color: 'hsl(262, 83%, 58%)' },
      { id: 'paid', label: 'Оплачено', count: paidCount, amount: totalAmount, color: 'hsl(142, 76%, 36%)' },
    ];

    return steps;
  }, [leads]);

  const stats = useMemo(() => {
    const paidLeads = leads.filter(l => l.status === 'paid');
    const totalRevenue = paidLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
    const avgCheck = paidLeads.length > 0 ? totalRevenue / paidLeads.length : 0;
    const conversionRate = leads.length > 0 ? (paidLeads.length / leads.length) * 100 : 0;

    return {
      totalLeads: leads.length,
      paidLeads: paidLeads.length,
      totalRevenue,
      avgCheck,
      conversionRate,
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Всего лидов</p>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Оплачено</p>
                <p className="text-2xl font-bold">{stats.paidLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Выручка</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(stats.totalRevenue)} ₸
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Конверсия</p>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Воронка продаж</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((step, index) => {
              const widthPercent = (step.count / maxCount) * 100;
              const prevCount = index > 0 ? funnelData[index - 1].count : step.count;
              const conversionFromPrev = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '100';

              return (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{step.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {step.count} лидов
                      </span>
                      {index > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({conversionFromPrev}% от пред.)
                        </span>
                      )}
                      {step.amount > 0 && (
                        <span className="font-semibold text-success">
                          {new Intl.NumberFormat('ru-RU').format(step.amount)} ₸
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-10 bg-secondary rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center justify-center text-white text-sm font-medium"
                      style={{
                        width: `${Math.max(widthPercent, 5)}%`,
                        backgroundColor: step.color,
                      }}
                    >
                      {widthPercent > 20 && step.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conversion Arrow */}
          {leads.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-muted-foreground">Общая конверсия:</span>
                <span className="font-bold text-lg">
                  {stats.totalLeads} → {stats.paidLeads}
                </span>
                <span className={`font-semibold ${stats.conversionRate >= 5 ? 'text-success' : 'text-warning'}`}>
                  ({stats.conversionRate.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
