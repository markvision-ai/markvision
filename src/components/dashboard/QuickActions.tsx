import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GradientButton } from '@/components/ui/GradientButton';
import {
  Users,
  BarChart3,
  Video,
  Megaphone,
} from 'lucide-react';

interface QuickActionsProps {
  onTabChange: (tab: string) => void;
  userName?: string | null;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const QuickActions = ({ onTabChange, userName, className }: QuickActionsProps) => {
  const displayName = userName || 'Пользователь';

  return (
    <div className={cn("space-y-4", className)}>
      {/* Welcome Text */}
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          MarkVision Online
        </h2>
        <p className="text-white/60 text-base md:text-lg">
          Добро пожаловать, {displayName}
        </p>
      </div>

      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
        БЫСТРЫЙ ДОСТУП
      </h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
      >
        <GradientButton
          icon={<Users className="w-5 h-5" />}
          onClick={() => onTabChange('crm')}
          gradient="blue"
        >
          CRM
        </GradientButton>

        <GradientButton
          icon={<Megaphone className="w-5 h-5" />}
          onClick={() => onTabChange('quantom-ads')}
          gradient="purple"
        >
          Управление рекламой
        </GradientButton>

        <GradientButton
          icon={<Video className="w-5 h-5" />}
          onClick={() => onTabChange('factory')}
          gradient="emerald"
        >
          Контент-Завод
        </GradientButton>
      </motion.div>
    </div>
  );
};

export default QuickActions;
