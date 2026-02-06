import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Users,
  Megaphone,
  Video,
  BarChart3,
  Wallet,
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

interface QuickActionsProps {
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
    label: 'Контент',
    icon: Video,
    tab: 'factory',
    description: 'Креативы',
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const QuickActions = ({ onTabChange, className }: QuickActionsProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Быстрый доступ
        </h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 sm:grid-cols-6 gap-2 md:gap-3"
      >
        {defaultActions.map((action) => {
          const Icon = action.icon;

          return (
            <motion.button
              key={action.tab}
              variants={itemVariants}
              onClick={() => onTabChange(action.tab)}
              className="quick-action-card group"
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
      </motion.div>
    </div>
  );
};

export default QuickActions;
