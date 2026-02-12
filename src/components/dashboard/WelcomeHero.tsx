import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Megaphone,
  Video,
  BarChart3,
  FileText,
  LucideIcon
} from 'lucide-react';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  tab: string;
  description: string;
  color: string;
}

interface WelcomeHeroProps {
  projectName: string | null;
  keyMetrics: {
    revenue: number;
    expenses: number;
    romi: number | null;
  };
  systemStatus: 'healthy' | 'warning' | 'error';
  onTabChange: (tab: string) => void;
  className?: string;
}

const defaultActions: QuickAction[] = [
  {
    label: 'CRM',
    icon: Users,
    tab: 'crm',
    description: 'Клиенты и сделки',
    color: 'text-blue-500 bg-blue-500/10 group-hover:bg-blue-500/20'
  },
  {
    label: 'Реклама',
    icon: Megaphone,
    tab: 'quantom-ads',
    description: 'Кампании',
    color: 'text-purple-500 bg-purple-500/10 group-hover:bg-purple-500/20'
  },
  {
    label: 'Контент-Завод',
    icon: Video,
    tab: 'factory',
    description: 'Создание контента',
    color: 'text-pink-500 bg-pink-500/10 group-hover:bg-pink-500/20'
  },
  {
    label: 'Аналитика',
    icon: BarChart3,
    tab: 'e2e-analytics',
    description: 'Сквозная',
    color: 'text-cyan-500 bg-cyan-500/10 group-hover:bg-cyan-500/20'
  },
  {
    label: 'Финансы',
    icon: Wallet,
    tab: 'finance',
    description: 'Прибыль',
    color: 'text-emerald-500 bg-emerald-500/10 group-hover:bg-emerald-500/20'
  },
  {
    label: 'Отчёты',
    icon: FileText,
    tab: 'reports',
    description: 'Генератор',
    color: 'text-amber-500 bg-amber-500/10 group-hover:bg-amber-500/20'
  },
];

const getGreeting = (name: string): string => {
  const hour = new Date().getHours();
  let timeGreeting = 'Доброй ночи';
  if (hour >= 5 && hour < 12) timeGreeting = 'Доброе утро';
  else if (hour >= 12 && hour < 17) timeGreeting = 'Добрый день';
  else if (hour >= 17 && hour < 22) timeGreeting = 'Добрый вечер';

  return `${timeGreeting}, ${name}`;
};

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    const m = value / 1000000;
    return (m % 1 === 0 ? String(Math.round(m)) : m.toFixed(1).replace('.0', '')) + ' млн ₸';
  }
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatPercent = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  return Math.round(value) + '%';
};

export const WelcomeHero = ({
  projectName,
  keyMetrics,
  systemStatus,
  onTabChange,
  className
}: WelcomeHeroProps) => {
  const displayName = projectName || 'Проект';
  const greeting = getGreeting(displayName);

  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      label: 'Все системы онлайн',
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

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
          {greeting}
        </p>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full w-fit mb-6",
            status.bg
          )}
        >
          <StatusIcon className={cn("w-4 h-4", status.color)} />
          <span className={cn("text-sm font-medium", status.color)}>
            {status.label}
          </span>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

          {/* Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="welcome-hero-kpi"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-red-500" />
              </div>
              <span className="kpi-label">Расходы</span>
            </div>
            <p className="kpi-value text-red-600 dark:text-red-400 font-mono">
              {formatCurrency(keyMetrics.expenses)}
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

        {/* Separator */}
        <div className="h-px w-full bg-border/50 mb-6" />

        {/* Quick Actions Header */}
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Быстрый доступ
        </h3>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3">
          {defaultActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.button
                key={action.tab}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 + (index * 0.05) }}
                onClick={() => onTabChange(action.tab)}
                className="quick-action-card group interstellar-glow bg-background/50 hover:bg-background/80 border border-border/50"
              >
                <div className={cn(
                  "action-icon transition-all duration-200",
                  action.color.split(' ').slice(1).join(' ')
                )}>
                  <Icon className={cn("w-5 h-5 md:w-6 md:h-6", action.color.split(' ')[0])} />
                </div>
                <span className="action-label">{action.label}</span>
                <span className="text-[10px] text-muted-foreground/60 hidden md:block">
                  {action.description}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeHero;
