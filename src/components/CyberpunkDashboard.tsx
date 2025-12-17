import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Eye, 
  Users, 
  Target, 
  ShoppingCart, 
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell, Tooltip } from 'recharts';

interface DashboardData {
  totalSpend: number;
  impressions: number;
  leads: number;
  diagnosticsCount: number;
  salesCount: number;
  totalRevenue: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor: 'cyan' | 'green' | 'pink';
  delay?: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const MetricCard = ({ title, value, subtitle, icon, trend, trendValue, accentColor, delay = 0 }: MetricCardProps) => {
  const glowClass = {
    cyan: 'glow-cyan border-neon-cyan/30 hover:border-neon-cyan/60',
    green: 'glow-green border-neon-green/30 hover:border-neon-green/60',
    pink: 'glow-pink border-neon-pink/30 hover:border-neon-pink/60',
  }[accentColor];

  const textGlowClass = {
    cyan: 'text-glow-cyan text-neon-cyan',
    green: 'text-glow-green text-neon-green',
    pink: 'text-glow-pink text-neon-pink',
  }[accentColor];

  const iconBgClass = {
    cyan: 'bg-neon-cyan/10 text-neon-cyan',
    green: 'bg-neon-green/10 text-neon-green',
    pink: 'bg-neon-pink/10 text-neon-pink',
  }[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`relative glass glass-border ${glowClass} p-5 overflow-hidden corner-accent glitch-hover transition-all duration-300`}
    >
      {/* Scanline effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/5 to-transparent animate-scan" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded ${iconBgClass}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${
              trend === 'up' ? 'text-neon-green' : trend === 'down' ? 'text-neon-pink' : 'text-muted-foreground'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-display">
          {title}
        </p>
        
        <p className={`text-2xl font-bold font-mono ${textGlowClass} animate-count`}>
          {value}
        </p>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {subtitle}
          </p>
        )}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-neon-cyan/20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-neon-cyan/20" />
    </motion.div>
  );
};

const FunnelVisualization = ({ data }: { data: { name: string; value: number; fill: string }[] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative glass glass-border glow-cyan p-6 corner-accent overflow-hidden"
    >
      <div className="absolute inset-0 scanlines opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded bg-neon-cyan/10">
            <BarChart3 className="w-5 h-5 text-neon-cyan" />
          </div>
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-display">
            Воронка конверсии
          </h3>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0 0% 5% / 0.95)',
                  border: '1px solid hsl(186 100% 50% / 0.3)',
                  borderRadius: '4px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [formatNumber(value), '']}
              />
              <Funnel
                dataKey="value"
                data={data}
                isAnimationActive
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList 
                  position="center" 
                  fill="#fff" 
                  stroke="none" 
                  dataKey="name"
                  style={{ fontFamily: 'Orbitron', fontSize: '11px', textTransform: 'uppercase' }}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-muted-foreground font-mono">
                {item.name}: {formatNumber(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ComputedMetricCard = ({ 
  label, 
  value, 
  isWarning, 
  description 
}: { 
  label: string; 
  value: string; 
  isWarning?: boolean; 
  description: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex items-center justify-between p-4 glass glass-border ${
        isWarning ? 'border-neon-pink/40 glow-pink' : 'border-neon-green/40'
      } rounded`}
    >
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-display mb-1">
          {label}
        </p>
        <p className="text-xs text-muted-foreground/70 font-mono">
          {description}
        </p>
      </div>
      <p className={`text-xl font-bold font-mono ${
        isWarning ? 'text-glow-pink text-neon-pink' : 'text-glow-green text-neon-green'
      }`}>
        {value}
      </p>
    </motion.div>
  );
};

export const CyberpunkDashboard = ({ 
  totalSpend = 250000,
  impressions = 1500000,
  leads = 450,
  diagnosticsCount = 120,
  salesCount = 35,
  totalRevenue = 875000,
}: Partial<DashboardData>) => {
  // Computed metrics
  const aov = salesCount > 0 ? totalRevenue / salesCount : 0;
  const cpl = leads > 0 ? totalSpend / leads : 0;
  const leadToDiagnostic = leads > 0 ? (diagnosticsCount / leads) * 100 : 0;
  const diagnosticToSale = diagnosticsCount > 0 ? (salesCount / diagnosticsCount) * 100 : 0;
  const overallConversion = leads > 0 ? (salesCount / leads) * 100 : 0;
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Determine if CPL is expensive (threshold: 1000 RUB)
  const isCplExpensive = cpl > 1000;
  const isRoiNegative = roi < 0;

  // Funnel data
  const funnelData = [
    { name: 'Показы', value: impressions, fill: 'hsl(186 100% 50%)' },
    { name: 'Лиды', value: leads, fill: 'hsl(200 100% 50%)' },
    { name: 'Диагностики', value: diagnosticsCount, fill: 'hsl(280 100% 60%)' },
    { name: 'Продажи', value: salesCount, fill: 'hsl(135 100% 50%)' },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid p-6 relative">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-pink/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-neon-cyan animate-pulse-glow" />
            <h1 className="text-3xl font-display font-bold text-glow-cyan text-neon-cyan uppercase tracking-wider">
              Analytics Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono ml-5">
            // SYSTEM STATUS: <span className="text-neon-green">ONLINE</span> | DATA SYNC: <span className="text-neon-cyan animate-flicker">ACTIVE</span>
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <MetricCard
            title="Расходы на рекламу"
            value={formatCurrency(totalSpend)}
            icon={<DollarSign className="w-5 h-5" />}
            accentColor="pink"
            delay={0.1}
          />
          <MetricCard
            title="Показы"
            value={formatNumber(impressions)}
            icon={<Eye className="w-5 h-5" />}
            trend="up"
            trendValue="+12.5%"
            accentColor="cyan"
            delay={0.15}
          />
          <MetricCard
            title="Лиды"
            value={formatNumber(leads)}
            icon={<Users className="w-5 h-5" />}
            trend="up"
            trendValue="+8.3%"
            accentColor="green"
            delay={0.2}
          />
          <MetricCard
            title="Диагностики"
            value={formatNumber(diagnosticsCount)}
            icon={<Target className="w-5 h-5" />}
            subtitle={`${formatPercent(leadToDiagnostic)} от лидов`}
            accentColor="cyan"
            delay={0.25}
          />
          <MetricCard
            title="Продажи"
            value={formatNumber(salesCount)}
            icon={<ShoppingCart className="w-5 h-5" />}
            subtitle={`${formatPercent(diagnosticToSale)} от диагностик`}
            accentColor="green"
            delay={0.3}
          />
          <MetricCard
            title="Выручка"
            value={formatCurrency(totalRevenue)}
            icon={<Activity className="w-5 h-5" />}
            trend={roi >= 0 ? 'up' : 'down'}
            trendValue={`ROI: ${roi.toFixed(1)}%`}
            accentColor={roi >= 0 ? 'green' : 'pink'}
            delay={0.35}
          />
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel */}
          <FunnelVisualization data={funnelData} />

          {/* Computed Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative glass glass-border glow-cyan p-6 corner-accent"
          >
            <div className="absolute inset-0 scanlines opacity-30" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded bg-neon-cyan/10">
                  <Zap className="w-5 h-5 text-neon-cyan" />
                </div>
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-display">
                  Вычисляемые метрики
                </h3>
              </div>

              <div className="space-y-4">
                <ComputedMetricCard
                  label="Средний чек (AOV)"
                  value={formatCurrency(aov)}
                  description="Выручка / Кол-во продаж"
                />
                
                <ComputedMetricCard
                  label="Цена лида (CPL)"
                  value={formatCurrency(cpl)}
                  isWarning={isCplExpensive}
                  description={isCplExpensive ? '⚠ Лиды дорогие!' : 'Расходы / Лиды'}
                />

                <ComputedMetricCard
                  label="Общая конверсия"
                  value={formatPercent(overallConversion)}
                  description="Лиды → Продажи"
                />

                <ComputedMetricCard
                  label="ROI"
                  value={`${roi.toFixed(1)}%`}
                  isWarning={isRoiNegative}
                  description={isRoiNegative ? '⚠ Трафик не окупается!' : 'Окупаемость инвестиций'}
                />

                <ComputedMetricCard
                  label="ROAS"
                  value={`${roas.toFixed(2)}x`}
                  isWarning={roas < 1}
                  description={`На каждый ₽1 — ₽${roas.toFixed(2)} выручки`}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer status bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex items-center justify-between text-xs text-muted-foreground font-mono glass glass-border p-3 rounded"
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              LIVE DATA
            </span>
            <span>REFRESH: 30s</span>
          </div>
          <div className="flex items-center gap-4">
            <span>v2.0.77</span>
            <span className="text-neon-cyan">CYBERPUNK_ANALYTICS™</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CyberpunkDashboard;
