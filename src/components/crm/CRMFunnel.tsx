import { useMemo, useState } from 'react';
import { Lead } from '@/hooks/useLeads';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, TrendingUp, Sparkles, Target, Info } from 'lucide-react';
import { CRMFunnelSkeleton } from './CRMFunnelSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  icon: React.ElementType;
  gradientId: string;
  percentage: number;
}

export const CRMFunnel = ({ leads, loading }: CRMFunnelProps) => {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  const funnelData = useMemo(() => {
    // 1. Calculate raw counts
    const totalLeads = leads.length; // All leads including rejected for base
    const activeLeads = leads.filter(l => l.status !== 'Отказ');

    // Define stages with accumulating logic or strict status logic
    // Using accumulating logic: A lead in "Paid" also passed through "New", "In Progress", etc.
    // Ideally, a funnel shows flow.

    const stepsRaw = [
      {
        id: 'all',
        label: 'Все лиды',
        count: leads.length,
        amount: leads.reduce((sum, l) => sum + (l.deal_amount || 0), 0),
        color: '#3b82f6', // blue
        gradientId: 'blueGradient',
        icon: Users
      },
      {
        id: 'qualified', // In Progress +
        label: 'В работе',
        count: leads.filter(l => ['В работе', 'Счет выставлен', 'Записан', 'Оплачен'].includes(l.status || '')).length,
        amount: leads.filter(l => ['В работе', 'Счет выставлен', 'Записан', 'Оплачен'].includes(l.status || '')).reduce((sum, l) => sum + (l.deal_amount || 0), 0),
        color: '#8b5cf6', // violet
        gradientId: 'violetGradient',
        icon: Sparkles
      },
      {
        id: 'offer', // Invoiced +
        label: 'Предложение',
        count: leads.filter(l => ['Счет выставлен', 'Записан', 'Оплачен'].includes(l.status || '')).length,
        amount: leads.filter(l => ['Счет выставлен', 'Записан', 'Оплачен'].includes(l.status || '')).reduce((sum, l) => sum + (l.deal_amount || 0), 0),
        color: '#d946ef', // fuchsia
        gradientId: 'fuchsiaGradient',
        icon: Target
      },
      {
        id: 'appointment', // Appointment +
        label: 'Записаны',
        count: leads.filter(l => ['Записан', 'Оплачен'].includes(l.status || '')).length,
        amount: leads.filter(l => ['Записан', 'Оплачен'].includes(l.status || '')).reduce((sum, l) => sum + (l.deal_amount || 0), 0),
        color: '#ec4899', // pink
        gradientId: 'pinkGradient',
        icon: Calendar
      },
      {
        id: 'won', // Paid
        label: 'Оплачено',
        count: leads.filter(l => l.status === 'Оплачен').length,
        amount: leads.filter(l => l.status === 'Оплачен').reduce((sum, l) => sum + (l.deal_amount || 0), 0),
        color: '#10b981', // emerald
        gradientId: 'emeraldGradient',
        icon: DollarSign
      }
    ];

    // Calculate percentages relative to the first step (All Leads)
    const baseCount = stepsRaw[0].count || 1;
    return stepsRaw.map(step => ({
      ...step,
      percentage: Math.round((step.count / baseCount) * 100)
    }));
  }, [leads]);

  const stats = useMemo(() => {
    const paidLeads = leads.filter(l => l.status === 'Оплачен');
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

  // --- SVG Dimensions & Math ---
  const width = 600;
  const height = 400;
  const padding = 40;
  const topWidth = 500;
  const bottomWidth = 200;
  const stepHeight = (height - padding * 2) / funnelData.length;

  const getPoints = (index: number) => {
    const y1 = padding + index * stepHeight;
    const y2 = y1 + stepHeight - 10; // -10 for gap between slices

    // Lerp for width at y1 and y2
    const totalSteps = funnelData.length;

    const w1 = topWidth - ((topWidth - bottomWidth) * (index / totalSteps));
    const w2 = topWidth - ((topWidth - bottomWidth) * ((index + 1) / totalSteps));

    const x1 = (width - w1) / 2;
    const x2 = (width - w2) / 2;

    // Polygon points: top-left, top-right, bottom-right, bottom-left
    return `${x1},${y1} ${x1 + w1},${y1} ${x2 + w2},${y2} ${x2},${y2}`;
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0
  }).format(val);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Всего лидов', value: stats.totalLeads, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Конверсия', value: `${stats.conversionRate.toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Оплачено', value: stats.paidLeads, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Выручка', value: formatMoney(stats.totalRevenue), icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={cn("backdrop-blur-xl bg-white/70 border shadow-sm", stat.border)}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Funnel Visualization */}
        <Card className="lg:col-span-2 bg-card border border-white/50 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-primary" />
              Воронка продаж
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-6 relative">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto max-w-[600px] drop-shadow-2xl"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="violetGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="fuchsiaGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#e879f9" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="pinkGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {funnelData.map((step, index) => {
                const points = getPoints(index);
                const isHovered = hoveredStep === step.id;

                return (
                  <g
                    key={step.id}
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <motion.polygon
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{
                        scale: isHovered ? 1.02 : 1,
                        opacity: 1,
                        filter: isHovered ? 'url(#glow)' : 'none'
                      }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      points={points}
                      fill={`url(#${step.gradientId})`}
                      stroke="white"
                      strokeWidth={isHovered ? 1 : 0.3}
                      strokeOpacity={0.5}
                    />

                    {/* Percentage Label inside segment */}
                    <motion.text
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      x={width / 2}
                      y={padding + index * stepHeight + stepHeight / 2 + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                      style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                    >
                      {step.count}
                    </motion.text>
                  </g>
                );
              })}
            </svg>

            {/* Conversion Indicators (Right Side) */}
            <div className="absolute right-0 top-[40px] bottom-[40px] flex flex-col justify-between py-8 pr-4 md:pr-12 pointer-events-none">
              {funnelData.slice(0, -1).map((step, i) => {
                const nextStep = funnelData[i + 1];
                const conversion = step.count > 0 ? Math.round((nextStep.count / step.count) * 100) : 0;
                return (
                  <motion.div
                    key={`conv-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                    className="flex flex-col items-end"
                  >
                    <div className="text-xs font-medium text-muted-foreground mr-2">
                      ↓ {conversion}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend / Detailed List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold px-1">Этапы воронки</h3>
          <AnimatePresence>
            {funnelData.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: hoveredStep === step.id ? 1.03 : 1,
                  backgroundColor: hoveredStep === step.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
                className="flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-white/10 transition-colors cursor-pointer"
              >
                <div
                  className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-2xl shadow-blue-900/5")}
                  style={{ background: step.color }}
                >
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{step.label}</p>
                    <span className="font-bold text-sm">{step.count}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      {step.percentage}% от общего
                    </p>
                    {step.amount > 0 && (
                      <span className="text-xs font-medium text-blue-500">
                        {formatMoney(step.amount)}
                      </span>
                    )}
                  </div>
                  {/* Mini Progress Bar */}
                  <div className="h-1 mt-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: step.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${step.percentage}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
