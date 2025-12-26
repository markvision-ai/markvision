import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp, Users, CalendarCheck, CreditCard } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { Lead } from '@/hooks/useLeads';

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

export const CampaignFunnelChart = ({ campaigns, leads }: CampaignFunnelChartProps) => {
  const funnelData = useMemo(() => {
    // Count leads by status across all campaigns
    const campaignNames = campaigns.map(c => c.name);
    const relevantLeads = leads.filter(l => l.utm_campaign && campaignNames.includes(l.utm_campaign));
    
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
  }, [campaigns, leads]);

  // Campaign breakdown data
  const campaignBreakdown = useMemo(() => {
    return campaigns.map(campaign => {
      const campaignLeads = leads.filter(l => l.utm_campaign === campaign.name);
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
  }, [campaigns, leads]);

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
        </div>
      );
    }
    return null;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return '#1877F2';
      case 'google': return '#EA4335';
      case 'tiktok': return '#000000';
      default: return 'hsl(var(--primary))';
    }
  };

  return (
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

      {/* Campaign Breakdown Bar Chart */}
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
                <Bar dataKey="leads" radius={[0, 4, 4, 0]} barSize={24}>
                  {campaignBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPlatformColor(entry.platform)} />
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
  );
};
