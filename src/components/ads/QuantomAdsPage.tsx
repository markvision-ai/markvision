import { useState, useMemo, useEffect } from 'react';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { useContentFactory } from '@/hooks/useContentFactory';
import { useProjectData } from '@/hooks/useProjectData';
import { AdsSummaryCards } from './AdsSummaryCards';
import { CampaignTable } from './CampaignTable';
import { CampaignDrawer } from './CampaignDrawer';
import { CampaignFunnelChart } from './CampaignFunnelChart';
import { AIStatusIndicator } from './AIStatusIndicator';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AdsChatInterface } from './AdsChatInterface';
import { RefreshCw, Plus, Loader2, Zap, CalendarIcon, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/lib/externalSupabase';
import { toast } from 'sonner';

interface QuantomAdsPageProps {
  projectId: string | null;
}

export const QuantomAdsPage = ({ projectId }: QuantomAdsPageProps) => {
  const { campaigns, loading, refetch, updateCampaign } = useCampaigns(projectId);
  const { leads } = useLeads(projectId);
  const { content } = useContentFactory(projectId);
  const { dailyData } = useProjectData(projectId);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
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
    return campaigns.filter(c => c.platform === 'facebook' || c.platform === 'instagram' || !c.platform); // Default to meta if platform is missing or matches
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

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
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
    <div className="flex h-[calc(100vh-6rem)] overflow-hidden bg-background text-foreground relative">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">ИИ таргетолог</h1>
                  <AIStatusIndicator />
                </div>
                <p className="text-sm text-muted-foreground">
                  Командный центр управления Meta Ads
                </p>
              </div>
            </div>

            {/* Autopilot Switch */}
            <div className="flex items-center gap-4 bg-card/50 border border-border p-2 pr-4 rounded-full backdrop-blur-sm">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${autopilotEnabled ? 'bg-green-500/20 text-green-500 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                 <Activity className="w-5 h-5" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Master Switch</span>
                 <div className="flex items-center gap-2">
                   <span className={`font-bold ${autopilotEnabled ? 'text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-foreground'}`}>
                     ИИ-АВТОПИЛОТ
                   </span>
                   <Switch 
                     checked={autopilotEnabled}
                     onCheckedChange={toggleAutopilot}
                     className="data-[state=checked]:bg-green-500"
                   />
                 </div>
               </div>
               {autopilotEnabled && (
                 <span className="text-[10px] text-green-500 font-medium animate-pulse ml-2 hidden sm:inline-block">
                   Марк управляет ставками
                 </span>
               )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-muted/50 dark:bg-card/50 rounded-lg border border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleQuickDate(0)} className="text-xs">Сегодня</Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDate(1)} className="text-xs">Вчера</Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDate(7)} className="text-xs">7 дней</Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickDate(30)} className="text-xs">30 дней</Button>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? `${format(dateRange.from, 'dd MMM', { locale: ru })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: ru })}` : format(dateRange.from, 'dd MMM yyyy', { locale: ru })
                    ) : <span>Выберите период</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                  <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ru} className="rounded-md bg-background" />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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

        {/* Campaigns Table (Meta Only) */}
        <div className="rounded-lg border border-border bg-card">
           <div className="p-4 border-b border-border">
             <h3 className="font-semibold flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               Facebook & Instagram Campaigns
             </h3>
           </div>
           <CampaignTable
             campaigns={metaCampaigns}
             leadsPerCampaign={leadsPerCampaign}
             onCampaignClick={handleCampaignClick}
             onUpdateCampaign={updateCampaign}
           />
        </div>
      </div>

      {/* Chat Interface (Right Side) */}
      <div className="w-[450px] border-l border-border/40 bg-background/90 backdrop-blur-xl relative flex flex-col shadow-2xl z-10">
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
      </div>

      {/* Campaign Drawer */}
      <CampaignDrawer
        campaign={selectedCampaign}
        open={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onUpdateCampaign={updateCampaign}
      />
    </div>
  );
};
