import { useState, useMemo, useCallback } from 'react';
import { useLeads, Lead } from '@/hooks/useLeads';
import { KanbanBoard } from './KanbanBoard';
import { LeadFullPage } from './LeadFullPage';
import { CRMFunnel } from './CRMFunnel';
import { BulkActionsBar } from './BulkActionsBar';
import { AddLeadDialog } from './AddLeadDialog';
import { AutomationPanel } from './AutomationPanel';
import { ClientsManagement } from '@/components/clients/ClientsManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Kanban,
  TrendingUp,
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Zap,
  CheckSquare,
  Calendar,
  Users,
  Bot,
  ArrowUpDown,
  Sparkles,
  Target
} from 'lucide-react';
import { subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CRMPageProps {
  projectId: string | null;
}

const tabs = ['kanban', 'clients', 'funnel', 'automation'] as const;
type TabValue = typeof tabs[number];

const statusOptions = [
  { id: 'Новый лид', label: 'Новый лид', color: 'from-blue-500 to-cyan-500' },
  { id: 'Без ответа', label: 'Без ответа', color: 'from-orange-500 to-red-500' },
  { id: 'В работе', label: 'В работе', color: 'from-yellow-500 to-orange-500' },
  { id: 'Счет выставлен', label: 'Счет выставлен', color: 'from-indigo-500 to-purple-500' },
  { id: 'Записан', label: 'Записан', color: 'from-purple-500 to-pink-500' },
  { id: 'Оплачен', label: 'Оплачен', color: 'from-blue-500 to-green-500' },
  { id: 'Отказ', label: 'Отказ', color: 'from-red-500 to-rose-500' },
];

const sourceOptions = [
  { id: 'yandex', label: 'Yandex' },
  { id: 'google', label: 'Google' },
  { id: 'vk', label: 'VK' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'manual', label: 'Ручной ввод' },
  { id: 'website', label: 'Сайт' },
  { id: 'referral', label: 'Рекомендация' },
];

const datePresets = [
  { id: 'today', label: 'Сегодня', days: 0 },
  { id: 'yesterday', label: 'Вчера', days: 1 },
  { id: 'week', label: 'Неделя', days: 7 },
  { id: 'month', label: 'Месяц', days: 30 },
  { id: 'quarter', label: 'Квартал', days: 90 },
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
  const [selectedDatePreset, setSelectedDatePreset] = useState<string | null>(null);
  const [sortByLtv, setSortByLtv] = useState<'desc' | 'asc' | null>(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      // Guard clause: skip leads that are null/undefined or missing critical fields
      if (!lead || !lead.created_at) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (lead.name?.toLowerCase().includes(query)) ||
          (lead.phone?.toLowerCase().includes(query)) ||
          (lead.utm_source?.toLowerCase().includes(query)) ||
          (lead.utm_campaign?.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      if (selectedStatuses.length > 0) {
        const leadStatus = lead.status || 'Новый лид';
        if (!selectedStatuses.includes(leadStatus)) return false;
      }

      if (selectedSources.length > 0) {
        const leadSource = lead.utm_source?.toLowerCase();
        if (!leadSource || !selectedSources.includes(leadSource)) return false;
      }

      // Date filter
      if (selectedDatePreset) {
        const preset = datePresets.find(p => p.id === selectedDatePreset);
        if (preset) {
          const leadDate = new Date(lead.created_at);
          const today = new Date();

          if (preset.id === 'today') {
            const start = startOfDay(today);
            const end = endOfDay(today);
            if (isBefore(leadDate, start) || isAfter(leadDate, end)) return false;
          } else if (preset.id === 'yesterday') {
            const yesterday = subDays(today, 1);
            const start = startOfDay(yesterday);
            const end = endOfDay(yesterday);
            if (isBefore(leadDate, start) || isAfter(leadDate, end)) return false;
          } else {
            const startDate = startOfDay(subDays(today, preset.days));
            if (isBefore(leadDate, startDate)) return false;
          }
        }
      }

      return true;
    });

    // Sort by LTV if enabled
    if (sortByLtv) {
      result = [...result].sort((a, b) => {
        const ltvA = a.ltv || 0;
        const ltvB = b.ltv || 0;
        return sortByLtv === 'desc' ? ltvB - ltvA : ltvA - ltvB;
      });
    }

    return result;
  }, [leads, searchQuery, selectedStatuses, selectedSources, selectedDatePreset, sortByLtv]);

  const activeFiltersCount = selectedStatuses.length + selectedSources.length + (searchQuery ? 1 : 0) + (selectedDatePreset ? 1 : 0) + (sortByLtv ? 1 : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedSources([]);
    setSelectedDatePreset(null);
    setSortByLtv(null);
  };

  const toggleLtvSort = () => {
    setSortByLtv(prev => {
      if (prev === null) return 'desc';
      if (prev === 'desc') return 'asc';
      return null;
    });
  };

  const toggleDatePreset = (presetId: string) => {
    setSelectedDatePreset(prev => prev === presetId ? null : presetId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleSwipe = (_evt: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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

  // Selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedLeads(new Set());
  };

  const handleSelectLead = useCallback((leadId: string, selected: boolean) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(leadId);
      } else {
        next.delete(leadId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedLeads(new Set());
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;

    setIsBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', Array.from(selectedLeads));

      if (error) throw error;

      toast.success(`Удалено ${selectedLeads.size} лидов`);
      setSelectedLeads(new Set());
      setSelectionMode(false);
      refetch();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Ошибка удаления лидов');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedLeads.size === 0) return;

    setIsBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        } as any)
        .in('id', Array.from(selectedLeads));

      if (error) throw error;

      toast.success(`Статус обновлен для ${selectedLeads.size} лидов`);
      setSelectedLeads(new Set());
      refetch();
    } catch (error) {
      console.error('Error updating leads:', error);
      toast.error('Ошибка обновления статуса');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getSelectedLeadsData = () => {
    return filteredLeads.filter(lead => selectedLeads.has(lead.id));
  };

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleCloseLead = () => {
    setSelectedLead(null);
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground">
        Выберите проект, чтобы открыть CRM.
      </div>
    );
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />

      {/* Header — чёткий блок с неоновым свечением */}
      <motion.div
        className="relative rounded-[2rem] bg-[#020617]/40 backdrop-blur-3xl border border-white/5 shadow-interstellar p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-accent/40 rounded-[1.2rem] blur-xl opacity-50" />
            <div className="relative w-16 h-16 rounded-[1.2rem] bg-gradient-to-br from-[#020617] to-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60">
              CRM <span className="text-primary italic">SYSTEM</span>
            </h2>
            <p className="font-medium text-xs uppercase tracking-[0.2em] text-white/40 flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              АКТИВНЫЕ ЛИДЫ: <span className="text-white/80">{filteredLeads.length}</span> ИЗ {leads.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-none relative z-10 w-full md:w-auto">
          {projectId && (
            <AddLeadDialog
              projectId={projectId}
              onLeadAdded={refetch}
              onDuplicateFound={handleLeadClick}
            />
          )}
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
            className={cn(
              "h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all border-white/10 bg-white/5 hover:bg-white/10 text-white",
              selectionMode && "bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-primary/90"
            )}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            <span>{selectionMode ? 'ЗАВЕРШИТЬ' : 'ВЫБРАТЬ'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-12 w-12 rounded-xl flex items-center justify-center border-white/10 bg-white/5 hover:bg-white/10 text-white p-0 flex-shrink-0"
          >
            <RefreshCw className={cn("w-4 h-4 text-white/70", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectionMode && (
          <BulkActionsBar
            selectedCount={selectedLeads.size}
            totalCount={filteredLeads.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onDelete={handleBulkDelete}
            onStatusChange={handleBulkStatusChange}
            selectedLeads={getSelectedLeadsData()}
            isLoading={isBulkUpdating}
          />
        )}
      </AnimatePresence>

      {/* Premium Search & Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-3"
      >
        {/* Quick Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (searchQuery === 'hot') {
                setSearchQuery('');
              } else {
                setSortByLtv('desc');
                toast.info('Показаны самые перспективные лиды');
              }
            }}
            className={cn(
              "rounded-full h-8 px-4 text-xs font-medium border-dashed border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300",
              sortByLtv === 'desc' && "bg-amber-500/10 border-solid border-amber-500 text-amber-300"
            )}
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            Горячие лиды
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const todayPreset = datePresets.find(p => p.id === 'today');
              if (selectedDatePreset === 'today') {
                setSelectedDatePreset(null);
              } else {
                setSelectedDatePreset('today');
                toast.info('Показаны лиды за сегодня');
              }
            }}
            className={cn(
              "rounded-full h-8 px-4 text-xs font-medium border-dashed border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300",
              selectedDatePreset === 'today' && "bg-blue-500/10 border-solid border-blue-500 text-blue-300"
            )}
          >
            <Zap className="w-3 h-3 mr-1.5" />
            Новые сегодня
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Toggle 'new' status filter
              if (selectedStatuses.includes('new') && selectedStatuses.length === 1) {
                setSelectedStatuses([]);
              } else {
                setSelectedStatuses(['new']);
                toast.info('Показаны только новые лиды');
              }
            }}
            className={cn(
              "rounded-full h-8 px-4 text-xs font-medium border-dashed border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300",
              selectedStatuses.includes('new') && selectedStatuses.length === 1 && "bg-blue-500/10 border-solid border-blue-500 text-blue-300"
            )}
          >
            <Target className="w-3 h-3 mr-1.5" />
            Только новые
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, телефону, источнику..."
              className="pl-12 h-12 text-base bg-white/5 border-white/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 px-4 bg-white/5 border-white/50 hover:border-primary/50 transition-all rounded-xl",
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
              <DropdownMenuContent align="end" className="w-56 bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50">
                <DropdownMenuLabel className="font-semibold">Фильтр по статусу</DropdownMenuLabel>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 px-4 bg-white/5 border-white/50 hover:border-primary/50 transition-all rounded-xl",
                    selectedSources.length > 0 && "border-primary bg-primary/10"
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
              <DropdownMenuContent align="end" className="w-56 bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50">
                <DropdownMenuLabel className="font-semibold">Фильтр по источнику</DropdownMenuLabel>
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

            {/* Date Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 px-4 bg-white/5 border-white/50 hover:border-primary/50 transition-all rounded-xl",
                    selectedDatePreset && "border-blue-500 bg-blue-500/10"
                  )}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Дата</span>
                  {selectedDatePreset && (
                    <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-green-500 text-white border-0">
                      {datePresets.find(p => p.id === selectedDatePreset)?.label}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50">
                <DropdownMenuLabel className="font-semibold">Фильтр по дате</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {datePresets.map((preset) => (
                  <DropdownMenuCheckboxItem
                    key={preset.id}
                    checked={selectedDatePreset === preset.id}
                    onCheckedChange={() => toggleDatePreset(preset.id)}
                    className="cursor-pointer"
                  >
                    {preset.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  onClick={toggleLtvSort}
                  className={cn(
                    "h-12 px-5 bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all rounded-xl text-white font-medium",
                    sortByLtv && "border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  )}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2 text-white/50" />
                  <span className="hidden sm:inline">LTV</span>
                  {sortByLtv && (
                    <Badge className="ml-2 bg-gradient-to-r from-primary to-[#955251] text-white border-0 shadow-sm">
                      {sortByLtv === 'desc' ? '↓' : '↑'}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
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

              {selectedDatePreset && (
                <Badge
                  variant="secondary"
                  className="bg-blue-500/10 text-blue-600 gap-1 cursor-pointer hover:bg-blue-500/20"
                  onClick={() => setSelectedDatePreset(null)}
                >
                  <Calendar className="w-3 h-3" />
                  {datePresets.find(p => p.id === selectedDatePreset)?.label}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

              {sortByLtv && (
                <Badge
                  variant="secondary"
                  className="bg-amber-500/10 text-amber-600 gap-1 cursor-pointer hover:bg-amber-500/20"
                  onClick={() => setSortByLtv(null)}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  LTV {sortByLtv === 'desc' ? '(убыв.)' : '(возр.)'}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

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

      {/* Premium Segmented Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center sm:justify-start"
        >
          <TabsList className="w-full sm:w-auto flex p-1.5 gap-2 rounded-2xl bg-[#020617]/60 backdrop-blur-xl border border-white/5">
            <TabsTrigger
              value="kanban"
              className="gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl border-0 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-interstellar data-[state=inactive]:text-white/40 hover:text-white/80"
            >
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">КАНБАН</span>
            </TabsTrigger>

            <TabsTrigger
              value="clients"
              className="gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl border-0 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-interstellar data-[state=inactive]:text-white/40 hover:text-white/80"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">БАЗА КЛИЕНТОВ</span>
            </TabsTrigger>
            <TabsTrigger
              value="funnel"
              className="gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl border-0 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-interstellar data-[state=inactive]:text-white/40 hover:text-white/80"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">ВОРОНКА</span>
            </TabsTrigger>
            <TabsTrigger
              value="automation"
              className="gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl border-0 data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-interstellar data-[state=inactive]:text-white/40 hover:text-white/80"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI АГЕНТЫ</span>
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
                        selectionMode={selectionMode}
                        selectedLeads={selectedLeads}
                        onSelectLead={handleSelectLead}

                      />
                    ) : activeTab === 'clients' ? (
                      <ClientsManagement projectId={projectId} />
                    ) : activeTab === 'automation' ? (
                      <AutomationPanel projectId={projectId} />
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
                  selectionMode={selectionMode}
                  selectedLeads={selectedLeads}
                  onSelectLead={handleSelectLead}
                  onLeadClick={handleLeadClick}

                />
              ) : activeTab === 'clients' ? (
                <ClientsManagement projectId={projectId} />
              ) : activeTab === 'automation' ? (
                <AutomationPanel projectId={projectId} />
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
                className={`h-1.5 rounded-full transition-all duration-300 ${activeTab === tab
                  ? 'w-8 bg-gradient-to-r from-primary to-accent shadow-2xl shadow-blue-900/5 shadow-primary/30'
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Ничего не найдено</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Измените поиск или фильтры
            </p>
            <Button variant="outline" onClick={clearAllFilters} className="rounded-xl">
              Сбросить фильтры
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Lead Modal */}
      <AnimatePresence>
        {selectedLead && (
          <LeadFullPage
            lead={selectedLead}
            projectId={projectId}
            onClose={handleCloseLead}
            onUpdate={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
