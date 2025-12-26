import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Users, CalendarCheck, CreditCard, X } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { startOfDay, subDays, isAfter, parseISO } from 'date-fns';

interface CampaignFunnelChartProps {
  campaigns: Campaign[];
  leads: Lead[];
}

interface FunnelStage {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  percentage?: number;
}

type PeriodFilter = 'all' | 'today' | 'yesterday' | '7days';

export const CampaignFunnelChart = ({ campaigns, leads }: CampaignFunnelChartProps) => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Filter leads by period
  const filteredLeads = useMemo(() => {
    if (periodFilter === 'all') return leads;
    
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    const sevenDaysAgo = startOfDay(subDays(now, 7));

    return leads.filter(lead => {
      const leadDate = parseISO(lead.created_at);
      switch (periodFilter) {
        case 'today':
          return isAfter(leadDate, today);
        case 'yesterday':
          return isAfter(leadDate, yesterday) && !isAfter(leadDate, today);
        case '7days':
          return isAfter(leadDate, sevenDaysAgo);
        default:
          return true;
      }
    });
  }, [leads, periodFilter]);

  const funnelData = useMemo(() => {
    const campaignNames = campaigns.map(c => c.name);
    const relevantLeads = filteredLeads.filter(l => l.utm_campaign && campaignNames.includes(l.utm_campaign));
    
    const totalLeads = relevantLeads.length;
    const appointmentLeads = relevantLeads.filter(l => 
      l.status === 'appointment' || l.status === 'paid' || l.status === 'in_progress'
    ).length;
    const paidLeads = relevantLeads.filter(l => l.status === 'paid').length;
    const totalRevenue = relevantLeads
      .filter(l => l.status === 'paid' && l.deal_amount)
      .reduce((sum, l) => sum + (l.deal_amount || 0), 0);

    return {
      stages: [
        { 
          name: 'Лиды', 
          value: totalLeads, 
          color: 'hsl(var(--primary))',
          icon: <Users className="w-4 h-4" />,
          percentage: 100
        },
        { 
          name: 'Записи', 
          value: appointmentLeads, 
          color: 'hsl(var(--warning))',
          icon: <CalendarCheck className="w-4 h-4" />,
          percentage: totalLeads > 0 ? (appointmentLeads / totalLeads) * 100 : 0
        },
        { 
          name: 'Оплаты', 
          value: paidLeads, 
          color: 'hsl(var(--success))',
          icon: <CreditCard className="w-4 h-4" />,
          percentage: totalLeads > 0 ? (paidLeads / totalLeads) * 100 : 0
        },
      ] as FunnelStage[],
      totalRevenue,
      conversionRate: totalLeads > 0 ? (paidLeads / totalLeads) * 100 : 0,
    };
  }, [campaigns, filteredLeads]);

  // Campaign breakdown data
  const campaignBreakdown = useMemo(() => {
    return campaigns.map(campaign => {
      const campaignLeads = filteredLeads.filter(l => l.utm_campaign === campaign.name);
      const totalLeads = campaignLeads.length;
      const appointments = campaignLeads.filter(l => 
        l.status === 'appointment' || l.status === 'paid' || l.status === 'in_progress'
      ).length;
      const paid = campaignLeads.filter(l => l.status === 'paid').length;
      const revenue = campaignLeads
        .filter(l => l.status === 'paid' && l.deal_amount)
        .reduce((sum, l) => sum + (l.deal_amount || 0), 0);
      
      return {
        name: campaign.name.length > 15 ? campaign.name.slice(0, 15) + '...' : campaign.name,
        fullName: campaign.name,
        platform: campaign.platform,
        leads: totalLeads,
        appointments,
        paid,
        revenue,
        conversionRate: totalLeads > 0 ? (paid / totalLeads) * 100 : 0,
      };
    }).filter(c => c.leads > 0).sort((a, b) => b.leads - a.leads).slice(0, 6);
  }, [campaigns, filteredLeads]);

  // Platform comparison data
  const platformComparison = useMemo(() => {
    const platforms = ['facebook', 'google', 'tiktok'];
    return platforms.map(platform => {
      const platformCampaigns = campaigns.filter(c => c.platform === platform);
      const campaignNames = platformCampaigns.map(c => c.name);
      const platformLeads = filteredLeads.filter(l => l.utm_campaign && campaignNames.includes(l.utm_campaign));
      
      const totalLeads = platformLeads.length;
      const paidLeads = platformLeads.filter(l => l.status === 'paid').length;
      const revenue = platformLeads
        .filter(l => l.status === 'paid' && l.deal_amount)
        .reduce((sum, l) => sum + (l.deal_amount || 0), 0);
      
      return {
        name: platform === 'facebook' ? 'Facebook' : platform === 'google' ? 'Google' : 'TikTok',
        platform,
        leads: totalLeads,
        paid: paidLeads,
        conversionRate: totalLeads > 0 ? (paidLeads / totalLeads) * 100 : 0,
        revenue,
        color: getPlatformColor(platform),
      };
    }).filter(p => p.leads > 0);
  }, [campaigns, filteredLeads]);

  // Selected campaign funnel data
  const selectedCampaignData = useMemo(() => {
    if (!selectedCampaign) return null;
    
    const campaignLeads = filteredLeads.filter(l => l.utm_campaign === selectedCampaign);
    const totalLeads = campaignLeads.length;
    const newLeads = campaignLeads.filter(l => l.status === 'new').length;
    const inProgress = campaignLeads.filter(l => l.status === 'in_progress').length;
    const appointments = campaignLeads.filter(l => l.status === 'appointment').length;
    const paidLeads = campaignLeads.filter(l => l.status === 'paid').length;
    const cancelled = campaignLeads.filter(l => l.status === 'cancelled' || l.status === 'no_answer').length;
    const revenue = campaignLeads
      .filter(l => l.status === 'paid' && l.deal_amount)
      .reduce((sum, l) => sum + (l.deal_amount || 0), 0);

    const campaign = campaigns.find(c => c.name === selectedCampaign);

    return {
      name: selectedCampaign,
      platform: campaign?.platform || 'unknown',
      stages: [
        { name: 'Все лиды', value: totalLeads, color: 'hsl(var(--primary))', percentage: 100 },
        { name: 'Новые', value: newLeads, color: 'hsl(var(--muted-foreground))', percentage: totalLeads > 0 ? (newLeads / totalLeads) * 100 : 0 },
        { name: 'В работе', value: inProgress, color: 'hsl(var(--warning))', percentage: totalLeads > 0 ? (inProgress / totalLeads) * 100 : 0 },
        { name: 'Записи', value: appointments, color: '#8B5CF6', percentage: totalLeads > 0 ? (appointments / totalLeads) * 100 : 0 },
        { name: 'Оплачено', value: paidLeads, color: 'hsl(var(--success))', percentage: totalLeads > 0 ? (paidLeads / totalLeads) * 100 : 0 },
        { name: 'Отменено', value: cancelled, color: 'hsl(var(--destructive))', percentage: totalLeads > 0 ? (cancelled / totalLeads) * 100 : 0 },
      ],
      revenue,
      conversionRate: totalLeads > 0 ? (paidLeads / totalLeads) * 100 : 0,
    };
  }, [selectedCampaign, filteredLeads, campaigns]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.fullName || data.name}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Лиды: <span className="text-foreground font-medium">{data.leads}</span></p>
            <p>Записи: <span className="text-foreground font-medium">{data.appointments}</span></p>
            <p>Оплаты: <span className="text-foreground font-medium">{data.paid}</span></p>
            <p>Выручка: <span className="text-success font-medium">{formatCurrency(data.revenue)}</span></p>
            <p>Конверсия: <span className="text-foreground font-medium">{data.conversionRate.toFixed(1)}%</span></p>
          </div>
          <p className="text-xs text-primary mt-2">Нажмите для детальной воронки</p>
        </div>
      );
    }
    return null;
  };

  const PlatformTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Лиды: <span className="text-foreground font-medium">{data.leads}</span></p>
            <p>Оплаты: <span className="text-foreground font-medium">{data.paid}</span></p>
            <p>Конверсия: <span className="text-foreground font-medium">{data.conversionRate.toFixed(1)}%</span></p>
            <p>Выручка: <span className="text-success font-medium">{formatCurrency(data.revenue)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  function getPlatformColor(platform: string) {
    switch (platform) {
      case 'facebook': return '#1877F2';
      case 'google': return '#EA4335';
      case 'tiktok': return '#000000';
      default: return 'hsl(var(--primary))';
    }
  }

  const handleBarClick = (data: any) => {
    if (data && data.fullName) {
      setSelectedCampaign(data.fullName);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex justify-end">
          <Tabs value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all">Все время</TabsTrigger>
              <TabsTrigger value="today">Сегодня</TabsTrigger>
              <TabsTrigger value="yesterday">Вчера</TabsTrigger>
              <TabsTrigger value="7days">7 дней</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Funnel Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                Воронка продаж по кампаниям
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.stages.map((stage, index) => (
                  <div key={stage.name} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-1.5 rounded-md" 
                          style={{ backgroundColor: `${stage.color}20` }}
                        >
                          <span style={{ color: stage.color }}>{stage.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{stage.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{stage.value}</span>
                        {index > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({stage.percentage?.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-8 bg-muted/50 rounded-lg overflow-hidden">
                      <div 
                        className="h-full rounded-lg transition-all duration-500"
                        style={{ 
                          width: `${stage.percentage}%`,
                          backgroundColor: stage.color,
                          opacity: 0.8
                        }}
                      />
                    </div>
                    {index < funnelData.stages.length - 1 && (
                      <div className="flex justify-center my-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>↓</span>
                          <span>
                            {funnelData.stages[index + 1].value > 0 && stage.value > 0
                              ? ((funnelData.stages[index + 1].value / stage.value) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Summary stats */}
                <div className="pt-4 border-t mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Общая выручка</p>
                    <p className="text-lg font-bold text-success">
                      {formatCurrency(funnelData.totalRevenue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Конверсия в оплату</p>
                    <p className="text-lg font-bold">
                      {funnelData.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Breakdown Bar Chart with Click */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Лиды по кампаниям</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart 
                    data={campaignBreakdown} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="leads" 
                      radius={[0, 4, 4, 0]} 
                      barSize={24}
                      onClick={handleBarClick}
                      className="cursor-pointer"
                    >
                      {campaignBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getPlatformColor(entry.platform)} 
                          className="hover:opacity-80 transition-opacity"
                        />
                      ))}
                      <LabelList 
                        dataKey="leads" 
                        position="right" 
                        fontSize={12}
                        fill="hsl(var(--muted-foreground))"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  <p>Нет данных по кампаниям</p>
                </div>
              )}
              
              {/* Platform legend */}
              <div className="flex flex-wrap gap-4 justify-center mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1877F2' }} />
                  <span>Facebook</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EA4335' }} />
                  <span>Google</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded bg-foreground" />
                  <span>TikTok</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Comparison Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Сравнение конверсии по платформам</CardTitle>
          </CardHeader>
          <CardContent>
            {platformComparison.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bar chart for conversion rates */}
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={platformComparison} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<PlatformTooltip />} />
                    <Bar dataKey="conversionRate" radius={[4, 4, 0, 0]} barSize={50}>
                      {platformComparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList 
                        dataKey="conversionRate" 
                        position="top" 
                        fontSize={12}
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        fill="hsl(var(--foreground))"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Pie chart for leads distribution */}
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={platformComparison}
                      dataKey="leads"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {platformComparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PlatformTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Нет данных для сравнения платформ</p>
              </div>
            )}
            
            {/* Platform summary cards */}
            {platformComparison.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                {platformComparison.map(platform => (
                  <div 
                    key={platform.platform} 
                    className="text-center p-3 rounded-lg"
                    style={{ backgroundColor: `${platform.color}10` }}
                  >
                    <p className="text-xs text-muted-foreground">{platform.name}</p>
                    <p className="text-lg font-bold" style={{ color: platform.color }}>
                      {platform.conversionRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {platform.paid} из {platform.leads} лидов
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Detail Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCampaignData && (
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: getPlatformColor(selectedCampaignData.platform) }} 
                />
              )}
              {selectedCampaign}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCampaignData && (
            <div className="space-y-4">
              {/* Detailed funnel stages */}
              <div className="space-y-3">
                {selectedCampaignData.stages.map((stage, index) => (
                  <div key={stage.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{stage.name}</span>
                      <div className="text-right">
                        <span className="font-bold">{stage.value}</span>
                        {index > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({stage.percentage.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-6 bg-muted/50 rounded overflow-hidden">
                      <div 
                        className="h-full rounded transition-all duration-500"
                        style={{ 
                          width: `${stage.percentage}%`,
                          backgroundColor: stage.color,
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Выручка</p>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(selectedCampaignData.revenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Конверсия</p>
                  <p className="text-lg font-bold">
                    {selectedCampaignData.conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setSelectedCampaign(null)}
              >
                Закрыть
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
