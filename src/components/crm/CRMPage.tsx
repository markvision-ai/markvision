import { useState, useMemo } from 'react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { KanbanBoard } from './KanbanBoard';
import { CRMFunnel } from './CRMFunnel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Kanban, 
  TrendingUp, 
  Sparkles, 
  Search, 
  Filter, 
  X,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CRMPageProps {
  projectId: string | null;
}

const tabs = ['kanban', 'funnel'] as const;
type TabValue = typeof tabs[number];

const statusOptions = [
  { id: 'new', label: 'Новая', color: 'from-blue-500 to-cyan-500' },
  { id: 'in_progress', label: 'В работе', color: 'from-yellow-500 to-orange-500' },
  { id: 'no_answer', label: 'Недозвон', color: 'from-orange-500 to-red-500' },
  { id: 'appointment', label: 'Записан', color: 'from-purple-500 to-pink-500' },
  { id: 'paid', label: 'Оплачено', color: 'from-emerald-500 to-green-500' },
  { id: 'cancelled', label: 'Отказ', color: 'from-red-500 to-rose-500' },
];

const sourceOptions = [
  { id: 'yandex', label: 'Yandex' },
  { id: 'google', label: 'Google' },
  { id: 'vk', label: 'VK' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'telegram', label: 'Telegram' },
];

