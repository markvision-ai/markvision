import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  className?: string;
}

export const MobileHeader = ({ title, subtitle, onMenuClick, className }: MobileHeaderProps) => {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border md:hidden",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 -ml-2"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0 -mr-2">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
