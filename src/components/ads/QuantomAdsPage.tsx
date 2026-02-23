import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { useContentFactory } from '@/hooks/useContentFactory';
import { useProjectData } from '@/hooks/useProjectData';
import { useAdPerformance } from '@/hooks/useAdPerformance';
import { AdsSummaryCards } from './AdsSummaryCards';
import { CampaignFunnelChart } from './CampaignFunnelChart';
import { AIStatusIndicator } from './AIStatusIndicator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdsChatInterface } from './AdsChatInterface';
import { ActiveAdsManager } from './ActiveAdsManager';
import { RefreshCw, Loader2, Zap, Activity, LayoutDashboard, MessageSquareText, CalendarDays, ChevronDown } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange, DayPicker } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { KZT_RATE } from '@/constants/ads';

interface QuantomAdsPageProps {
  projectId: string | null;
}

export const QuantomAdsPage = ({ projectId }: QuantomAdsPageProps) => {
  const { campaigns, loading, refetch } = useCampaigns(projectId);
  const { leads } = useLeads(projectId);
  const { content } = useContentFactory(projectId);
  const { dailyData, refetch: refetchProjectData } = useProjectData(projectId);
  const [refreshing, setRefreshing] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [metaOnline, setMetaOnline] = useState<boolean | null>(null);
  const [metaStatusMessage, setMetaStatusMessage] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [activePreset, setActivePreset] = useState<string>('today');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setDatePickerOpen(false);
      }
    };
    if (datePickerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [datePickerOpen]);

  // Preset definitions
  const presets = useMemo(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    return [
      { key: 'today', label: 'Сегодня', from: today, to: today },
      { key: 'yesterday', label: 'Вчера', from: yesterday, to: yesterday },
      { key: '7days', label: '7 дней', from: subDays(today, 6), to: today },
      { key: 'this_month', label: 'Этот месяц', from: startOfMonth(today), to: today },
      { key: 'last_month', label: 'Прошлый месяц', from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) },
      { key: 'maximum', label: 'Максимум', from: subDays(today, 365), to: today },
    ];
  }, []);

  const currentPresetLabel = useMemo(() => {
    const p = presets.find(p => p.key === activePreset);
    return p?.label || 'Период';
  }, [activePreset, presets]);

  const applyPreset = useCallback((key: string) => {
    const p = presets.find(pr => pr.key === key);
    if (p) {
      setDateRange({ from: p.from, to: p.to });
      setActivePreset(key);
      setDatePickerOpen(false);
    }
  }, [presets]);

  const applyCustomRange = useCallback((range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange(range);
      setActivePreset('custom');
    }
  }, []);

  const dateButtonLabel = useMemo(() => {
    if (!dateRange?.from) return 'Выберите период';
    const fromStr = format(dateRange.from, 'd MMM yyyy г.', { locale: ru });
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return `${currentPresetLabel}: ${fromStr}`;
    }
    const toStr = format(dateRange.to, 'd MMM yyyy г.', { locale: ru });
    return `${fromStr} — ${toStr}`;
  }, [dateRange, currentPresetLabel]);
  const adRange = useMemo(() => {
    if (!dateRange?.from) return undefined;
    return { from: dateRange.from, to: dateRange.to ?? dateRange.from };
  }, [dateRange]);

  const { performanceLogs, refetch: refetchAds } = useAdPerformance(projectId, adRange);

  // Auto-refresh data every 60 seconds - DISABLED to prevent Rate Limits
  useEffect(() => {
    // Disabled auto-refresh as per user request to avoid Meta API 400 errors
    return () => { };
  }, []);

  // Load Autopilot Status
  useEffect(() => {
    if (!projectId) return;
    // Temporary disable due to missing table
    /*
    const fetchSettings = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('project_settings')
          .select('autopilot_enabled')
          .eq('project_id', projectId)
          .single();
        
        if (data) {
          setAutopilotEnabled(data.autopilot_enabled);
        }
      } catch (e) {
        console.error('Failed to load project settings', e);
      }
    };
    fetchSettings();
    */
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setMetaOnline(null);
      return;
    }
    // Healthcheck disabled to prevent background API calls
    setMetaOnline(true);
    setMetaStatusMessage(null);
  }, [projectId]);

  const toggleAutopilot = async (enabled: boolean) => {
    if (!projectId) return;
    // Temporary disable due to missing table
    toast.info('Функция ИИ-Автопилота временно недоступна (обновление системы)');
    /*
    setAutopilotEnabled(enabled);
    try {
      const { error } = await (supabase as any)
        .from('project_settings')
        .upsert({ project_id: projectId, autopilot_enabled: enabled }, { onConflict: 'project_id' });
      
      if (error) throw error;
      toast.success(enabled ? 'ИИ-Автопилот включен' : 'ИИ-Автопилот выключен');
    } catch (e) {
      console.error('Failed to update autopilot', e);
      toast.error('Ошибка сохранения настроек');
      setAutopilotEnabled(!enabled);
    }
    */
  };

  // Derive campaigns from leads if they don't exist in the explicit campaigns list
  const allCampaigns = useMemo(() => {
    const existingNames = new Set(campaigns.map(c => c.name));
    const derived: any[] = [];

    leads.forEach(lead => {
      if (lead.utm_campaign && !existingNames.has(lead.utm_campaign)) {
        existingNames.add(lead.utm_campaign);
        derived.push({
          id: `derived-${lead.utm_campaign}`,
          project_id: projectId || '',
          name: lead.utm_campaign,
          platform: lead.utm_source?.includes('google') ? 'google' : lead.utm_source?.includes('tiktok') ? 'tiktok' : 'facebook',
          status: true,
          budget: 0,
          spent_today: 0,
          autopilot_enabled: false,
          rules: {},
          ai_log: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    return [...campaigns, ...derived];
  }, [campaigns, leads, projectId]);

  // Filter campaigns (Meta Only)
  const metaCampaigns = useMemo(() => {
    return allCampaigns.filter(c => c.platform === 'facebook' || c.platform === 'instagram' || !c.platform);
  }, [allCampaigns]);

  // Calculate leads per campaign based on utm_campaign matching
  const leadsPerCampaign = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.utm_campaign) {
        counts[lead.utm_campaign] = (counts[lead.utm_campaign] || 0) + 1;
      }
    });
    return counts;
  }, [leads]);

  // Calculate revenue from paid leads per campaign
  const revenuePerCampaign = useMemo(() => {
    const revenue: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.utm_campaign && lead.status === 'paid' && lead.deal_amount) {
        revenue[lead.utm_campaign] = (revenue[lead.utm_campaign] || 0) + (lead.deal_amount || 0);
      }
    });
    return revenue;
  }, [leads]);

  // Summary calculations
  const summaryMetrics = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const fromStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
    const toStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;

    // Default to strict ranges
    const fromDate = fromStr || '0000-01-01';
    const toDate = toStr || '9999-12-31';

    // 1. Calculate History Stats from Daily Data (Official Source)
    // Exclude Today from daily data aggregation to use real-time logs for today
    const dailyDataList = Object.values(dailyData);
    const historyStats = dailyDataList.filter(d => d.date >= fromDate && d.date <= toDate && d.date !== todayStr);

    const historySpent = historyStats.reduce((sum, d) => sum + (d.spend || 0), 0);
    const historyLeads = historyStats.reduce((sum, d) => sum + (d.leads || 0), 0);

    // 2. Calculate Today Stats (Real-time from Active Ads Manager / Performance Logs)
    let todaySpent = 0;
    let todayLeads = 0;

    // Only calculate today's stats if the date range includes today
    if (fromDate <= todayStr && toDate >= todayStr) {
      // Fallback to Performance Logs (Real-time Meta)
      const todayLogs = performanceLogs.filter(log =>
        log.date_start === todayStr &&
        (log.entity_type === 'CAMPAIGN' || log.entity_type === 'campaign')
      );

      // Deduplicate by entity_id: take the record with MAX spend (assuming cumulative snapshots)
      // This prevents double counting if multiple logs exist for the same campaign today
      const uniqueTodayCampaigns = Object.values(
        todayLogs.reduce((acc, log) => {
          const currentSpend = Number(log.spend) || 0;
          const existingSpend = acc[log.entity_id] ? (Number(acc[log.entity_id].spend) || 0) : -1;

          if (!acc[log.entity_id] || currentSpend > existingSpend) {
            acc[log.entity_id] = log;
          }
          return acc;
        }, {} as Record<string, typeof todayLogs[0]>)
      );

      // Convert USD spend to KZT if needed, assuming logs are in USD (Meta default)
      // ActiveAdsManager uses KZT_RATE. We should do the same.
      todaySpent = uniqueTodayCampaigns.reduce((sum, log) => sum + ((Number(log.spend) || 0) * KZT_RATE), 0);
      todayLeads = uniqueTodayCampaigns.reduce((sum, log) => sum + (Number(log.leads) || 0), 0);
    }

    const totalSpent = historySpent + todaySpent;

    // Revenue from CRM (Attributed Only - for valid ROMI)
    const crmLeadsInRange = leads.filter(lead => {
      if (!lead.created_at) return false;
      const d = format(new Date(lead.created_at), 'yyyy-MM-dd');
      return d >= fromDate && d <= toDate;
    });

    const attributedCrmLeads = crmLeadsInRange.filter(l => l.utm_campaign);
    const rawMetaLeads = historyLeads + todayLeads;

    // CONSISTENCY RULE: Use MAX(Meta Leads, CRM Attributed Leads) to match Table/Funnel
    const totalLeads = Math.max(rawMetaLeads, attributedCrmLeads.length);

    const totalRevenue = attributedCrmLeads
      .filter(l => l.status === 'paid' && l.deal_amount)
      .reduce((sum, l) => sum + (l.deal_amount || 0), 0);

    return {
      totalSpent,
      totalLeads,
      avgCpl: totalLeads > 0 ? totalSpent / totalLeads : 0,
      romi: totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0,
    };
  }, [performanceLogs, leads, dailyData, dateRange]);

  const handleRefresh = async () => {
    setRefreshing(true);

    // 1. Force Sync with Meta (Edge Function)
    if (projectId) {
      try {
        const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : fromDate;

        const { data: syncData, error: syncError } = await supabase.functions.invoke('ads-manager', {
          body: {
            action: 'sync_metrics',
            payload: {
              projectId,
              date_range: { since: fromDate, until: toDate }
            }
          }
        });

        if (syncError) throw syncError;
        if (syncData?.type === 'error') {
          console.error('Meta Sync Error:', syncData.message);
          if (syncData.message?.includes('(#80004)')) {
            toast.warning('Meta API: Превышен лимит запросов. Используем локальные данные.');
          } else {
            toast.warning(`Ошибка синхронизации с Meta: ${syncData.message}`);
          }
        } else {
          toast.success(`Данные Meta Ads обновлены (${fromDate} - ${toDate})`);
        }
      } catch (e: any) {
        console.error('Sync failed', e);
        // Don't block refresh if sync fails (e.g. rate limit)
      }
    }

    // 2. Refresh local data (UI Update)
    // Increment trigger to force ActiveAdsManager refresh
    setRefreshTrigger(prev => prev + 1);

    await Promise.all([
      refetch(),
      refetchProjectData(),
      refetchAds()
    ]);

    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-background text-foreground relative flex flex-col overflow-hidden">
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-none flex items-center justify-between z-20">
          <TabsList className="grid w-[320px] grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Командный центр
            </TabsTrigger>
            <TabsTrigger value="analyst" className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" />
              AI Аналитик
            </TabsTrigger>
          </TabsList>

          {/* Minimal Status Indicators */}
          <div className="flex items-center gap-4">
            {autopilotEnabled && (
              <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold uppercase tracking-wider animate-pulse border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-full">
                <Activity className="w-3 h-3" />
                Автопилот активен
              </div>
            )}
            <div
              title={metaStatusMessage || (metaOnline ? 'Connected to Meta Graph API' : 'Connection Lost')}
              className={cn(
                "flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all",
                metaOnline === null ? 'text-muted-foreground border-border bg-muted/50' :
                  metaOnline ? 'text-emerald-600 border-emerald-200 bg-emerald-50' :
                    'text-red-600 border-red-200 bg-red-50'
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                metaOnline ? 'bg-emerald-500' : metaOnline === false ? 'bg-red-500' : 'bg-muted-foreground'
              )} />
              Meta {metaOnline ? 'Online' : metaOnline === false ? 'Offline' : 'Checking'}
            </div>
            <AIStatusIndicator projectId={projectId} />
          </div>
        </div>

        <TabsContent value="dashboard" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Header & Controls */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Обзор кампаний</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Управление и статистика Meta Ads
                    </p>
                  </div>
                </div>

                {/* Autopilot Switch */}
                <div className="flex items-center gap-3 bg-card border border-border p-1.5 pr-4 rounded-full shadow-sm group hover:border-primary/20 transition-all">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    autopilotEnabled ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                  )}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">AI Autopilot</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={autopilotEnabled}
                        onCheckedChange={toggleAutopilot}
                        className="scale-75 origin-left"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta-style Date Picker + Refresh */}
              <div className="flex items-center gap-3 self-start">
                <div className="relative" ref={datePickerRef}>
                  {/* Trigger Button — Meta style */}
                  <button
                    onClick={() => setDatePickerOpen(prev => !prev)}
                    className={cn(
                      "inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-medium transition-all",
                      "bg-card border-border hover:border-primary/40 hover:bg-accent",
                      "text-foreground shadow-sm",
                      datePickerOpen && "border-primary ring-2 ring-primary/20"
                    )}
                  >
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <span>{dateButtonLabel}</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", datePickerOpen && "rotate-180")} />
                  </button>

                  {/* Dropdown Panel */}
                  {datePickerOpen && (
                    <div className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl flex overflow-hidden min-w-[520px]">
                      {/* Left: Presets */}
                      <div className="w-[180px] border-r border-border p-3 space-y-0.5">
                        {presets.map(p => (
                          <button
                            key={p.key}
                            onClick={() => applyPreset(p.key)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                              activePreset === p.key
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-foreground hover:bg-accent"
                            )}
                          >
                            {activePreset === p.key && (
                              <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2 align-middle" />
                            )}
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Right: Calendar */}
                      <div className="p-4">
                        <DayPicker
                          mode="range"
                          selected={dateRange}
                          onSelect={applyCustomRange}
                          numberOfMonths={2}
                          locale={ru}
                          showOutsideDays
                          className="text-sm"
                          classNames={{
                            months: 'flex gap-4',
                            month: 'space-y-3',
                            caption: 'flex justify-center items-center h-8 relative',
                            caption_label: 'text-sm font-semibold',
                            nav: 'flex items-center gap-1',
                            nav_button: 'h-7 w-7 bg-transparent border border-border hover:bg-accent rounded-md flex items-center justify-center transition-colors',
                            head_row: 'flex',
                            head_cell: 'text-muted-foreground w-9 font-medium text-[11px] uppercase',
                            row: 'flex mt-0.5',
                            cell: 'w-9 h-9 text-center text-sm relative',
                            day: 'w-9 h-9 rounded-md hover:bg-accent transition-colors font-normal',
                            day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90',
                            day_today: 'border border-primary/30 font-semibold',
                            day_outside: 'text-muted-foreground/40',
                            day_range_middle: 'bg-primary/10 rounded-none',
                            day_range_start: 'rounded-r-none',
                            day_range_end: 'rounded-l-none',
                          }}
                        />
                        {/* Footer: current range info */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground">
                            {dateRange?.from ? format(dateRange.from, 'd MMMM yyyy', { locale: ru }) : '—'}
                            {dateRange?.to && dateRange.to.getTime() !== dateRange.from?.getTime()
                              ? ` — ${format(dateRange.to, 'd MMMM yyyy', { locale: ru })}`
                              : ''}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => setDatePickerOpen(false)}
                            className="h-8 px-4 text-xs"
                          >
                            Применить
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-10 w-10 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
                  <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin text-primary')} />
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <AdsSummaryCards
              totalSpent={summaryMetrics.totalSpent}
              totalLeads={summaryMetrics.totalLeads}
              avgCpl={summaryMetrics.avgCpl}
              romi={summaryMetrics.romi}
            />

            <div className="grid gap-8 pb-10">
              <ActiveAdsManager
                projectId={projectId}
                dateRange={{
                  from: dateRange?.from ?? new Date(),
                  to: dateRange?.to ?? dateRange?.from ?? new Date()
                }}
                refreshTrigger={refreshTrigger}
              />

              <div className="rounded-2xl border border-border bg-card p-1 shadow-sm">
                <CampaignFunnelChart
                  projectId={projectId}
                  dateRange={dateRange}
                  campaigns={metaCampaigns}
                  leads={leads}
                  adPerformance={performanceLogs}
                  dailyData={dailyData}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analyst" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col relative bg-background">
          <AdsChatInterface
            projectId={projectId}
            contextData={{
              campaigns: metaCampaigns,
              leads: leads,
              contentItems: content,
              dailyData: dailyData,
              summary: summaryMetrics
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
