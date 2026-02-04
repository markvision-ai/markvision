import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, CalendarCheck, CreditCard, Eye, MousePointerClick, Download, Info, ArrowRight } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { startOfDay, parseISO, format, isWithinInterval, endOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { AdPerformanceLog } from '@/hooks/useAdPerformance';
import { DailyData } from '@/hooks/useProjectData';
import { KZT_RATE } from '@/constants/ads';

interface CampaignFunnelChartProps {
  campaigns: Campaign[];
  leads: Lead[];
  adPerformance: AdPerformanceLog[];
  dailyData?: Record<string, DailyData>;
  dateRange?: DateRange;
  projectId?: string | null;
}

interface FunnelStage {
  name: string;
  value: number;
  color: string;
  icon: React.ElementType;
  percentage?: number;
  details?: { label: string; value: string }[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} млн ₸`;
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

function getPlatformColor(platform: string) {
  const p = platform?.toLowerCase() || '';
  if (p.includes('facebook') || p.includes('instagram')) return '#1877F2';
  if (p.includes('google') || p.includes('youtube')) return '#EA4335';
  if (p.includes('tiktok')) return '#000000';
  return 'hsl(var(--primary))';
}

function getPlatformName(platform: string) {
    const p = platform?.toLowerCase() || '';
    if (p.includes('facebook') || p.includes('instagram')) return 'Meta Ads';
    if (p.includes('google') || p.includes('youtube')) return 'Google Ads';
    if (p.includes('tiktok')) return 'TikTok Ads';
    return platform || 'Other';
}

export const CampaignFunnelChart = ({ campaigns = [], leads = [], adPerformance = [], dailyData = {}, dateRange }: CampaignFunnelChartProps) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Filter leads by period (for deep funnel metrics)
  const filteredLeads = useMemo(() => {
    if (!dateRange || !dateRange.from) return leads;
    
    // Use string comparison (YYYY-MM-DD) to match QuantomAdsPage logic and avoid timezone issues
    const fromStr = format(dateRange.from, 'yyyy-MM-dd');
    const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;

    return leads.filter(lead => {
      if (!lead.created_at) return false;
      const leadDate = format(new Date(lead.created_at), 'yyyy-MM-dd'); // Use Local Time to match Overview
      return leadDate >= fromStr && leadDate <= toStr;
    });
  }, [leads, dateRange]);

  // Filter performance logs by period (for fallback / compatibility)
  const filteredPerformance = useMemo(() => {
    const campaignLogs = adPerformance.filter(log => 
      log.entity_type === 'CAMPAIGN' || log.entity_type === 'campaign'
    );

    let logsInRange = campaignLogs;
    if (dateRange && dateRange.from) {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;

      logsInRange = campaignLogs.filter(log => {
        return log.date_start >= fromStr && log.date_start <= toStr;
      });
    }

    // Deduplicate logs
    const uniqueLogs: Record<string, AdPerformanceLog> = {};
    logsInRange.forEach(log => {
      const key = `${log.entity_id}_${log.date_start}`;
      const currentSpend = Number(log.spend) || 0;
      const existingSpend = uniqueLogs[key] ? (Number(uniqueLogs[key].spend) || 0) : -1;
      
      if (!uniqueLogs[key] || currentSpend >= existingSpend) {
        uniqueLogs[key] = log;
      }
    });

    return Object.values(uniqueLogs);
  }, [adPerformance, dateRange]);

  const funnelData = useMemo(() => {
    // Determine date strings
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const fromStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : todayStr;
    const toStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;
    
    // Default to strict ranges
    const fromDate = fromStr || '0000-01-01';
    const toDate = toStr || '9999-12-31';

    // 1. Calculate History Stats from Daily Data (Official Source)
    // Exclude Today from daily data aggregation to use real-time logs for today
    const dailyDataList = Object.values(dailyData);
    const historyStats = dailyDataList.filter(d => d.date >= fromDate && d.date <= toDate && d.date !== todayStr);
    
    const historyImpressions = historyStats.reduce((sum, d) => sum + (d.impressions || 0), 0);
    const historyClicks = historyStats.reduce((sum, d) => sum + (d.clicks || 0), 0);
    const historyLeads = historyStats.reduce((sum, d) => sum + (d.leads || 0), 0);

    // 2. Calculate Today Stats (Real-time from Ad Performance Logs)
    let todayImpressions = 0;
    let todayClicks = 0;
    let todayLeads = 0;

    // Only calculate today's stats if the date range includes today
    if (fromDate <= todayStr && toDate >= todayStr) {
        const todayLogs = adPerformance.filter(log => 
            log.date_start === todayStr && 
            (log.entity_type === 'CAMPAIGN' || log.entity_type === 'campaign')
        );

        // Deduplicate logs for today: Group by entity_id and take max
        const uniqueTodayLogs = Object.values(
            todayLogs.reduce((acc, log) => {
                const currentSpend = Number(log.spend) || 0;
                const existingSpend = acc[log.entity_id] ? (Number(acc[log.entity_id].spend) || 0) : -1;
                
                if (!acc[log.entity_id] || currentSpend > existingSpend) {
                    acc[log.entity_id] = log;
                }
                return acc;
            }, {} as Record<string, AdPerformanceLog>)
        );

        todayImpressions = uniqueTodayLogs.reduce((sum, log) => sum + (Number(log.impressions) || 0), 0);
        todayClicks = uniqueTodayLogs.reduce((sum, log) => sum + (Number(log.clicks) || 0), 0);
        todayLeads = uniqueTodayLogs.reduce((sum, log) => sum + (Number(log.leads) || 0), 0);
    }

    const impressions = historyImpressions + todayImpressions;
    const clicks = historyClicks + todayClicks;
    const totalLeadsMeta = historyLeads + todayLeads;
    
    // 3. Deep Funnel from CRM (Attributed Only)
    // We filter leads by date AND presence of UTM campaign to match Ad Performance
    const leadsInRange = leads.filter(l => {
         const d = parseISO(l.created_at);
         const dateStr = format(d, 'yyyy-MM-dd');
         return dateStr >= fromDate && dateStr <= toDate;
    });

    // Only count leads that have a UTM campaign (Attributed to Ads)
    // This avoids showing Organic leads in the Ads Funnel (e.g. 373 vs 51)
    const attributedLeads = leadsInRange.filter(l => l.utm_campaign);
    
    // CONSISTENCY RULE: Use MAX(Meta Leads, CRM Attributed Leads)
    // This ensures the Funnel matches the Table and Overview counts (e.g. 133 vs 55)
    const totalLeads = Math.max(totalLeadsMeta, attributedLeads.length);
    
    const appointmentLeads = attributedLeads.filter(l => 
        l.status === 'appointment' || l.status === 'paid' || l.status === 'in_progress' || l.status === 'visit_completed'
    ).length;
    
    const paidLeads = attributedLeads.filter(l => l.status === 'paid').length;
    
    const totalRevenue = attributedLeads
         .filter(l => l.status === 'paid' && l.deal_amount)
         .reduce((sum, l) => sum + (l.deal_amount || 0), 0);

    return {
      stages: [
        { 
          name: 'Показы', 
          value: impressions, 
          color: 'bg-muted-foreground/20', 
          icon: Eye,
          percentage: 100,
          details: [{ label: 'Всего показов', value: new Intl.NumberFormat('ru-RU').format(impressions) }]
        },
        { 
          name: 'Клики', 
          value: clicks, 
          color: 'bg-blue-500/20',
          icon: MousePointerClick,
          percentage: impressions > 0 ? (clicks / impressions) * 100 : 0,
          details: [
            { label: 'CTR', value: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0%' }
          ]
        },
        { 
          name: 'Лиды', 
          value: totalLeads, 
          color: 'bg-primary/20',
          icon: Users,
          percentage: clicks > 0 ? (totalLeads / clicks) * 100 : 0,
          details: [
            { label: 'Конверсия в лид', value: clicks > 0 ? ((totalLeads / clicks) * 100).toFixed(2) + '%' : '0%' }
          ]
        },
        { 
          name: 'Записи', 
          value: appointmentLeads, 
          color: 'bg-warning/20',
          icon: CalendarCheck,
          percentage: totalLeads > 0 ? (appointmentLeads / totalLeads) * 100 : 0,
          details: [
            { label: 'Конверсия в запись', value: totalLeads > 0 ? ((appointmentLeads / totalLeads) * 100).toFixed(1) + '%' : '0%' }
          ]
        },
        { 
          name: 'Оплаты', 
          value: paidLeads, 
          color: 'bg-success/20',
          icon: CreditCard,
          percentage: totalLeads > 0 ? (paidLeads / totalLeads) * 100 : 0,
          details: [
            { label: 'Конверсия в оплату', value: totalLeads > 0 ? ((paidLeads / totalLeads) * 100).toFixed(1) + '%' : '0%' }
          ]
        },
      ] as FunnelStage[],
      totalRevenue,
      conversionRate: totalLeads > 0 ? (paidLeads / totalLeads) * 100 : 0,
    };
  }, [adPerformance, dateRange, leads]);

  // Campaign breakdown data
  const campaignBreakdown = useMemo(() => {
    // 1. Create ID -> Name Map for normalization
    const idToName = new Map<string, string>();
    campaigns.forEach(c => {
        if (c.name) {
            if (c.id) idToName.set(c.id, c.name);
            if ((c as any).external_id) idToName.set((c as any).external_id, c.name);
        }
    });

    // 2. Collect all unique campaign names from various sources
    const allNames = new Set<string>();
    
    // From explicit campaigns
    campaigns.forEach(c => allNames.add(c.name));
    
    // From Performance Logs
    filteredPerformance.forEach(log => {
        if (log.entity_name) {
            allNames.add(log.entity_name);
        } else if (log.entity_id) {
            const resolved = idToName.get(log.entity_id);
            if (resolved) allNames.add(resolved);
        }
    });

    // From Leads (UTM)
    filteredLeads.forEach(lead => {
        if (lead.utm_campaign) {
            const cleanUtm = lead.utm_campaign.trim();
            const resolved = idToName.get(cleanUtm);
            if (resolved) {
                allNames.add(resolved);
            } else {
                allNames.add(cleanUtm);
            }
        }
    });

    return Array.from(allNames).map(name => {
      // Find explicit campaign object if exists to get platform info
      const campaignObj = campaigns.find(c => c.name === name);
      // Default to facebook/meta if unknown, as most data comes from there currently
      // Or try to infer from other sources if possible
      const platform = campaignObj?.platform || 'facebook';

      const logs = filteredPerformance.filter(log => {
        return log.entity_name === name || 
               (campaignObj && (campaignObj as any).external_id === log.entity_id) ||
               (log.entity_id && idToName.get(log.entity_id) === name);
      });
      
      const impressions = logs.reduce((sum, log) => sum + (log.impressions || 0), 0);
      const clicks = logs.reduce((sum, log) => sum + (log.clicks || 0), 0);
      
      // Helper for loose matching
      const isMatch = (lead: Lead) => {
          if (!lead.utm_campaign) return false;
          const cleanUtm = lead.utm_campaign.trim();
          const cleanName = name.trim().toLowerCase();
          
          // Direct match (Case insensitive)
          if (cleanUtm.toLowerCase() === cleanName) return true;
          
          // ID match via Map
          const resolved = idToName.get(cleanUtm);
          if (resolved && resolved.trim().toLowerCase() === cleanName) return true;
          
          // Direct ID match against campaign object
          if (campaignObj) {
              if (campaignObj.id === cleanUtm) return true;
              if ((campaignObj as any).external_id === cleanUtm) return true;
          }
          
          return false;
      };

      // Calculate leads from CRM (Attributed) to match Summary logic
      // We prioritize CRM data because it's the "source of truth" for the user (377 vs 55)
      const crmLeadsCount = filteredLeads.filter(isMatch).length;
      
      // Use CRM leads if available, otherwise fallback to Meta logs
      // This ensures "Top Campaigns" and "Efficiency" match the "Summary" block
      const metaLeads = logs.reduce((sum, log) => sum + (log.leads || 0), 0);
      const adLeads = Math.max(metaLeads, crmLeadsCount);

      const spendKZT = logs.reduce((sum, log) => sum + ((log.spend || 0) * KZT_RATE), 0);

      const visits = filteredLeads
        .filter(l => ['appointment', 'paid', 'visit_completed', 'diagnostics_completed'].includes(l.status))
        .filter(isMatch).length;

      const paid = filteredLeads
        .filter(l => l.status === 'paid')
        .filter(isMatch).length;
        
      const revenue = filteredLeads
        .filter(l => l.status === 'paid' && l.deal_amount)
        .filter(isMatch)
        .reduce((sum, l) => sum + (l.deal_amount || 0), 0);

      return {
        name: name,
        fullName: name,
        platform: platform,
        leads: adLeads,
        impressions,
        clicks,
        spend: spendKZT,
        visits,
        paid,
        revenue,
        conversionRate: adLeads > 0 ? (paid / adLeads) * 100 : 0,
      };
    })
    .filter(c => c.impressions > 0 || c.leads > 0 || c.spend > 0 || c.paid > 0) // Only show active campaigns
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 8); // Top 8
  }, [campaigns, filteredLeads, filteredPerformance]);

  // Channel Efficiency Data
  const channelData = useMemo(() => {
      const stats: Record<string, { 
          leads: number, 
          platform: string, 
          spend: number, 
          visits: number, 
          sales: number, 
          revenue: number 
      }> = {
        'Google Ads': { leads: 0, platform: 'google', spend: 0, visits: 0, sales: 0, revenue: 0 },
        'TikTok Ads': { leads: 0, platform: 'tiktok', spend: 0, visits: 0, sales: 0, revenue: 0 }
      };
      
      campaignBreakdown.forEach(c => {
          const pName = getPlatformName(c.platform);
          if (!stats[pName]) stats[pName] = { 
              leads: 0, 
              platform: c.platform,
              spend: 0,
              visits: 0,
              sales: 0,
              revenue: 0
          };
          stats[pName].leads += c.leads;
          stats[pName].spend += c.spend;
          stats[pName].visits += (c as any).visits || 0;
          stats[pName].sales += c.paid;
          stats[pName].revenue += c.revenue;
      });

      const totalLeads = Object.values(stats).reduce((sum, s) => sum + s.leads, 0);
      
      return Object.values(stats)
        .map(s => ({
            name: getPlatformName(s.platform),
            platformName: getPlatformName(s.platform),
            rawPlatform: s.platform,
            value: s.leads,
            spend: s.spend,
            cpl: s.leads > 0 ? s.spend / s.leads : 0,
            visits: s.visits,
            sales: s.sales,
            revenue: s.revenue,
            percentage: totalLeads > 0 ? (s.leads / totalLeads) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value);
  }, [campaignBreakdown]);

  const handleExportCSV = () => {
    const headers = ['Campaign', 'Platform', 'Leads', 'Impressions', 'Clicks', 'Spend KZT', 'Visits', 'Paid', 'Revenue', 'Conversion Rate'];
    const rows = campaignBreakdown.map(c => [
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.platform,
      c.leads,
      c.impressions,
      c.clicks,
      Math.round(c.spend),
      c.visits,
      c.paid,
      c.revenue,
      c.conversionRate.toFixed(2) + '%'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight">Аналитика рекламы</h2>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Экспорт
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Funnel Pyramid */}
        <Card className="h-full overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Воронка продаж</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
                {funnelData.stages.map((stage, index) => {
                    // Calculate visual width: 100% -> 60%
                    const widthPercent = 100 - (index * 10);
                    const nextStage = funnelData.stages[index + 1];
                    const conversionToNext = nextStage && stage.value > 0 
                       ? ((nextStage.value / stage.value) * 100).toFixed(1) + '%' 
                       : null;

                    return (
                        <div key={stage.name} className="relative flex flex-col items-center group">
                            <div 
                                className={cn(
                                    "relative flex items-center justify-between px-4 py-2.5 rounded-lg transition-all hover:brightness-95 cursor-default",
                                    stage.color
                                )}
                                style={{ width: `${widthPercent}%` }}
                            >
                                <div className="flex items-center gap-2">
                                    <stage.icon className="w-4 h-4 opacity-70" />
                                    <span className="text-sm font-medium">{stage.name}</span>
                                </div>
                                <span className="text-sm font-bold">
                                    {stage.name === 'Показы' || stage.name === 'Клики' 
                                        ? new Intl.NumberFormat('ru-RU').format(stage.value)
                                        : stage.value}
                                </span>
                            </div>
                            
                            {/* Connector / Conversion Label */}
                            {conversionToNext && (
                                <div className="h-4 flex items-center justify-center">
                                    <div className="text-[10px] text-muted-foreground bg-background/80 px-1.5 rounded-full border border-border/50 shadow-sm z-10 -my-1">
                                        ↓ {conversionToNext}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                        <div className="text-xs text-muted-foreground">Выручка</div>
                        <div className="text-sm font-bold text-emerald-500">{formatCurrency(funnelData.totalRevenue)}</div>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                        <div className="text-xs text-muted-foreground">ROMI</div>
                        <div className="text-sm font-bold text-blue-500">
                             {/* Placeholder for ROMI if we had spend */}
                             {(campaignBreakdown.reduce((sum, c) => sum + c.spend, 0) > 0) 
                                ? Math.round(((funnelData.totalRevenue - campaignBreakdown.reduce((sum, c) => sum + c.spend, 0)) / campaignBreakdown.reduce((sum, c) => sum + c.spend, 0)) * 100) + '%'
                                : '0%'}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Column 2: Channel Efficiency */}
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Эффективность каналов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {channelData.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">Нет данных по каналам</div>
                )}
                {channelData.map((channel) => (
                    <div key={channel.platformName} className="p-3 border rounded-lg bg-card/50 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: getPlatformColor(channel.rawPlatform) }}
                                />
                                <span className="font-medium text-sm">{channel.platformName}</span>
                            </div>
                            <div className="text-sm font-bold text-emerald-500">
                                {formatCurrency(channel.revenue)}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-xs">
                             <div className="text-center p-1.5 rounded bg-background/50 border border-border/50">
                                <div className="text-muted-foreground mb-0.5 text-[10px]">Лиды</div>
                                <div className="font-medium">{channel.value}</div>
                             </div>
                             <div className="text-center p-1.5 rounded bg-background/50 border border-border/50">
                                <div className="text-muted-foreground mb-0.5 text-[10px]">CPL</div>
                                <div className="font-medium">{formatCurrency(channel.cpl)}</div>
                             </div>
                             <div className="text-center p-1.5 rounded bg-background/50 border border-border/50">
                                <div className="text-muted-foreground mb-0.5 text-[10px]">Записи</div>
                                <div className="font-medium">{channel.visits}</div>
                             </div>
                             <div className="text-center p-1.5 rounded bg-background/50 border border-border/50">
                                <div className="text-muted-foreground mb-0.5 text-[10px]">Продажи</div>
                                <div className="font-medium">{channel.sales}</div>
                             </div>
                        </div>
                    </div>
                ))}

                <div className="pt-4 mt-auto">
                   <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                      <div className="flex items-start gap-3">
                         <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                         <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-blue-500 block mb-1">Рекомендация</span>
                            {channelData[0]?.platformName === 'Meta Ads' 
                               ? 'Meta Ads приносит больше всего лидов. Рекомендуем масштабировать бюджет на успешные кампании.'
                               : 'Рассмотрите возможность диверсификации каналов для снижения рисков.'}
                         </div>
                      </div>
                   </div>
                </div>
            </CardContent>
        </Card>

        {/* Column 3: Top Campaigns */}
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Топ кампаний</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-[350px] overflow-y-auto">
                    {campaignBreakdown.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">Нет активных кампаний</div>
                    )}
                    {campaignBreakdown.map((campaign, i) => (
                        <div 
                            key={campaign.name} 
                            className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="flex-shrink-0 text-xs font-bold text-muted-foreground w-4 text-center">
                                    {i + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium truncate" title={campaign.fullName}>
                                        {campaign.name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <div 
                                            className="w-1.5 h-1.5 rounded-full" 
                                            style={{ backgroundColor: getPlatformColor(campaign.platform) }}
                                        />
                                        {getPlatformName(campaign.platform)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-right flex-shrink-0">
                                <div className="text-sm font-bold">{campaign.leads} <span className="text-[10px] font-normal text-muted-foreground">лидов</span></div>
                                <div className="text-[10px] text-muted-foreground">
                                    Conv: <span className={campaign.conversionRate > 1 ? "text-emerald-500" : ""}>{campaign.conversionRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};
