import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, CalendarCheck, CreditCard, Eye, MousePointerClick, Download, Info, ArrowRight, Filter, BarChart3, Zap } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ru-RU', { notation: "compact", maximumFractionDigits: 1 }).format(value).replace(/\u00a0/g, ' ');
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
  const [selectedMetric, setSelectedMetric] = useState<'cpl' | 'cpc' | 'ctr' | 'cpm'>('cpl');

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
          color: 'text-muted-foreground',
          icon: Eye,
          percentage: 100,
          details: [{ label: 'Всего показов', value: new Intl.NumberFormat('ru-RU').format(impressions) }]
        },
        {
          name: 'Клики',
          value: clicks,
          color: 'text-blue-500',
          icon: MousePointerClick,
          percentage: impressions > 0 ? (clicks / impressions) * 100 : 0,
          details: [
            { label: 'CTR', value: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) + '%' : '0%' }
          ]
        },
        {
          name: 'Лиды',
          value: totalLeads,
          color: 'text-primary',
          icon: Users,
          percentage: clicks > 0 ? (totalLeads / clicks) * 100 : 0,
          details: [
            { label: 'Конверсия в лид', value: clicks > 0 ? ((totalLeads / clicks) * 100).toFixed(2) + '%' : '0%' }
          ]
        },
        {
          name: 'Записи',
          value: appointmentLeads,
          color: 'text-orange-500',
          icon: CalendarCheck,
          percentage: totalLeads > 0 ? (appointmentLeads / totalLeads) * 100 : 0,
          details: [
            { label: 'Конверсия в запись', value: totalLeads > 0 ? ((appointmentLeads / totalLeads) * 100).toFixed(1) + '%' : '0%' }
          ]
        },
        {
          name: 'Оплаты',
          value: paidLeads,
          color: 'text-blue-500',
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

      const impressions = logs.reduce((sum, log) => sum + (Number(log.impressions) || 0), 0);
      const clicks = logs.reduce((sum, log) => sum + (Number(log.clicks) || 0), 0);

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
      const metaLeads = logs.reduce((sum, log) => sum + (Number(log.leads) || 0), 0);
      const adLeads = Math.max(metaLeads, crmLeadsCount);

      const spendKZT = logs.reduce((sum, log) => sum + ((Number(log.spend) || 0) * KZT_RATE), 0);

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
        leads: s.leads,
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

  // Sort channels for display
  const sortedPlacements = [...channelData].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            Воронка конверсии
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-12">Атрибуция и аналитика воронки</p>
        </div>

        <div className="flex gap-4">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-2xl border border-white/50">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Real-time данные</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-10 px-6 rounded-2xl border-white/50 bg-card text-foreground hover:bg-muted font-bold text-[10px] uppercase tracking-widest shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт данных
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[700px]">
        {/* Main Funnel Visualization */}
        <div className="rounded-[2.5rem] border border-white/50 bg-card shadow-sm p-0 flex flex-col overflow-hidden group">
          <div className="p-8 border-b border-white/50 bg-muted/30 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-3">
              <Filter className="w-4 h-4 text-primary" />
              Эффективность этапов
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">Режим: Real-time</span>
          </div>

          <div className="flex-1 relative flex flex-col items-center justify-center p-12 overflow-y-auto">
            <div className="w-full max-w-md space-y-6 relative z-10">
              {funnelData.stages.map((step, index) => {
                const nextStep = funnelData.stages[index + 1];
                const conversion = nextStep && step.value > 0 ? (nextStep.value / step.value) * 100 : 0;

                return (
                  <div key={step.name} className="relative group">
                    {/* Connector Line with Animation */}
                    {index < funnelData.stages.length - 1 && (
                      <div className="absolute left-[36px] top-12 bottom-[-24px] w-px bg-gradient-to-b from-primary/50 to-transparent -z-10 group-hover:from-primary transition-all duration-700" />
                    )}

                    <motion.div
                      whileHover={{ x: 10, scale: 1.02 }}
                      className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-background transition-all duration-500 hover:border-primary/30 hover:bg-muted p-1 shadow-sm"
                    >
                      <div className="p-5 flex items-center gap-6">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/50 shadow-sm transition-transform duration-500 group-hover:rotate-6",
                          step.color.replace('text-', 'bg-').replace('500', '500/10'),
                          step.color
                        )}>
                          <step.icon className="w-7 h-7" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{step.name}</span>
                            <span className="text-2xl font-bold text-foreground px-3 py-1 bg-muted rounded-xl border border-white/50">
                              {step.name === 'Показы' || step.name === 'Клики' || step.name === 'Лиды'
                                ? formatNumber(step.value)
                                : step.value
                              }
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-600 group-hover:text-slate-400">
                              {step.details?.[0]?.label}
                            </span>
                            {index < funnelData.stages.length - 1 && (
                              <div className={cn(
                                "flex items-center gap-2 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border transition-all duration-500",
                                conversion > 20 ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm" : "bg-muted text-muted-foreground border-white/50"
                              )}>
                                {conversion > 0 ? (
                                  <>
                                    <ArrowRight className="w-3 h-3" />
                                    {conversion.toFixed(1)}% Конверсия
                                  </>
                                ) : (
                                  <span className="opacity-30">—</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Stats with Glow and High Contrast */}
          <div className="grid grid-cols-2 divide-x divide-border border-t border-white/50 bg-muted/20">
            <div className="p-8 flex flex-col items-center group/stat">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2 group-hover/stat:text-primary transition-colors">Общая выручка</span>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {formatCurrency(funnelData.totalRevenue)}
              </span>
            </div>
            <div className="p-8 flex flex-col items-center group/stat">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2 group-hover/stat:text-blue-600 transition-colors">Общая эффективность</span>
              {(() => {
                const totalSpend = campaignBreakdown.reduce((sum, c) => sum + c.spend, 0);
                const romi = totalSpend > 0 ? ((funnelData.totalRevenue - totalSpend) / totalSpend) * 100 : 0;
                return (
                  <span className={cn(
                    "text-3xl font-bold tracking-tight",
                    romi > 0 ? "text-blue-600" : romi < -50 ? "text-red-500" : "text-foreground"
                  )}>
                    {Math.round(romi)}% ROMI
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Channel Efficiency Chart */}
        <div className="rounded-[2.5rem] border border-white/50 bg-card shadow-sm p-0 flex flex-col h-full overflow-hidden group">
          <div className="p-8 border-b border-white/50 bg-muted/30 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              Распределение источников
            </h3>
            <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as any)}>
              <SelectTrigger className="w-[180px] h-10 text-[10px] font-bold uppercase tracking-widest bg-background border-white/50 rounded-xl focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/50 rounded-xl">
                <SelectItem value="cpl" className="text-[10px] font-bold uppercase tracking-widest py-3 cursor-pointer">Стоимость лида (CPL)</SelectItem>
                <SelectItem value="cpc" className="text-[10px] font-bold uppercase tracking-widest py-3 cursor-pointer">Стоимость клика (CPC)</SelectItem>
                <SelectItem value="ctr" className="text-[10px] font-bold uppercase tracking-widest py-3 cursor-pointer">Кликабельность (CTR)</SelectItem>
                <SelectItem value="cpm" className="text-[10px) font-bold uppercase tracking-widest py-3 cursor-pointer">Цена за 1000 показов (CPM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 p-10 flex flex-col justify-center overflow-y-auto">
            {sortedPlacements.length > 0 ? (
              <div className="space-y-10">
                {sortedPlacements.map((item, index) => {
                  const val = item[selectedMetric];
                  const maxVal = Math.max(...sortedPlacements.map(i => i[selectedMetric]));
                  const percent = maxVal > 0 ? (val / maxVal) * 100 : 0;

                  return (
                    <div key={item.name} className="space-y-4 group/bar">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border border-white/50 shadow-sm transition-all duration-500 group-hover/bar:scale-110",
                            index === 0 ? "bg-blue-50 text-blue-600" :
                              index === 1 ? "bg-blue-50 text-blue-600" :
                                index === 2 ? "bg-indigo-50 text-indigo-600" : "bg-muted"
                          )}>
                            {item.rawPlatform === 'facebook' ? <Users className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.name}</span>
                            <span className="text-lg font-bold text-foreground uppercase tracking-tight">{item.percentage.toFixed(1)}% Доля</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground tracking-tighter">{formatNumber(item.leads)} ЛИДОВ</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{formatCurrency(item.spend)} ИНВЕСТИРОВАНО</p>
                        </div>
                      </div>

                      <div className="relative h-4 bg-muted rounded-full overflow-hidden p-0.5 border border-white/50">
                        <motion.div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000 shadow-sm",
                            index === 0 ? "bg-gradient-to-r from-blue-600 to-blue-400" :
                              index === 1 ? "bg-gradient-to-r from-blue-600 to-blue-400" :
                                index === 2 ? "bg-gradient-to-r from-indigo-600 to-indigo-400" : "bg-slate-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground h-full gap-4">
                <PieChart className="w-16 h-16 opacity-10" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-30">Ожидание данных для анализа...</p>
              </div>
            )}
          </div>

          {/* AI Insights Engine with Glassmorphism and Neon Accents */}
          <div className="m-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group/ai">
            {/* Animated Pulse in Background */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 blur-[50px] rounded-full animate-pulse" />

            <div className="flex items-start gap-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">ИИ-Ядро: Онлайн</span>
                  <div className="h-px flex-1 bg-primary/10" />
                </div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-tight">Рекомендация по оптимизации</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                  {channelData[0]?.platformName === 'Meta Ads'
                    ? 'ИИ обнаружил высокую эффективность в экосистеме Meta Ads. Прогноз показывает рост конверсии на 22% при динамическом перераспределении бюджета.'
                    : 'Ожидание достаточного объема данных для точных рекомендаций. Диверсифицируйте размещения для установления базовых показателей.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
