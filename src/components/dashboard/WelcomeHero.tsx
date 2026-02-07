import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, Users, Wallet, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface WelcomeHeroProps {
  userName: string | null;
  keyMetrics: {
    revenue: number;
    leads: number;
    romi: number | null;
  };
  systemStatus: 'healthy' | 'warning' | 'error';
  className?: string;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 17) return 'Добрый день';
  if (hour >= 17 && hour < 22) return 'Добрый вечер';
  return 'Доброй ночи';
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    const m = value / 1000000;
    return (m % 1 === 0 ? String(Math.round(m)) : m.toFixed(1).replace('.0', '')) + ' млн ₸';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatNumber = (value: number): string => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return String(Math.round(value));
};

const formatPercent = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  return Math.round(value) + '%';
};

export const WelcomeHero = ({
  userName,
  keyMetrics,
  systemStatus,
  className
}: WelcomeHeroProps) => {
  const greeting = getGreeting();
  const displayName = userName || 'Пользователь';

  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      label: 'Система работает',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      label: 'Есть предупреждения',
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      label: 'Требуется внимание',
    },
  };

  const status = statusConfig[systemStatus];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 md:p-8 interstellar-card",
        "border-0",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold interstellar-gradient-text mb-1">
          MarkVision Online
        </h2>
        <p className="text-muted-foreground text-base md:text-lg mb-4">
          Добро пожаловать, {displayName}
        </p>

        {/* System Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full",
              status.bg
            )}
          >
            <StatusIcon className={cn("w-4 h-4", status.color)} />
            <span className={cn("text-sm font-medium", status.color)}>
              {status.label}
            </span>
          </motion.div>
        <div className="mb-4" />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="welcome-hero-kpi"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="kpi-label">Выручка</span>
            </div>
            <p className="kpi-value text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrency(keyMetrics.revenue)}
            </p>
          </motion.div>

          {/* Leads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="welcome-hero-kpi"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <span className="kpi-label">Лиды</span>
            </div>
            <p className="kpi-value text-blue-600 dark:text-blue-400 font-mono">
              {formatNumber(keyMetrics.leads)}
            </p>
          </motion.div>

          {/* ROMI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="welcome-hero-kpi"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <span className="kpi-label">ROMI</span>
            </div>
            <p className={cn(
              "kpi-value font-mono",
              keyMetrics.romi !== null && keyMetrics.romi > 0
                ? "text-purple-600 dark:text-purple-400"
                : "text-muted-foreground"
            )}>
              {formatPercent(keyMetrics.romi)}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeHero;
