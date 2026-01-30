import { useState, useMemo } from 'react';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { AdsSummaryCards } from './AdsSummaryCards';
import { CampaignTable } from './CampaignTable';
import { CampaignDrawer } from './CampaignDrawer';
import { CreativeCenterTab } from './CreativeCenterTab';
import { CampaignFunnelChart } from './CampaignFunnelChart';
import { AIStatusIndicator } from './AIStatusIndicator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, Plus, Loader2, Zap, CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
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

  // Filter campaigns by platform
  const filteredCampaigns = useMemo(() => {
    if (platformTab === 'all' || platformTab === 'creative') return campaigns;
    return campaigns.filter(c => c.platform === platformTab);
  }, [campaigns, platformTab]);

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
    const relevantCampaigns = platformTab === 'all' || platformTab === 'creative' 
      ? campaigns 
      : campaigns.filter(c => c.platform === platformTab);
    
    const totalSpent = relevantCampaigns.reduce((sum, c) => sum + c.spent_today, 0);
    const totalLeads = relevantCampaigns.reduce((sum, c) => sum + (leadsPerCampaign[c.name] || 0), 0);
    const totalRevenue = relevantCampaigns.reduce((sum, c) => sum + (revenuePerCampaign[c.name] || 0), 0);
    
    return {
      totalSpent,
      totalLeads,
      avgCPA: totalLeads > 0 ? totalSpent / totalLeads : 0,
      overallROAS: totalSpent > 0 ? totalRevenue / totalSpent : 0,
    };
  }, [campaigns, platformTab, leadsPerCampaign, revenuePerCampaign]);

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
    <div className="space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Quantum Ads</h1>
              <AIStatusIndicator />
            </div>
            <p className="text-sm text-muted-foreground">
              Управление рекламными кампаниями
            </p>
          </div>
        </div>

        {/* Control Panel */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-muted/50 dark:bg-card/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(0)}
              className="text-xs"
            >
              Сегодня
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(1)}
              className="text-xs"
            >
              Вчера
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(7)}
              className="text-xs"
            >
              7 дней
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDate(30)}
              className="text-xs"
            >
              30 дней
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd MMM', { locale: ru })} -{' '}
                        {format(dateRange.to, 'dd MMM yyyy', { locale: ru })}
                      </>
                    ) : (
                      format(dateRange.from, 'dd MMM yyyy', { locale: ru })
                    )
                  ) : (
                    <span>Выберите период</span>
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

            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button className="ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Добавить кампанию</span>
              <span className="sm:hidden">Добавить</span>
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
      <CampaignFunnelChart campaigns={campaigns} leads={leads} />

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
