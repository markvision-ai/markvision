import { useMemo } from 'react';
import { Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, TrendingUp, Sparkles, Target } from 'lucide-react';
import { CRMFunnelSkeleton } from './CRMFunnelSkeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CRMFunnelProps {
  leads: Lead[];
  loading: boolean;
}

interface FunnelStep {
  id: string;
  label: string;
  count: number;
  amount: number;
  gradient: string;
  icon: React.ElementType;
}

export const CRMFunnel = ({ leads, loading }: CRMFunnelProps) => {
  const funnelData = useMemo(() => {
    const newCount = leads.filter(l => l.status === 'new' || !l.status).length;
    const diagnosticCount = leads.filter(l => l.status === 'in_progress' || l.status === 'diagnostics_completed').length;
    const appointmentCount = leads.filter(l => l.status === 'appointment').length;
    const paidLeads = leads.filter(l => l.status === 'paid');
    const paidCount = paidLeads.length;
    const totalAmount = paidLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
    
    // Замороженные деньги: сумма всех чеков лидов в каждом этапе
    const newLeads = leads.filter(l => l.status === 'new' || !l.status);
    const diagnosticLeads = leads.filter(l => l.status === 'in_progress' || l.status === 'diagnostics_completed');
    const appointmentLeads = leads.filter(l => l.status === 'appointment');
    
    const frozenNew = newLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
    const frozenDiagnostic = diagnosticLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
    const frozenAppointment = appointmentLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);

    const steps: FunnelStep[] = [
      { id: 'new', label: 'Новые лиды', count: leads.length, amount: frozenNew, gradient: 'from-blue-500 to-cyan-500', icon: Users },
      { id: 'diagnostic', label: 'Прошли диагностику', count: diagnosticCount + appointmentCount + paidCount, amount: frozenDiagnostic, gradient: 'from-orange-500 to-amber-500', icon: Target },
      { id: 'appointment', label: 'Записаны', count: appointmentCount + paidCount, amount: frozenAppointment, gradient: 'from-purple-500 to-pink-500', icon: Calendar },
      { id: 'paid', label: 'Оплачено', count: paidCount, amount: totalAmount, gradient: 'from-emerald-500 to-green-500', icon: DollarSign },
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
    return <CRMFunnelSkeleton />;
  }

  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  const statCards = [
    { icon: Users, label: 'Всего лидов', value: stats.totalLeads.toString(), gradient: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/20' },
    { icon: Target, label: 'Оплачено', value: stats.paidLeads.toString(), gradient: 'from-emerald-500 to-green-500', glow: 'shadow-emerald-500/20' },
    { icon: DollarSign, label: 'Выручка', value: `${new Intl.NumberFormat('ru-RU').format(stats.totalRevenue)} ₸`, gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/20' },
    { icon: TrendingUp, label: 'Конверсия', value: `${stats.conversionRate.toFixed(1)}%`, gradient: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/20' },
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Premium Stats Cards - Glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={cn('overflow-hidden hover:shadow-md transition-all duration-300 backdrop-blur-sm bg-card/50 border border-border', stat.glow, 'shadow-sm')}>
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className={cn('w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg', stat.gradient)}>
                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{stat.label}</p>
                    <p className="text-xl md:text-2xl font-bold truncate">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Premium Funnel Chart - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="overflow-hidden shadow-sm backdrop-blur-sm bg-card/50 border border-border">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="crm-header-gradient font-bold text-xl">Воронка продаж</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-5">
              {funnelData.map((step, index) => {
                const widthPercent = (step.count / maxCount) * 100;
                const prevCount = index > 0 ? funnelData[index - 1].count : step.count;
                const conversionFromPrev = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '100';
                const StepIcon = step.icon;

                return (
                  <motion.div 
                    key={step.id} 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  >
                    <div className="flex items-center justify-between text-sm gap-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', step.gradient)}>
                          <StepIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">{step.label}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <span className="text-lg font-bold">{step.count}</span>
                        {index > 0 && (
                          <>
                            {/* Процент потерь между этапами */}
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                              {conversionFromPrev}%
                            </span>
                            {/* Процент потерь (обратный конверсии) */}
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
                              Потеря: {(100 - parseFloat(conversionFromPrev)).toFixed(1)}%
                            </span>
                          </>
                        )}
                        {/* Замороженные деньги */}
                        {step.amount > 0 && (
                          <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                            💰 {new Intl.NumberFormat('ru-RU').format(step.amount)} ₸
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-10 md:h-12 bg-muted/50 rounded-xl overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-r', step.gradient)}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(widthPercent, 8)}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                      >
                        {widthPercent > 20 && step.count}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Premium Conversion Summary */}
            {leads.length > 0 && (
              <motion.div 
                className="mt-8 pt-6 border-t border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Общая конверсия</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">{stats.totalLeads}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-2xl font-bold text-success">{stats.paidLeads}</span>
                      <span className={cn(
                        'text-lg font-bold px-3 py-1 rounded-full',
                        stats.conversionRate >= 5 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      )}>
                        {stats.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
