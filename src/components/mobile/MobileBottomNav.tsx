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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/[0.02] backdrop-blur-2xl border-t border-white/[0.06] md:hidden safe-area-bottom shadow-[0_-1px_0_rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (item.isMore && !['dashboard', 'crm', 'e2e-analytics', 'finance'].includes(activeTab));
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
                'flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-all touch-manipulation',
                'active:scale-95 min-h-[56px]',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl transition-all duration-300',
                isActive && 'bg-primary/15 shadow-[0_0_20px_hsl(192_100%_50%/0.2)]'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-transform',
                  isActive && 'scale-110'
                )} />
              </div>
              <span className={cn(
                'text-[10px] leading-none font-medium',
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
