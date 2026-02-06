import { useState, useMemo } from 'react';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { useMarketingStats } from '@/hooks/useMarketingStats';
import { AdsSummaryCards } from './AdsSummaryCards';
import { CampaignTable } from './CampaignTable';
import { CampaignDrawer } from './CampaignDrawer';
import { CreativeCenterTab } from './CreativeCenterTab';
import { CampaignFunnelChart } from './CampaignFunnelChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, Plus, Loader2, Zap, CalendarIcon } from 'lucide-react';
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface QuantomAdsPageProps {
  projectId: string | null;
}

export const QuantomAdsPage = ({ projectId }: QuantomAdsPageProps) => {
  const { campaigns, loading, refetch, updateCampaign } = useCampaigns(projectId);
  const { leads } = useLeads(projectId);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [platformTab, setPlatformTab] = useState<'all' | 'facebook' | 'google' | 'tiktok' | 'creative'>('all');

  // Build today's spend map from campaigns for fallback
  const todaySpendFromCampaigns = useMemo(() => {
    const map: Record<string, number> = {};
    campaigns.forEach(c => {
      if (c.external_id) {
        map[c.external_id] = c.spent_today;
      }
    });
    return map;
  }, [campaigns]);

  // Load marketing stats for selected date range
  const { aggregated: marketingStats, loading: statsLoading, refetch: refetchStats } = useMarketingStats({
    projectId,
    dateRange,
    todaySpendFromCampaigns,
  });

  // Filter campaigns by platform
  const filteredCampaigns = useMemo(() => {
    if (platformTab === 'all' || platformTab === 'creative') return campaigns;
    return campaigns.filter(c => c.platform === platformTab);
  }, [campaigns, platformTab]);

  // Filter leads by date range
  const filteredLeads = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return leads;

    const from = startOfDay(dateRange.from);
    const to = endOfDay(dateRange.to);

    return leads.filter(lead => {
      if (!lead.created_at) return false;
      try {
        const leadDate = parseISO(lead.created_at);
        return isWithinInterval(leadDate, { start: from, end: to });
      } catch {
        return false;
      }
    });
  }, [leads, dateRange]);

  // Calculate leads per campaign based on utm_campaign matching (filtered by date)
  const leadsPerCampaign = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      if (lead.utm_campaign) {
        counts[lead.utm_campaign] = (counts[lead.utm_campaign] || 0) + 1;
      }
    });
    return counts;
  }, [filteredLeads]);

  // Calculate revenue from paid leads per campaign (filtered by date)
  const revenuePerCampaign = useMemo(() => {
    const revenue: Record<string, number> = {};
    filteredLeads.forEach(lead => {
      if (lead.utm_campaign && lead.status === 'paid' && lead.deal_amount) {
        revenue[lead.utm_campaign] = (revenue[lead.utm_campaign] || 0) + (lead.deal_amount || 0);
      }
    });
    return revenue;
  }, [filteredLeads]);

  // Summary calculations using marketing stats
  const summaryMetrics = useMemo(() => {
    // Use marketing stats for spend (aggregated from historical data)
    const totalSpent = marketingStats.totalSpend;

    // Calculate leads from filtered data
    const relevantCampaigns = platformTab === 'all' || platformTab === 'creative'
      ? campaigns
      : campaigns.filter(c => c.platform === platformTab);

    const totalLeads = relevantCampaigns.reduce((sum, c) => sum + (leadsPerCampaign[c.name] || 0), 0);
    const totalRevenue = relevantCampaigns.reduce((sum, c) => sum + (revenuePerCampaign[c.name] || 0), 0);

    return {
      totalSpent,
      totalLeads,
      avgCPA: totalLeads > 0 ? totalSpent / totalLeads : 0,
      overallROAS: totalSpent > 0 ? totalRevenue / totalSpent : 0,
    };
  }, [campaigns, platformTab, leadsPerCampaign, revenuePerCampaign, marketingStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchStats()]);
    setRefreshing(false);
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  if (loading || statsLoading) {
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

  // Determine which quick date button is active
  const getQuickDateActive = () => {
    if (!dateRange?.from || !dateRange?.to) return null;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const fromStr = format(dateRange.from, 'yyyy-MM-dd');
    const toStr = format(dateRange.to, 'yyyy-MM-dd');

    if (fromStr === todayStr && toStr === todayStr) return 0;
    if (fromStr === format(subDays(today, 1), 'yyyy-MM-dd') && toStr === todayStr) return 1;
    if (fromStr === format(subDays(today, 7), 'yyyy-MM-dd') && toStr === todayStr) return 7;
    if (fromStr === format(subDays(today, 30), 'yyyy-MM-dd') && toStr === todayStr) return 30;
    return null;
  };

  const activeQuickDate = getQuickDateActive();

  return (
    <div className="space-y-4 bg-background text-foreground">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-background to-violet-500/5 border border-border/40 p-4 sm:p-6">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-primary/20 to-violet-500/20 rounded-xl">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Quantum Ads</h1>
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0 text-[10px] sm:text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Управление рекламными кампаниями
                </p>
              </div>
            </div>

            <Button onClick={handleRefresh} disabled={refreshing} variant="glass" size="sm">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Обновить</span>
            </Button>
          </div>

          {/* Date Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { days: 0, label: 'Сегодня' },
                { days: 1, label: 'Вчера' },
                { days: 7, label: '7 дней' },
                { days: 30, label: '30 дней' },
              ].map(({ days, label }) => (
                <Button
                  key={days}
                  variant={activeQuickDate === days ? 'default' : 'glass'}
                  size="sm"
                  onClick={() => handleQuickDate(days)}
                  className="text-xs h-8"
                >
                  {label}
                </Button>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="glass" className="justify-start text-left font-normal text-xs h-8">
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd MMM', { locale: ru })} - {format(dateRange.to, 'dd MMM', { locale: ru })}
                      </>
                    ) : (
                      format(dateRange.from, 'dd MMM yyyy', { locale: ru })
                    )
                  ) : (
                    <span>Период</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ru}
                  className="rounded-md bg-background"
                />
              </PopoverContent>
            </Popover>

            <Button variant="premium" size="sm" className="ml-auto h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:inline">Добавить</span>
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
      <CampaignFunnelChart campaigns={campaigns} leads={filteredLeads} dateRange={dateRange} />

      {/* Platform Tabs */}
      <Tabs value={platformTab} onValueChange={(v) => setPlatformTab(v as any)} className="space-y-4">
        <TabsList className="w-full justify-start bg-muted/50 dark:bg-muted/30 p-1 overflow-x-auto flex-nowrap border border-border">
          <TabsTrigger value="all" className="gap-2 shrink-0 data-[state=active]:bg-background dark:data-[state=active]:bg-card">
            Все платформы
          </TabsTrigger>
          <TabsTrigger value="facebook" className="gap-2 shrink-0 data-[state=active]:bg-background dark:data-[state=active]:bg-card">
            <div className="w-4 h-4 bg-[#1877F2] rounded text-[10px] text-white font-bold flex items-center justify-center">f</div>
            <span className="hidden sm:inline">Facebook / Instagram</span>
            <span className="sm:hidden">FB</span>
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2 shrink-0 data-[state=active]:bg-background dark:data-[state=active]:bg-card">
            <div className="w-4 h-4 bg-[#EA4335] rounded text-[10px] text-white font-bold flex items-center justify-center">G</div>
            <span className="hidden sm:inline">Google Ads</span>
            <span className="sm:hidden">Google</span>
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-2 shrink-0 data-[state=active]:bg-background dark:data-[state=active]:bg-card">
            <div className="w-4 h-4 bg-black dark:bg-white rounded text-[10px] text-white dark:text-black font-bold flex items-center justify-center">T</div>
            <span className="hidden sm:inline">TikTok Ads</span>
            <span className="sm:hidden">TikTok</span>
          </TabsTrigger>
          <TabsTrigger value="creative" className="gap-2 shrink-0 data-[state=active]:bg-background dark:data-[state=active]:bg-card">
            <Zap className="w-4 h-4 text-success" />
            <span className="hidden sm:inline">Центр Запуска и Тестирования</span>
            <span className="sm:hidden">Креативы</span>
          </TabsTrigger>
        </TabsList>

        {/* All Platforms */}
        <TabsContent value="all" className="mt-4">
          <CampaignTable
            campaigns={filteredCampaigns}
            leadsPerCampaign={leadsPerCampaign}
            onCampaignClick={handleCampaignClick}
            onUpdateCampaign={updateCampaign}
          />
        </TabsContent>

        {/* Facebook */}
        <TabsContent value="facebook" className="mt-4">
          <CampaignTable
            campaigns={filteredCampaigns}
            leadsPerCampaign={leadsPerCampaign}
            onCampaignClick={handleCampaignClick}
            onUpdateCampaign={updateCampaign}
          />
        </TabsContent>

        {/* Google */}
        <TabsContent value="google" className="mt-4">
          <CampaignTable
            campaigns={filteredCampaigns}
            leadsPerCampaign={leadsPerCampaign}
            onCampaignClick={handleCampaignClick}
            onUpdateCampaign={updateCampaign}
          />
        </TabsContent>

        {/* TikTok */}
        <TabsContent value="tiktok" className="mt-4">
          <CampaignTable
            campaigns={filteredCampaigns}
            leadsPerCampaign={leadsPerCampaign}
            onCampaignClick={handleCampaignClick}
            onUpdateCampaign={updateCampaign}
          />
        </TabsContent>

        {/* Creative Center */}
        <TabsContent value="creative" className="mt-4">
          <CreativeCenterTab projectId={projectId} />
        </TabsContent>
      </Tabs>

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
