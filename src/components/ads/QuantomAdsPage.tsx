import { useState, useMemo } from 'react';
import { useCampaigns, Campaign } from '@/hooks/useCampaigns';
import { useLeads } from '@/hooks/useLeads';
import { AdsSummaryCards } from './AdsSummaryCards';
import { CampaignTable } from './CampaignTable';
import { CampaignDrawer } from './CampaignDrawer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const totalSpent = campaigns.reduce((sum, c) => sum + c.spent_today, 0);
    const totalLeads = campaigns.reduce((sum, c) => sum + (leadsPerCampaign[c.name] || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (revenuePerCampaign[c.name] || 0), 0);
    
    return {
      totalSpent,
      totalLeads,
      avgCPA: totalLeads > 0 ? totalSpent / totalLeads : 0,
      overallROAS: totalSpent > 0 ? totalRevenue / totalSpent : 0,
    };
  }, [campaigns, leadsPerCampaign, revenuePerCampaign]);

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
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Zap className="w-6 h-6 text-emerald-400" />
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

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
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

      {/* Campaign Table */}
      <CampaignTable
        campaigns={campaigns}
        leadsPerCampaign={leadsPerCampaign}
        onCampaignClick={handleCampaignClick}
        onUpdateCampaign={updateCampaign}
      />

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
