import { Menu, Bell, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
}

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  className?: string;
  projects?: Project[];
  currentProjectId?: string | null;
  onProjectChange?: (projectId: string) => void;
}

export const MobileHeader = ({ 
  title, 
  subtitle, 
  onMenuClick, 
  className,
  projects = [],
  currentProjectId,
  onProjectChange 
}: MobileHeaderProps) => {
  const currentProject = projects.find(p => p.id === currentProjectId);
  const showProjectSelector = projects.length > 0 && onProjectChange;

  // Clean title - remove emoji prefix if present
  const cleanTitle = title.replace(/^[^\s]+\s/, '');

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border md:hidden",
      "safe-area-top",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-3">
        {/* Hamburger Menu Button - Left side */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-11 w-11 rounded-xl hover:bg-muted active:scale-95 transition-all touch-manipulation flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Открыть меню"
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Title & Project Selector - Center */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
          <h1 className="text-base font-semibold truncate max-w-[180px]">
            {cleanTitle}
          </h1>
          
          {showProjectSelector ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation">
                  <span className="truncate max-w-[140px]">
                    {currentProject?.name || 'Выберите проект'}
                  </span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => onProjectChange(project.id)}
                    className="flex items-center gap-2 min-h-[44px] touch-manipulation cursor-pointer"
                  >
                    {currentProjectId === project.id && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    <span className={cn(
                      "truncate",
                      currentProjectId !== project.id && "ml-6"
                    )}>
                      {project.name}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : subtitle ? (
            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Notification Bell - Right side */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-11 w-11 rounded-xl hover:bg-muted active:scale-95 transition-all touch-manipulation flex-shrink-0 relative"
          aria-label="Уведомления"
        >
          <Bell className="w-5 h-5" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
        </Button>
      </div>
    </header>
  );
};
