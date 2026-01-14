import { LayoutDashboard, Users, BarChart3, Menu, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMoreClick?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { id: 'crm', label: 'Пациенты', icon: Users },
  { id: 'e2e-analytics', label: 'Аналитика', icon: BarChart3 },
  { id: 'finance', label: 'Финансы', icon: Wallet },
  { id: 'more', label: 'Меню', icon: Menu, isMore: true },
];

export const MobileBottomNav = ({ activeTab, onTabChange, onMoreClick }: MobileBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto safe-area-bottom">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.isMore && onMoreClick) {
                  onMoreClick();
                } else {
                  onTabChange(item.id);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all touch-manipulation',
                'active:scale-95',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all',
                isActive && 'bg-primary/10'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-transform',
                  isActive && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-[10px] leading-none',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
