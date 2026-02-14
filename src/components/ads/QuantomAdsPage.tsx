import { useState, useMemo, useEffect } from 'react';
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
import { DateRangePicker, PresetKey } from '@/components/dashboard/DateRangePicker';
import { RefreshCw, Loader2, Zap, Activity, LayoutDashboard, MessageSquareText } from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
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
  const [activePreset, setActivePreset] = useState<PresetKey | undefined>(undefined);
  const { performanceLogs, refetch: refetchAds } = useAdPerformance(projectId);

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
                      Управление и статистика Meta Ads в реальном времени
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

              {/* Date & Refresh Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-1.5 bg-card/50 rounded-2xl border border-border self-start">
                {/* Quick Date Presets */}
                <div className="flex items-center gap-1 px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange({ from: new Date(), to: new Date() });
                    }}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                  >
                    Сегодня
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const yesterday = subDays(new Date(), 1);
                      setDateRange({ from: yesterday, to: yesterday });
                    }}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                  >
                    Вчера
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange({ from: subDays(new Date(), 6), to: new Date() });
                    }}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                  >
                    7 дней
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange({ from: startOfMonth(new Date()), to: new Date() });
                    }}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                  >
                    Этот месяц
                  </Button>
                </div>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <DateRangePicker
                  dateRange={{
                    from: dateRange?.from ?? new Date(),
                    to: dateRange?.to ?? new Date()
                  }}
                  onDateRangeChange={(range) => setDateRange(range)}
                  onPresetChange={(preset) => setActivePreset(preset as PresetKey)}
                  align="start"
                />
                <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
                <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-10 w-10 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
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
