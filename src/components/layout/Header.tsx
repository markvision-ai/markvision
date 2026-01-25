import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Moon, Sun, Menu, Users, Image, Loader2, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { ProjectSelector } from '@/components/dashboard/ProjectSelector';
import { supabase } from '@/lib/externalSupabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  onTabChange?: (tab: string) => void;
}

interface SearchResult {
  id: string;
  type: 'patient' | 'content';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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

        {/* Global Search - hidden on mobile */}
        <div className="relative hidden lg:block global-search-container">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  setShowResults(true);
                }
              }}
              onFocus={() => {
                if (searchQuery.length >= 3 && searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              className="pl-10 pr-10 py-2 backdrop-blur-sm bg-card/50 border border-white/10 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowResults(false);
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showResults && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-96 backdrop-blur-sm bg-card/50 border border-white/10 rounded-xl shadow-lg z-50 max-h-[400px] overflow-hidden"
              >
                <div className="overflow-y-auto max-h-[400px]">
                  {/* Пациенты */}
                  {searchResults.filter(r => r.type === 'patient').length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                        Пациенты
                      </div>
                      {searchResults
                        .filter(r => r.type === 'patient')
                        .map((result) => (
                          <button
                            key={result.id}
                            onClick={result.action}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                          >
                            {result.icon}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Контент */}
                  {searchResults.filter(r => r.type === 'content').length > 0 && (
                    <div className="p-2 border-t border-white/10">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                        Контент
                      </div>
                      {searchResults
                        .filter(r => r.type === 'content')
                        .map((result) => (
                          <button
                            key={result.id}
                            onClick={result.action}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                          >
                            {result.icon}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
