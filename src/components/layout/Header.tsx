import { Search, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';

interface DateRange {
  from: Date;
  to: Date;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  showDatePicker?: boolean;
}

export const Header = ({ 
  title, 
  subtitle, 
  dateRange, 
  onDateRangeChange,
  showDatePicker = false 
}: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Date Range Picker */}
        {showDatePicker && dateRange && onDateRangeChange && (
          <DateRangePicker 
            dateRange={dateRange} 
            onDateRangeChange={onDateRangeChange} 
          />
        )}

        {/* Search */}
        <div className="relative hidden md:block">
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
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
      </div>
    </header>
  );
};
