import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from 'recharts';
import { TrendingUp, Users, CalendarCheck, CreditCard, DollarSign, Target, ChevronRight } from 'lucide-react';
import { Campaign } from '@/hooks/useCampaigns';
import { Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRange } from 'react-day-picker';

interface CampaignFunnelChartProps {
  campaigns: Campaign[];
  leads: Lead[];
  dateRange?: DateRange;
}

interface FunnelStage {
  name: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  percentage?: number;
}

// Removed internal PeriodFilter - now using dateRange from parent

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} млн ₸`;
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

function getPlatformColor(platform: string) {
  switch (platform) {
    case 'facebook': return '#1877F2';
    case 'google': return '#EA4335';
    case 'tiktok': return '#000000';
    default: return 'hsl(var(--primary))';
  }
}

export const CampaignFunnelChart = ({ campaigns, leads, dateRange }: CampaignFunnelChartProps) => {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  // Use leads directly - they're already filtered by parent component
  const filteredLeads = leads;

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
        name: campaign.name.length > 12 ? campaign.name.slice(0, 12) + '...' : campaign.name,
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-xs">
          <p className="font-medium mb-1.5 text-sm">{data.fullName || data.name}</p>
          <div className="space-y-0.5 text-muted-foreground">
            <p>Лиды: <span className="text-foreground font-medium">{data.leads}</span></p>
            <p>Записи: <span className="text-foreground font-medium">{data.appointments}</span></p>
            <p>Оплаты: <span className="text-foreground font-medium">{data.paid}</span></p>
            <p>Выручка: <span className="text-success font-medium">{formatCurrency(data.revenue)}</span></p>
            <p>Конверсия: <span className="text-foreground font-medium">{data.conversionRate.toFixed(1)}%</span></p>
          </div>
          <p className="text-[10px] text-primary mt-1.5">Нажмите для детальной воронки</p>
        </div>
      );
    }
    return null;
  };

  const PlatformTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-2.5 text-xs">
          <p className="font-medium mb-1">{data.name}</p>
          <div className="space-y-0.5 text-muted-foreground">
            <p>Лиды: <span className="text-foreground font-medium">{data.leads}</span></p>
            <p>Оплаты: <span className="text-foreground font-medium">{data.paid}</span></p>
            <p>Конверсия: <span className="text-foreground font-medium">{data.conversionRate.toFixed(1)}%</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any) => {
    if (data && data.fullName) {
      setSelectedCampaign(data.fullName);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Date range label
  const dateRangeLabel = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, 'dd MMM', { locale: ru })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: ru })}`
    : 'Все время';

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Топ кампаний</h3>
              <p className="text-[10px] text-muted-foreground">{dateRangeLabel}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Funnel Summary */}
            <motion.div variants={itemVariants}>
              <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-4 hover:border-border/60 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">Воронка продаж</h4>
                </div>
                  <div className="space-y-3">
                    {funnelData.stages.map((stage, index) => (
                      <motion.div 
                        key={stage.name} 
                        className="relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="p-1 rounded" 
                              style={{ backgroundColor: `${stage.color}20` }}
                            >
                              <span style={{ color: stage.color }}>{stage.icon}</span>
                            </div>
                            <span className="font-medium text-xs sm:text-sm">{stage.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm sm:text-base">{stage.value}</span>
                            {index > 0 && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
                                ({stage.percentage?.toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-6 bg-muted/50 rounded overflow-hidden">
                          <motion.div 
                            className="h-full rounded"
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{ 
                              backgroundColor: stage.color,
                              opacity: 0.8
                            }}
                          />
                        </div>
                        {index < funnelData.stages.length - 1 && (
                          <div className="flex justify-center my-1">
                            <span className="text-[10px] text-muted-foreground">
                              ↓ {funnelData.stages[index + 1].value > 0 && stage.value > 0
                                ? ((funnelData.stages[index + 1].value / stage.value) * 100).toFixed(0)
                                : 0}%
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Summary stats */}
                    <div className="pt-3 border-t mt-3 grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Выручка</p>
                        <p className="text-sm sm:text-base font-bold text-success">
                          {formatCurrency(funnelData.totalRevenue)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Конверсия</p>
                        <p className="text-sm sm:text-base font-bold">
                          {funnelData.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            </motion.div>

            {/* Campaign Breakdown Bar Chart */}
            <motion.div variants={itemVariants}>
              <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-4 hover:border-border/60 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold text-foreground">Лиды по кампаниям</h4>
                </div>
                  {campaignBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart 
                        data={campaignBreakdown} 
                        layout="vertical"
                        margin={{ top: 0, right: 25, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          width={80}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="leads" 
                          radius={[0, 4, 4, 0]} 
                          barSize={20}
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
                            fontSize={10}
                            fill="hsl(var(--muted-foreground))"
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                      <p>Нет данных</p>
                    </div>
                  )}
                  
                  {/* Platform legend */}
                  <div className="flex flex-wrap gap-3 justify-center mt-3 pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                      <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#1877F2' }} />
                      <span>Facebook</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                      <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#EA4335' }} />
                      <span>Google</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                      <div className="w-2.5 h-2.5 rounded bg-foreground" />
                      <span>TikTok</span>
                    </div>
                  </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Platform Comparison Chart */}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-4 hover:border-border/60 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-success" />
                <h4 className="text-xs font-semibold text-foreground">Сравнение платформ</h4>
              </div>
                {platformComparison.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bar chart for conversion rates */}
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={platformComparison} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<PlatformTooltip />} />
                        <Bar dataKey="conversionRate" radius={[4, 4, 0, 0]} barSize={40}>
                          {platformComparison.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <LabelList 
                            dataKey="conversionRate" 
                            position="top" 
                            fontSize={10}
                            formatter={(value: number) => `${value.toFixed(1)}%`}
                            fill="hsl(var(--foreground))"
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Pie chart for leads distribution */}
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={platformComparison}
                          dataKey="leads"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={55}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                          fontSize={10}
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
                  <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">
                    <p>Нет данных для сравнения</p>
                  </div>
                )}
                
                {/* Platform summary cards */}
                {platformComparison.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-3 border-t">
                    {platformComparison.map(platform => (
                      <motion.div 
                        key={platform.platform} 
                        className="text-center p-2 sm:p-3 rounded-lg"
                        style={{ backgroundColor: `${platform.color}10` }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{platform.name}</p>
                        <p className="text-sm sm:text-lg font-bold" style={{ color: platform.color }}>
                          {platform.conversionRate.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {platform.paid}/{platform.leads}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Campaign Detail Dialog */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              {selectedCampaignData && (
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: getPlatformColor(selectedCampaignData.platform) }} 
                />
              )}
              <span className="truncate">{selectedCampaign}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedCampaignData && (
            <div className="space-y-3">
              {/* Detailed funnel stages */}
              <div className="space-y-2">
                {selectedCampaignData.stages.map((stage, index) => (
                  <motion.div 
                    key={stage.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium">{stage.name}</span>
                      <div className="text-right">
                        <span className="font-bold text-sm">{stage.value}</span>
                        {index > 0 && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({stage.percentage.toFixed(0)}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-5 bg-muted/50 rounded overflow-hidden">
                      <motion.div 
                        className="h-full rounded"
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percentage}%` }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        style={{ 
                          backgroundColor: stage.color,
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Выручка</p>
                  <p className="text-sm font-bold text-success">
                    {formatCurrency(selectedCampaignData.revenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Конверсия</p>
                  <p className="text-sm font-bold">
                    {selectedCampaignData.conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full text-sm" 
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
