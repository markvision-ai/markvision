import { LayoutDashboard, CalendarDays, Kanban, Target, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMoreClick?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'table', label: 'Таблица', icon: CalendarDays },
  { id: 'crm', label: 'CRM', icon: Kanban },
  { id: 'utm-analytics', label: 'UTM', icon: Target },
  { id: 'more', label: 'Ещё', icon: MoreHorizontal, isMore: true },
];

export const MobileBottomNav = ({ activeTab, onTabChange, onMoreClick }: MobileBottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14">
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
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                'active:bg-muted/50',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
              <span className={cn('text-[10px]', isActive && 'font-medium')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
