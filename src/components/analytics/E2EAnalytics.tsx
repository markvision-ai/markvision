import { 
  Zap, 
  TrendingUp, 
  FileBarChart, 
  Globe, 
  ArrowRight,
  Facebook,
  Play,
  Search,
  BarChart3,
  Target,
  MousePointer,
  Users,
  DollarSign,
  ShoppingCart,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface E2EAnalyticsProps {
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    diagnostics: number;
    sales: number;
    revenue: number;
  };
}

const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + 'M ₸';
  if (rounded >= 1000) return Math.round(rounded / 1000) + 'K ₸';
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

const formatNumber = (value: number): string => {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

export const E2EAnalytics = ({ totals }: E2EAnalyticsProps) => {
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const leadConv = totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0;
  const saleConv = totals.leads > 0 ? (totals.sales / totals.leads) * 100 : 0;
  const profit = totals.revenue - totals.spend;
  const romi = totals.spend > 0 ? (profit / totals.spend) * 100 : 0;

  const funnelSteps = [
    { 
      icon: Globe, 
      label: 'Показы', 
      value: totals.impressions, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500'
    },
    { 
      icon: MousePointer, 
      label: 'Клики', 
      value: totals.clicks, 
      conversion: ctr,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-500'
    },
    { 
      icon: Users, 
      label: 'Лиды', 
      value: totals.leads, 
      conversion: leadConv,
      color: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-500/10',
      textColor: 'text-violet-500'
    },
    { 
      icon: Target, 
      label: 'Диагностики', 
      value: totals.diagnostics, 
      conversion: totals.leads > 0 ? (totals.diagnostics / totals.leads) * 100 : 0,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-500'
    },
    { 
      icon: ShoppingCart, 
      label: 'Продажи', 
      value: totals.sales, 
      conversion: saleConv,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-500'
    },
    { 
      icon: DollarSign, 
      label: 'Прибыль', 
      value: profit, 
      isCurrency: true,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500'
    },
  ];

  const channels = [
    { 
      name: 'Facebook Ads', 
      icon: Facebook, 
      spend: totals.spend * 0.4, 
      revenue: totals.revenue * 0.35,
      color: 'bg-blue-600',
      leads: Math.round(totals.leads * 0.4)
    },
    { 
      name: 'TikTok Ads', 
      icon: Play, 
      spend: totals.spend * 0.35, 
      revenue: totals.revenue * 0.4,
      color: 'bg-pink-500',
      leads: Math.round(totals.leads * 0.35)
    },
    { 
      name: 'Google Ads', 
      icon: Search, 
      spend: totals.spend * 0.25, 
      revenue: totals.revenue * 0.25,
      color: 'bg-amber-500',
      leads: Math.round(totals.leads * 0.25)
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Сквозная аналитика</h2>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Анализируйте эффективность рекламы от показа до прибыли, чтобы привлекать больше клиентов без увеличения расходов
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            ROMI: {romi.toFixed(0)}%
          </Badge>
        </div>
      </div>

      {/* End-to-End Funnel */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Путь клиента: от показа до прибыли
        </h3>
        
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {funnelSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`w-14 h-14 rounded-2xl ${step.bgColor} flex items-center justify-center mb-3 transition-transform hover:scale-110`}>
                    <Icon className={`w-7 h-7 ${step.textColor}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{step.label}</p>
                  <p className="text-lg font-bold">
                    {step.isCurrency ? formatCurrency(step.value) : formatNumber(step.value)}
                  </p>
                  {step.conversion !== undefined && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {step.conversion.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                {index < funnelSteps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground mx-2 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profit Analysis */}
        <div className="bg-card border rounded-xl p-5 hover:border-primary/50 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <h4 className="font-semibold mb-2">Анализ рекламы по прибыли</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Сквозная аналитика от показа до прибыли по каналам, кампаниям, объявлениям и ключевым словам
          </p>
          <Button variant="ghost" size="sm" className="group-hover:text-primary">
            Подробнее <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Quick Reports */}
        <div className="bg-card border rounded-xl p-5 hover:border-primary/50 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
            <FileBarChart className="w-6 h-6 text-accent-foreground" />
          </div>
          <h4 className="font-semibold mb-2">Любые отчёты в пару кликов</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Отчёты по рекламе, товарам, страницам, регионам, устройствам и другие отчёты за пару минут
          </p>
          <Button variant="ghost" size="sm" className="group-hover:text-primary">
            Подробнее <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* All Sources */}
        <div className="bg-card border rounded-xl p-5 hover:border-primary/50 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 group-hover:bg-success/20 transition-colors">
            <Globe className="w-6 h-6 text-success" />
          </div>
          <h4 className="font-semibold mb-2">Все источники в одном окне</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Автоматический сбор данных по Facebook, TikTok, Google Ads в едином отчёте
          </p>
          <Button variant="ghost" size="sm" className="group-hover:text-primary">
            Подключить <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Channels Overview */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Эффективность по каналам
        </h3>
        
        <div className="space-y-4">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const channelRomi = channel.spend > 0 ? ((channel.revenue - channel.spend) / channel.spend) * 100 : 0;
            const channelProfit = channel.revenue - channel.spend;
            
            return (
              <div key={channel.name} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl hover:bg-secondary transition-colors">
                <div className={`w-10 h-10 rounded-lg ${channel.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{channel.name}</p>
                  <p className="text-sm text-muted-foreground">{channel.leads} лидов</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Расход</p>
                  <p className="font-semibold">{formatCurrency(channel.spend)}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Выручка</p>
                  <p className="font-semibold text-success">{formatCurrency(channel.revenue)}</p>
                </div>
                
                <div className="text-right min-w-[80px]">
                  <p className="text-sm text-muted-foreground">ROMI</p>
                  <Badge className={channelRomi >= 100 ? 'bg-success/20 text-success' : channelRomi >= 0 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}>
                    {channelRomi.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold mb-1">Подключите рекламные кабинеты</h4>
            <p className="text-sm text-muted-foreground">
              Свяжите Facebook, TikTok и Google Ads для автоматического сбора данных
            </p>
          </div>
          <Button>
            Подключить источники
          </Button>
        </div>
      </div>
    </div>
  );
};
