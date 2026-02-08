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

export const QuickActions = ({ onTabChange, className }: QuickActionsProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
        Управление рекламой
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