export const CRMPage = ({ projectId }: CRMPageProps) => {
  const { leads, loading, refetch } = useLeads(projectId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('kanban');
  const [direction, setDirection] = useState(0);
  const isMobile = useIsMobile();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          (lead.name?.toLowerCase().includes(query)) ||
          (lead.phone?.toLowerCase().includes(query)) ||
          (lead.email?.toLowerCase().includes(query)) ||
          (lead.utm_source?.toLowerCase().includes(query)) ||
          (lead.utm_campaign?.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedStatuses.length > 0) {
        const leadStatus = lead.status || 'new';
        if (!selectedStatuses.includes(leadStatus)) return false;
      }

      // Source filter
      if (selectedSources.length > 0) {
        const leadSource = lead.utm_source?.toLowerCase();
        if (!leadSource || !selectedSources.includes(leadSource)) return false;
      }

      return true;
    });
  }, [leads, searchQuery, selectedStatuses, selectedSources]);

  const activeFiltersCount = selectedStatuses.length + selectedSources.length + (searchQuery ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedSources([]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const currentIndex = tabs.indexOf(activeTab);
    
    if (info.offset.x < -swipeThreshold && currentIndex < tabs.length - 1) {
      setDirection(1);
      setActiveTab(tabs[currentIndex + 1]);
    } else if (info.offset.x > swipeThreshold && currentIndex > 0) {
      setDirection(-1);
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleTabChange = (value: string) => {
    const newIndex = tabs.indexOf(value as TabValue);
    const currentIndex = tabs.indexOf(activeTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(value as TabValue);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  const toggleStatus = (statusId: string) => {
    setSelectedStatuses(prev => 
      prev.includes(statusId) 
        ? prev.filter(s => s !== statusId)
        : [...prev, statusId]
    );
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(s => s !== sourceId)
        : [...prev, sourceId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Ultra Premium Header */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background Glow Effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 blur-3xl opacity-30 -z-10" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-2xl">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success animate-pulse" />
            </motion.div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  CRM
                </span>
              </h2>
              <p className="text-muted-foreground text-sm hidden sm:block font-medium">
                {filteredLeads.length} из {leads.length} лидов
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="crm-card-glass border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">Обновить</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Premium Search & Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, телефону, email, источнику..."
              className="pl-12 h-12 text-base crm-card-glass border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-12 px-4 crm-card-glass border-border/50 hover:border-primary/50 transition-all rounded-xl",
                    selectedStatuses.length > 0 && "border-primary bg-primary/10"
                  )}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Статус
                  {selectedStatuses.length > 0 && (
                    <Badge className="ml-2 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 crm-card-glass border-border/50">
                <DropdownMenuLabel className="font-bold">Фильтр по статусу</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusOptions.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.id}
                    checked={selectedStatuses.includes(status.id)}
                    onCheckedChange={() => toggleStatus(status.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', status.color)} />
                      {status.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Source Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-12 px-4 crm-card-glass border-border/50 hover:border-primary/50 transition-all rounded-xl",
                    selectedSources.length > 0 && "border-accent bg-accent/10"
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Источник
                  {selectedSources.length > 0 && (
                    <Badge className="ml-2 bg-gradient-to-r from-accent to-pink-500 text-accent-foreground border-0">
                      {selectedSources.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 crm-card-glass border-border/50">
                <DropdownMenuLabel className="font-bold">Фильтр по источнику</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sourceOptions.map((source) => (
                  <DropdownMenuCheckboxItem
                    key={source.id}
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={() => toggleSource(source.id)}
                    className="cursor-pointer"
                  >
                    {source.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active Filters */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-2"
            >
              <span className="text-xs text-muted-foreground font-medium">Активные фильтры:</span>
              
              {searchQuery && (
                <Badge 
                  variant="secondary" 
                  className="bg-primary/10 text-primary border-primary/20 gap-1 cursor-pointer hover:bg-primary/20"
                  onClick={() => setSearchQuery('')}
                >
                  <Search className="w-3 h-3" />
                  "{searchQuery}"
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              
              {selectedStatuses.map(status => {
                const statusData = statusOptions.find(s => s.id === status);
                return (
                  <Badge 
                    key={status}
                    variant="secondary" 
                    className="bg-secondary/50 gap-1 cursor-pointer hover:bg-secondary"
                    onClick={() => toggleStatus(status)}
                  >
                    <div className={cn('w-2 h-2 rounded-full bg-gradient-to-r', statusData?.color)} />
                    {statusData?.label}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
              
              {selectedSources.map(source => {
                const sourceData = sourceOptions.find(s => s.id === source);
                return (
                  <Badge 
                    key={source}
                    variant="secondary" 
                    className="bg-accent/10 text-accent gap-1 cursor-pointer hover:bg-accent/20"
                    onClick={() => toggleSource(source)}
                  >
                    {sourceData?.label}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Сбросить все
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Premium Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex crm-card-glass p-1.5 gap-1 rounded-xl">
            <TabsTrigger 
              value="kanban" 
              className="gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <Kanban className="w-4 h-4" />
              <span>Канбан</span>
            </TabsTrigger>
            <TabsTrigger 
              value="funnel" 
              className="gap-2 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/80 data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg transition-all duration-300 rounded-lg"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Воронка</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Content */}
        <div className="mt-6 overflow-hidden">
          {isMobile ? (
            <PullToRefresh onRefresh={handleRefresh}>
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleSwipe}
                className="touch-pan-y"
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={activeTab}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
                  >
                    {activeTab === 'kanban' ? (
                      <KanbanBoard 
                        leads={filteredLeads} 
                        loading={loading} 
                        onRefetch={refetch}
                        projectId={projectId}
                      />
                    ) : (
                      <CRMFunnel leads={filteredLeads} loading={loading} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </PullToRefresh>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {activeTab === 'kanban' ? (
                <KanbanBoard 
                  leads={filteredLeads} 
                  loading={loading} 
                  onRefetch={refetch}
                  projectId={projectId}
                />
              ) : (
                <CRMFunnel leads={filteredLeads} loading={loading} />
              )}
            </motion.div>
          )}
        </div>

        {/* Premium Swipe indicator */}
        {isMobile && (
          <div className="flex justify-center gap-2 mt-4">
            {tabs.map((tab) => (
              <motion.div
                key={tab}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeTab === tab 
                    ? 'w-8 bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30' 
                    : 'w-1.5 bg-muted-foreground/30'
                }`}
                layoutId="tabIndicator"
              />
            ))}
          </div>
        )}
      </Tabs>

      {/* Empty State when filtered */}
      <AnimatePresence>
        {filteredLeads.length === 0 && !loading && leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Попробуйте изменить параметры поиска или фильтры
            </p>
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:border-primary/40"
            >
              Сбросить фильтры
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
