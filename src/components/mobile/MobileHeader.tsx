import { Menu, Bell, ChevronDown, FolderOpen } from 'lucide-react';
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
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold truncate">{title}</h1>
            {/* Project Selector for Mobile */}
            {projects.length > 0 && onProjectChange ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <FolderOpen className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{currentProject?.name || 'Выберите проект'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => onProjectChange(project.id)}
                      className={cn(
                        "cursor-pointer",
                        project.id === currentProjectId && "bg-primary/10 text-primary"
                      )}
                    >
                      <span className="truncate">{project.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : subtitle ? (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0 -mr-2">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};
