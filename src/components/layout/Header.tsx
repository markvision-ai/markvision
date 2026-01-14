import { Search, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { ProjectSelector } from '@/components/dashboard/ProjectSelector';

interface DateRange {
  from: Date;
  to: Date;
}

interface Project {
  id: string;
  name: string;
  owner_id?: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showDatePicker?: boolean;
  onMobileMenuClick?: () => void;
  // Project selector props
  projects?: Project[];
  currentProjectId?: string | null;
  onProjectChange?: (projectId: string) => void;
  onCreateProject?: (name: string) => Promise<{ id: string; name: string } | null>;
  showProjectSelector?: boolean;
}

export const Header = ({ 
  title, 
  subtitle, 
  dateRange, 
  onDateRangeChange,
  showDatePicker = false,
  onMobileMenuClick,
  projects = [],
  currentProjectId,
  onProjectChange,
  onCreateProject,
  showProjectSelector = false,
}: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 md:h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Открыть меню"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-semibold truncate">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>}
        </div>

        {/* Project Selector - shown after title */}
        {showProjectSelector && onProjectChange && (
          <div className="hidden md:block ml-4">
            <ProjectSelector
              projects={projects}
              currentProjectId={currentProjectId || null}
              onProjectChange={onProjectChange}
              onCreateProject={onCreateProject}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Date Range Picker */}
        {showDatePicker && dateRange && onDateRangeChange && (
          <div className="hidden sm:block">
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={onDateRangeChange} 
            />
          </div>
        )}

        {/* Search - hidden on mobile */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск..."
            className="pl-10 pr-4 py-2 bg-secondary border-0 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <Moon className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>

        {/* Notifications */}
        <NotificationsDropdown />
      </div>
    </header>
  );
};
