import { motion } from 'framer-motion';
import { BackgroundGradient } from './BackgroundGradient';

interface ModuleCardProps {
  number: string;
  title: string;
  description: string;
  icon: string;
  delay?: number;
}

export const ModuleCard = ({ number, title, description, icon, delay = 0 }: ModuleCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
    >
      <BackgroundGradient className="p-6 h-full" containerClassName="h-full">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {number}
              </span>
              <h3 className="font-bold text-foreground">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </BackgroundGradient>
    </motion.div>
  );
};

export default ModuleCard;
