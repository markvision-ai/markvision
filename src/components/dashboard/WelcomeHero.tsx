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
    return (value / 1000000).toFixed(1).replace('.0', '') + ' млн ₸';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatNumber = (value: number): string => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return String(value);
};

const formatPercent = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  return value.toFixed(0) + '%';
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
        "relative overflow-hidden rounded-2xl p-6 md:p-8",
        "welcome-hero-gradient",
        "border border-border/30",
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header: Greeting + Status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight"
            >
              MarkVision Online. Капитан Запойнов, система готова к анализу прибыли.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-muted-foreground mt-1"
            >
              Вот как идут дела в вашем бизнесе
            </motion.p>
          </div>

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
        </div>

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
            <p className="kpi-value text-emerald-600 dark:text-emerald-400">
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
            <p className="kpi-value text-blue-600 dark:text-blue-400">
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
              "kpi-value",
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
