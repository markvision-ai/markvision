import { useState, useMemo } from 'react';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { AdsSummaryCards } from './AdsSummaryCards';
import { CampaignTable } from './CampaignTable';
import { CampaignDrawer } from './CampaignDrawer';
import { CreativeCenterTab } from './CreativeCenterTab';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Plus, Loader2, Zap } from 'lucide-react';

interface QuantomAdsPageProps {
  projectId: string | null;
}

export const QuantomAdsPage = ({ projectId }: QuantomAdsPageProps) => {
  const { campaigns, loading, refetch, updateCampaign } = useCampaigns(projectId);
  const { leads } = useLeads(projectId);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'today' | 'yesterday' | '7days'>('today');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-success/10 rounded-lg">
            <Zap className="w-6 h-6 text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quantom Ads</h1>
            <p className="text-sm text-muted-foreground">
              Управление рекламными кампаниями
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="today">Сегодня</TabsTrigger>
              <TabsTrigger value="yesterday">Вчера</TabsTrigger>
              <TabsTrigger value="7days">7 дней</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="relative"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          <Button className="hidden sm:flex">
            <Plus className="w-4 h-4 mr-2" />
            Добавить кампанию
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <AdsSummaryCards
        totalSpent={summaryMetrics.totalSpent}
        totalLeads={summaryMetrics.totalLeads}
        avgCPA={summaryMetrics.avgCPA}
        overallROAS={summaryMetrics.overallROAS}
      />

      {/* Platform Tabs */}
      <Tabs value={platformTab} onValueChange={(v) => setPlatformTab(v as any)} className="space-y-4">
        <TabsList className="w-full justify-start bg-muted/50 p-1 overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="gap-2 shrink-0">
            Все платформы
          </TabsTrigger>
          <TabsTrigger value="facebook" className="gap-2 shrink-0">
            <div className="w-4 h-4 bg-[#1877F2] rounded text-[10px] text-white font-bold flex items-center justify-center">f</div>
            <span className="hidden sm:inline">Facebook / Instagram</span>
            <span className="sm:hidden">FB</span>
          </TabsTrigger>
          <TabsTrigger value="google" className="gap-2 shrink-0">
            <div className="w-4 h-4 bg-[#EA4335] rounded text-[10px] text-white font-bold flex items-center justify-center">G</div>
            <span className="hidden sm:inline">Google Ads</span>
            <span className="sm:hidden">Google</span>
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="gap-2 shrink-0">
            <div className="w-4 h-4 bg-foreground rounded text-[10px] text-background font-bold flex items-center justify-center">T</div>
            <span className="hidden sm:inline">TikTok Ads</span>
            <span className="sm:hidden">TikTok</span>
          </TabsTrigger>
          <TabsTrigger value="creative" className="gap-2 shrink-0">
            <Zap className="w-4 h-4 text-success" />
            <span className="hidden sm:inline">Креатив-Центр</span>
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
