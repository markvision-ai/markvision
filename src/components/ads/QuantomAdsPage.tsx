import { useState, useMemo, useEffect } from 'react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { useContentFactory } from '@/hooks/useContentFactory';
import { useProjectData } from '@/hooks/useProjectData';
import { AdsSummaryCards } from './AdsSummaryCards';
import { CampaignFunnelChart } from './CampaignFunnelChart';
import { AIStatusIndicator } from './AIStatusIndicator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdsChatInterface } from './AdsChatInterface';
import { ActiveAdsManager } from './ActiveAdsManager';
import { RefreshCw, Loader2, Zap, CalendarIcon, Activity, LayoutDashboard, MessageSquareText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

interface QuantomAdsPageProps {
  projectId: string | null;
}

export const QuantomAdsPage = ({ projectId }: QuantomAdsPageProps) => {
  const { campaigns, loading, refetch } = useCampaigns(projectId);
  const { leads } = useLeads(projectId);
  const { content } = useContentFactory(projectId);
  const { dailyData } = useProjectData(projectId);
  const [refreshing, setRefreshing] = useState(false);
  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  // Load Autopilot Status
  useEffect(() => {
    if (!projectId) return;
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
  }, [projectId]);

  const toggleAutopilot = async (enabled: boolean) => {
    if (!projectId) return;
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
  };

  // Filter campaigns (Meta Only)
  const metaCampaigns = useMemo(() => {
    return campaigns.filter(c => c.platform === 'facebook' || c.platform === 'instagram' || !c.platform);
  }, [campaigns]);

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
    const totalSpent = metaCampaigns.reduce((sum, c) => sum + c.spent_today, 0);
    const totalLeads = metaCampaigns.reduce((sum, c) => sum + (leadsPerCampaign[c.name] || 0), 0);
    const totalRevenue = metaCampaigns.reduce((sum, c) => sum + (revenuePerCampaign[c.name] || 0), 0);
    
    return {
      totalSpent,
      totalLeads,
      avgCPA: totalLeads > 0 ? totalSpent / totalLeads : 0,
      overallROAS: totalSpent > 0 ? totalRevenue / totalSpent : 0,
    };
  }, [metaCampaigns, leadsPerCampaign, revenuePerCampaign]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleQuickDate = (days: number) => {
    const today = new Date();
    setDateRange({
      from: days === 0 ? today : subDays(today, days),
      to: today,
    });
  };

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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 dark:bg-card/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleQuickDate(0)} className="text-xs h-8">Сегодня</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickDate(1)} className="text-xs h-8">Вчера</Button>
                  <Button variant="outline" size="sm" onClick={() => handleQuickDate(7)} className="text-xs h-8">7 дней</Button>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal text-sm h-8">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {dateRange?.from ? (
                          dateRange.to ? `${format(dateRange.from, 'dd MMM', { locale: ru })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: ru })}` : format(dateRange.from, 'dd MMM yyyy', { locale: ru })
                        ) : <span>Выберите период</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ru} className="rounded-md bg-background" />
                    </PopoverContent>
                  </Popover>

                  <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} className="h-8 w-8">
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <AdsSummaryCards
              totalSpent={summaryMetrics.totalSpent}
              totalLeads={summaryMetrics.totalLeads}
              avgCPA={summaryMetrics.avgCPA}
              overallROAS={summaryMetrics.overallROAS}
            />

            {/* Campaign Funnel Chart */}
            <CampaignFunnelChart campaigns={metaCampaigns} leads={leads} />

            {/* Active Ads Manager (Live) */}
            <ActiveAdsManager projectId={projectId} />
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
