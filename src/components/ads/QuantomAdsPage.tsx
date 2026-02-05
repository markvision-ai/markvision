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
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
    return () => {};
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
    <div className="h-[calc(100vh-6rem)] bg-background text-foreground relative flex flex-col">
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-border bg-background/95 backdrop-blur z-20 flex-none flex items-center justify-between">
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
                <div className="flex items-center gap-2 text-[10px] text-green-500 font-medium uppercase tracking-wider animate-pulse border border-green-500/20 bg-green-500/5 px-2 py-1 rounded-full">
                  <Activity className="w-3 h-3" />
                  Автопилот активен
                </div>
             )}
             <div 
               title={metaStatusMessage || (metaOnline ? 'Connected to Meta Graph API' : 'Connection Lost')}
               className={`flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full border ${metaOnline === null ? 'text-muted-foreground border-border bg-muted/30' : metaOnline ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-red-500 border-red-500/20 bg-red-500/5'}`}
             >
               <div className={`w-3 h-3 rounded-full ${metaOnline ? 'bg-green-500' : metaOnline === false ? 'bg-red-500' : 'bg-muted'}`} />
               Meta {metaOnline ? 'Online' : metaOnline === false ? 'Offline' : 'Checking'}
             </div>
             <AIStatusIndicator />
          </div>
        </div>

        <TabsContent value="dashboard" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Zap className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Обзор кампаний</h1>
                    <p className="text-sm text-muted-foreground">
                      Управление и статистика Meta Ads
                    </p>
                  </div>
                </div>

                {/* Autopilot Switch */}
                <div className="flex items-center gap-3 bg-card/50 border border-border p-1.5 pr-3 rounded-full backdrop-blur-sm">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${autopilotEnabled ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                     <Activity className="w-4 h-4" />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI Autopilot</span>
                     <div className="flex items-center gap-2">
                       <Switch 
                         checked={autopilotEnabled}
                         onCheckedChange={toggleAutopilot}
                         className="data-[state=checked]:bg-green-500 scale-75 origin-left"
                       />
                     </div>
                   </div>
                </div>
              </div>

              {/* Date & Refresh Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  {/* Quick Date Buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant={activePreset === 'today' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setDateRange({ from: today, to: today });
                        setActivePreset('today');
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Сегодня
                    </Button>
                    <Button
                      variant={activePreset === 'yesterday' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setDateRange({ from: yesterday, to: yesterday });
                        setActivePreset('yesterday');
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Вчера
                    </Button>
                    <Button
                      variant={activePreset === 'last7' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const weekAgo = new Date();
                        weekAgo.setDate(today.getDate() - 6);
                        setDateRange({ from: weekAgo, to: today });
                        setActivePreset('last7');
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      7 дней
                    </Button>
                    <Button
                      variant={activePreset === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                        setDateRange({ from: firstDay, to: today });
                        setActivePreset('month');
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Месяц
                    </Button>
                  </div>

                  <div className="h-6 w-px bg-border hidden sm:block" />

                  <DateRangePicker
                    dateRange={{
                      from: dateRange?.from ?? new Date(),
                      to: dateRange?.to ?? new Date()
                    }}
                    onDateRangeChange={(range) => {
                      setDateRange(range);
                      setActivePreset(undefined); // Сброс активного preset при ручном выборе
                    }}
                    onPresetChange={(preset) => setActivePreset(preset as PresetKey)}
                    align="start"
                  />

                  <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-8 w-8" title="Синхронизация с Meta API">
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <AdsSummaryCards
              totalSpent={summaryMetrics.totalSpent}
              totalLeads={summaryMetrics.totalLeads}
              avgCpl={summaryMetrics.avgCpl}
              romi={summaryMetrics.romi}
            />

            <div className="grid gap-6">
              <ActiveAdsManager 
                projectId={projectId} 
                dateRange={{
                  from: dateRange?.from ?? new Date(),
                  to: dateRange?.to ?? dateRange?.from ?? new Date()
                }}
                refreshTrigger={refreshTrigger}
              />
              
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
        </TabsContent>

        <TabsContent value="analyst" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col relative bg-background/95">
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
