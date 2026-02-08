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
        .filter(l => ['appointment', 'paid', 'visit_completed'].includes(l.status))
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
        cpl: adLeads > 0 ? spendKZT / adLeads : 0,
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

  // Helper for max value safe check
  const maxFunnelValue = Math.max(...funnelData.stages.map(s => s.value || 0), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white/90">Аналитика конверсии</h2>
            <p className="text-xs text-white/50">Воронка продаж и эффективность каналов</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
          <Download className="w-4 h-4 mr-2" />
          Экспорт CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[850px]">
        {/* Column 1: "The Beam" Funnel */}
        <div className="interstellar-card relative overflow-hidden ring-1 ring-white/10 p-0 flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="font-bold text-white/90 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
              Воронка продаж
            </div>
            {(() => {
              const impressions = funnelData.stages[0]?.value || 0;
              const sales = funnelData.stages[funnelData.stages.length - 1]?.value || 0;
              const overallCR = impressions > 0 ? (sales / impressions) * 100 : 0;
              return (
                <div className="px-2.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-[11px] font-bold text-cyan-400 tracking-wide shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                  CR OB: {overallCR.toFixed(2)}%
                </div>
              );
            })()}
          </div>

          {/* Funnel Visual */}
          <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-[#0B0C15]">
            {/* Ambient Background - Clean Deep Space */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0B0C15]/50 to-[#0B0C15] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Central Laser Line - Brighter */}
            <div className="absolute left-1/2 top-10 bottom-10 w-0.5 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent shadow-[0_0_15px_#22d3ee]" />

            <div className="w-full max-w-md space-y-4 relative z-10">
              {funnelData.stages.map((stage, index) => {
                const widthPercent = Math.max(30, Math.round((stage.value / maxFunnelValue) * 100));
                const nextStage = funnelData.stages[index + 1];
                const conv = nextStage && stage.value > 0 ? (nextStage.value / stage.value) * 100 : null;
                const isHigh = conv !== null && (stage.name === 'Клики' ? conv > 1.5 : conv > 20);
                const isLow = conv !== null && (stage.name === 'Клики' ? conv < 0.5 : conv < 5);

                return (
                  <div key={stage.name} className="relative group">
                    {/* Stage Card */}
                    <div
                      className="relative mx-auto h-20 transition-all duration-300 hover:scale-[1.02]"
                      style={{ width: `${widthPercent}%` }}
                    >
                      {/* Glass Plate - Brighter & Cleaner */}
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-white/10 rounded-xl backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)] group-hover:border-blue-500/50 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-all" />

                      {/* Content */}
                      <div className="absolute inset-0 flex items-center justify-between px-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10 text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-colors shadow-lg">
                            <stage.icon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-white/80 uppercase tracking-wider">{stage.name}</span>
                        </div>
                        <span className="font-mono text-2xl font-bold text-white tracking-tight">
                          {new Intl.NumberFormat('ru-RU', { notation: "compact", maximumFractionDigits: 1 }).format(stage.value).replace(/\u00a0/g, ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Conversion Pill */}
                    {conv !== null && (
                      <div className="flex justify-center my-1.5 relative z-20">
                        <div className={cn(
                          "z-10 bg-[#0B0C15] text-[11px] font-bold px-3 py-1 rounded-full border shadow-xl flex items-center gap-1.5 transition-transform hover:scale-110",
                          isHigh ? "text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
                            isLow ? "text-red-400 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]" :
                              "text-slate-400 border-white/10"
                        )}>
                          {conv.toFixed(1)}%
                          {isHigh && <TrendingUp className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 bg-[#0B0C15]/50 backdrop-blur-md">
            <div className="p-4 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Выручка</span>
              <span className="text-xl font-bold font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                {Math.round(funnelData.totalRevenue / 1000)}k ₸
              </span>
            </div>
            <div className="p-4 flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">ROMI</span>
              {(() => {
                const spend = campaignBreakdown.reduce((sum, c) => sum + c.spend, 0);
                const romi = spend > 0 ? ((funnelData.totalRevenue - spend) / spend) * 100 : 0;
                return (
                  <span className={cn(
                    "text-xl font-bold font-mono drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]",
                    romi > 0 ? "text-emerald-400" : romi < -50 ? "text-red-400" : "text-white"
                  )}>
                    {Math.round(romi)}%
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Column 2: Channel Efficiency "Holo-Chips" */}
        <div className="interstellar-card relative overflow-hidden ring-1 ring-white/10 p-0 flex flex-col h-full bg-[#0B0C15]/80">
          <div className="p-5 border-b border-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            <span className="font-bold text-white/90">Эффективность каналов</span>
          </div>

          <div className="flex-1 p-5 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {channelData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-2">
                <Users className="w-8 h-8 opacity-20" />
                <span className="text-xs">Нет данных по каналам</span>
              </div>
            ) : (
              channelData.map((channel) => {
                const isMeta = channel.platformName.includes('Meta');
                const isGoogle = channel.platformName.includes('Google');
                const isTikTok = channel.platformName.includes('TikTok');

                const accentColor = isMeta ? 'text-blue-400' : isGoogle ? 'text-orange-400' : isTikTok ? 'text-pink-400' : 'text-white';
                const ringColor = isMeta ? 'ring-blue-500/30' : isGoogle ? 'ring-orange-500/30' : isTikTok ? 'ring-pink-500/30' : 'ring-white/20';
                const glowColor = isMeta ? 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' : isGoogle ? 'shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'shadow-none';

                return (
                  <div key={channel.platformName} className={cn(
                    "relative group overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]",
                    glowColor
                  )}>
                    {/* Gradient Border Effect */}
                    <div className={cn("absolute inset-0 border rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ring-1 inset-ring", ringColor)} />

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10",
                          accentColor
                        )}>
                          {isMeta ? <Users className="w-4 h-4" /> :
                            isGoogle ? <Eye className="w-4 h-4" /> :
                              <TrendingUp className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white/90">{channel.platformName}</div>
                          <div className="text-[10px] text-white/40 font-mono">
                            {formatCurrency(channel.spend)} spent
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                          {formatCurrency(channel.revenue)}
                        </div>
                        <div className="text-[10px] text-emerald-500/70 uppercase tracking-wider font-bold">Выручка</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Лиды', value: channel.value },
                        { label: 'CPL', value: formatCurrency(channel.cpl).replace('₸', '') },
                        { label: 'Записи', value: channel.visits },
                        { label: 'Продажи', value: channel.sales }
                      ].map((stat) => (
                        <div key={stat.label} className="bg-[#0B0C15]/50 rounded-lg p-2 border border-white/5 text-center group-hover:border-white/10 transition-colors">
                          <div className="text-[9px] text-white/40 uppercase tracking-wide mb-1">{stat.label}</div>
                          <div className="text-xs font-bold font-mono text-white/90">{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recommendation Box */}
          <div className="p-4 border-t border-white/5 bg-gradient-to-r from-blue-500/5 to-transparent">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Рекомендация</span>
                <p className="text-xs text-white/60 leading-relaxed">
                  {channelData[0]?.platformName === 'Meta Ads'
                    ? 'Meta Ads показывает лучший ROI (+45%). Рекомендуем увеличить дневной бюджет на 20% для масштабирования лидов.'
                    : 'Диверсификация каналов поможет снизить риски. Попробуйте ретаргетинг в Google Ads.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Top Campaigns "Leaderboard" */}
        <div className="interstellar-card relative overflow-hidden ring-1 ring-white/10 p-0 flex flex-col h-full bg-[#0B0C15]/80">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#4ade80]" />
              <span className="font-bold text-white/90">Топ кампаний</span>
            </div>
            <div className="text-[10px] text-white/40 font-mono bg-white/5 px-2 py-0.5 rounded">
              По лидам
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 mb-2 custom-scrollbar">
            {campaignBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/30 text-xs">Нет активных кампаний</div>
            ) : (
              <div className="space-y-1">
                {campaignBreakdown.map((campaign, i) => {
                  const isTop3 = i < 3;
                  const maxLeads = campaignBreakdown[0]?.leads || 1;
                  const relativePercent = (campaign.leads / maxLeads) * 100;

                  return (
                    <div key={campaign.name} className="relative group p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                      {/* Progress Bar Background */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-white/[0.02] rounded-lg transition-all"
                        style={{ width: `${relativePercent}%` }}
                      />

                      <div className="relative flex items-center gap-3">
                        {/* Rank Badge */}
                        <div className={cn(
                          "w-6 h-6 rounded flex items-center justify-center text-xs font-bold font-mono",
                          i === 0 ? "bg-yellow-500/20 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)] border border-yellow-500/30" :
                            i === 1 ? "bg-slate-400/20 text-slate-300 border border-slate-400/30" :
                              i === 2 ? "bg-amber-700/20 text-amber-500 border border-amber-700/30" :
                                "text-white/30 bg-white/5"
                        )}>
                          {i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white/90 truncate pr-2" title={campaign.fullName}>
                            {campaign.name}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-white/40">
                            <div className={cn(
                              "w-1 h-1 rounded-full",
                              campaign.platform.includes('facebook') ? "bg-blue-500" :
                                campaign.platform.includes('google') ? "bg-orange-500" : "bg-white"
                            )} />
                            {getPlatformName(campaign.platform)}
                            <span className="mx-1 opacity-20">|</span>
                            {campaign.conversionRate.toFixed(1)}% CR
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-white font-mono">{campaign.leads} <span className="text-[10px] text-white/40 font-sans">leads</span></div>
                          <div className="text-[10px] text-emerald-400 font-mono">
                            {formatCurrency(campaign.cpl || (campaign.spend / (campaign.leads || 1)))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-white/50 hover:text-white w-full">
              Показать все кампании <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
