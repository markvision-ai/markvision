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
import { CampaignLauncher } from './CampaignLauncher';

import { RefreshCw, Loader2, Zap, Activity, LayoutDashboard, MessageSquareText, CalendarDays, ChevronDown, Rocket, TrendingUp } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange, DayPicker } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { KZT_RATE } from '@/constants/ads';
import { motion } from 'framer-motion';

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
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);

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

      // Convert USD spend to KZT if needed
      // Logic: Only convert if we are sure it's USD. Default to 1:1 if already in KZT or other currency.
      // Since QuantomAdsPage doesn't fetch accountStatus directly here, we'll try to determine if logs are likely USD.
      // Usually, Meta API returns USD by default unless configured otherwise.
      // For now, let's keep it consistent with ActiveAdsManager's logic if we can detect it.
      const logCurrency = localStorage.getItem(`meta_currency_${projectId}`) || 'USD';
      const rate = logCurrency === 'USD' ? KZT_RATE : 1;

      todaySpent = uniqueTodayCampaigns.reduce((sum, log) => sum + ((Number(log.spend) || 0) * rate), 0);
      todayLeads = uniqueTodayCampaigns.reduce((sum, log) => sum + (Number(log.leads) || 0) * 1, 0); // Leads are absolute
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
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto px-6 pt-8 gap-8 overflow-visible">
        {/* Premium Light Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl bg-card border border-white/50 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-foreground uppercase">
                Центр управления
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-primary tracking-[0.2em] uppercase">Quantum Engine v2.0</span>
                <div className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs text-muted-foreground font-medium">Статистика Meta Ads</span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-4">
            <TabsList className="bg-muted border border-white/50 p-1 h-12 rounded-xl">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 rounded-lg transition-all font-bold gap-2 text-xs"
              >
                <LayoutDashboard className="w-4 h-4" />
                ДАШБОРД
              </TabsTrigger>
              <TabsTrigger
                value="analyst"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 rounded-lg transition-all font-bold gap-2 text-xs"
              >
                <MessageSquareText className="w-4 h-4" />
                ИИ-АНАЛИТИК
              </TabsTrigger>
            </TabsList>

            <div className="h-8 w-px bg-border mx-2 hidden sm:block" />

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsLauncherOpen(true)}
                className={cn(
                  "relative group px-6 h-10 rounded-xl font-black transition-all overflow-hidden uppercase tracking-wider text-xs",
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                  "shadow-md shadow-primary/20"
                )}
              >
                <Rocket className="w-4 h-4 mr-2 group-hover:animate-bounce transition-transform" />
                Запустить рекламу
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Global Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-card border border-white/50 px-4 py-2 rounded-full shadow-sm">
              <div className={cn("w-2 h-2 rounded-full", metaOnline ? "bg-blue-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-red-500 animate-pulse")} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Meta Engine: {metaOnline ? 'В сети' : 'Прервано'}
              </span>
            </div>

            <div className="flex items-center gap-3 bg-card border border-white/50 px-4 py-2 rounded-full shadow-sm">
              <Activity className={cn("w-3.5 h-3.5", autopilotEnabled ? "text-primary animate-spin-slow" : "text-muted-foreground")} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                ИИ-Автопилот: {autopilotEnabled ? 'Работает' : 'Ручной режим'}
              </span>
              <Switch checked={autopilotEnabled} onCheckedChange={toggleAutopilot} className="scale-75 ml-2 data-[state=checked]:bg-primary" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group" ref={datePickerRef}>
              <button
                onClick={() => setDatePickerOpen(prev => !prev)}
                className={cn(
                  "inline-flex items-center gap-3 h-11 px-5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all shadow-sm",
                  "bg-card border-white/50 hover:border-primary/50 hover:bg-accent text-foreground",
                  datePickerOpen && "border-primary ring-2 ring-primary/10"
                )}
              >
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>{dateButtonLabel}</span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", datePickerOpen && "rotate-180")} />
              </button>

              {datePickerOpen && (
                <div className="absolute top-full right-0 mt-4 z-50 bg-card border border-white/50 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex overflow-hidden min-w-[540px]">
                  <div className="w-[180px] border-r border-white/50 p-4 space-y-1 bg-muted/30">
                    {presets.map(p => (
                      <button
                        key={p.key}
                        onClick={() => applyPreset(p.key)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                          activePreset === p.key
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 bg-card text-foreground">
                    <DayPicker
                      mode="range"
                      selected={dateRange}
                      onSelect={applyCustomRange}
                      numberOfMonths={2}
                      locale={ru}
                      className="ads-calendar-light"
                      classNames={{
                        months: 'flex gap-8',
                        month: 'space-y-4',
                        caption: 'flex justify-center items-center h-10 relative mb-4',
                        caption_label: 'text-sm font-black uppercase tracking-widest text-primary',
                        nav: 'flex items-center gap-2',
                        head_cell: 'text-muted-foreground w-10 font-bold text-[10px] uppercase tracking-widest pb-2 text-center',
                        cell: 'w-10 h-10 p-0 relative focus-within:z-20',
                        day: 'w-10 h-10 rounded-lg hover:bg-accent transition-all font-medium text-sm text-foreground flex items-center justify-center',
                        day_selected: 'bg-primary text-primary-foreground rounded-lg',
                        day_today: 'text-primary border border-primary/20',
                        day_outside: 'text-muted-foreground opacity-30',
                        day_range_middle: 'bg-primary/5 text-primary rounded-none',
                        day_range_start: 'rounded-r-none',
                        day_range_end: 'rounded-l-none',
                      }}
                    />
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Период: {dateRange?.from ? format(dateRange.from, 'd MMM yyyy', { locale: ru }) : '—'}
                        {dateRange?.to ? ` → ${format(dateRange.to, 'd MMM yyyy', { locale: ru })}` : ''}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setDatePickerOpen(false)}
                        className="h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest"
                      >
                        Применить
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 w-10 hover:bg-accent rounded-xl border border-white/50 transition-all group shadow-sm"
            >
              <RefreshCw className={cn('w-4 h-4 text-muted-foreground group-hover:text-primary', refreshing && 'animate-spin text-primary')} />
            </Button>
          </div>
        </div>

        <TabsContent value="dashboard" className="m-0 space-y-8 pb-10">
          {/* Metrics Section */}
          <AdsSummaryCards
            totalSpent={summaryMetrics.totalSpent}
            totalLeads={summaryMetrics.totalLeads}
            avgCpl={summaryMetrics.avgCpl}
            romi={summaryMetrics.romi}
          />

          {/* Table Container */}
          <div className="rounded-[2.5rem] bg-card border border-white/50 shadow-sm overflow-hidden">
            <ActiveAdsManager
              projectId={projectId}
              dateRange={{
                from: dateRange?.from ?? new Date(),
                to: dateRange?.to ?? dateRange?.from ?? new Date()
              }}
              refreshTrigger={refreshTrigger}
            />
          </div>

          <div className="rounded-[2.5rem] bg-card border border-white/50 p-8 shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" />
              Воронка эффективности кампаний
            </h3>
            <CampaignFunnelChart
              projectId={projectId}
              dateRange={dateRange}
              campaigns={metaCampaigns}
              leads={leads}
              adPerformance={performanceLogs}
              dailyData={dailyData}
            />
          </div>
        </TabsContent>

        <TabsContent value="analyst" className="m-0 h-[700px] border border-white/50 rounded-[2.5rem] overflow-hidden bg-card shadow-sm">
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

      <CampaignLauncher
        projectId={projectId}
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .ads-calendar-light .rdp-day_selected:not([disabled]) { 
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
        }
        .ads-calendar-light .rdp-day_range_middle {
          background-color: hsl(var(--primary) / 0.05) !important;
          color: hsl(var(--primary)) !important;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}} />
    </div>
  );
};

export default QuantomAdsPage;
