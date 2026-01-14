import { LayoutDashboard, CalendarDays, Users, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMoreClick?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { id: 'table', label: 'Таблица', icon: CalendarDays },
  { id: 'crm', label: 'Пациенты', icon: Users },
  { id: 'e2e-analytics', label: 'Аналитика', icon: BarChart3 },
  { id: 'more', label: 'Ещё', icon: MoreHorizontal, isMore: true },
];

export const MobileBottomNav = ({ activeTab, onTabChange, onMoreClick }: MobileBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
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
                'active:scale-95 active:bg-muted/50',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn(
                'w-6 h-6 transition-transform',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[11px] leading-none',
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
