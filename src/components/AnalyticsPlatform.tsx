import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  DollarSign, 
  Eye, 
  Users, 
  Target, 
  ShoppingCart, 
  Wallet,
  TrendingUp,
  Calculator
} from 'lucide-react';

import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { MetricCard } from './dashboard/MetricCard';
import { FunnelChart } from './dashboard/FunnelChart';
import { QuickStats } from './dashboard/QuickStats';
import { DataTable } from './dashboard/DataTable';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

export const AnalyticsPlatform = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({
    // Demo data
    '2025-12-01': { date: '2025-12-01', spend: 45000, impressions: 120000, leads: 35, diagnostics: 12, sales: 4, revenue: 180000 },
    '2025-12-02': { date: '2025-12-02', spend: 52000, impressions: 145000, leads: 42, diagnostics: 15, sales: 5, revenue: 225000 },
    '2025-12-03': { date: '2025-12-03', spend: 38000, impressions: 98000, leads: 28, diagnostics: 9, sales: 3, revenue: 135000 },
    '2025-12-04': { date: '2025-12-04', spend: 61000, impressions: 167000, leads: 55, diagnostics: 18, sales: 6, revenue: 270000 },
    '2025-12-05': { date: '2025-12-05', spend: 47000, impressions: 132000, leads: 38, diagnostics: 14, sales: 5, revenue: 225000 },
  });

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const totals = useMemo(() => {
    const monthDays = daysInMonth.map(d => format(d, 'yyyy-MM-dd'));
    const monthData = monthDays.map(date => dailyData[date]).filter(Boolean);

    return monthData.reduce(
      (acc, day) => ({
        spend: acc.spend + (day.spend || 0),
        impressions: acc.impressions + (day.impressions || 0),
        leads: acc.leads + (day.leads || 0),
        diagnostics: acc.diagnostics + (day.diagnostics || 0),
        sales: acc.sales + (day.sales || 0),
        revenue: acc.revenue + (day.revenue || 0),
      }),
      { spend: 0, impressions: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 }
    );
  }, [dailyData, daysInMonth]);

  // Computed metrics
  const aov = totals.sales > 0 ? totals.revenue / totals.sales : 0;
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const conversionRate = totals.leads > 0 ? (totals.sales / totals.leads) * 100 : 0;
  const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  const handleDataChange = (date: string, field: keyof DailyData, value: number) => {
    setDailyData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        date,
        [field]: value,
      },
    }));
  };

  const funnelSteps = [
    { label: 'Показы', value: totals.impressions, color: 'hsl(220, 90%, 56%)' },
    { label: 'Лиды', value: totals.leads, color: 'hsl(262, 83%, 58%)' },
    { label: 'Диагностики', value: totals.diagnostics, color: 'hsl(38, 92%, 50%)' },
    { label: 'Продажи', value: totals.sales, color: 'hsl(142, 76%, 36%)' },
  ];

  const comparisonStats = [
    { label: 'Выручка', current: totals.revenue, previous: totals.revenue * 0.85, format: 'currency' as const },
    { label: 'Лиды', current: totals.leads, previous: totals.leads * 0.92, format: 'number' as const },
    { label: 'Конверсия', current: conversionRate, previous: conversionRate * 0.88, format: 'percent' as const },
    { label: 'ROI', current: roi, previous: roi * 0.78, format: 'percent' as const },
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Дашборд';
      case 'table': return 'Таблица данных';
      case 'analytics': return 'Аналитика';
      case 'funnel': return 'Воронка продаж';
      default: return 'Раздел в разработке';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="ml-64">
        <Header 
          title={getTabTitle()} 
          subtitle={`Данные за ${format(currentMonth, 'LLLL yyyy', { locale: ru })}`} 
        />
        
        <main className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Main Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard
                  label="Расходы"
                  value={formatCurrency(totals.spend)}
                  icon={<DollarSign className="w-5 h-5 text-destructive" />}
                  variant="danger"
                />
                <MetricCard
                  label="Показы"
                  value={formatNumber(totals.impressions)}
                  icon={<Eye className="w-5 h-5 text-primary" />}
                  trend={{ value: 12.5, isPositive: true }}
                />
                <MetricCard
                  label="Лиды"
                  value={formatNumber(totals.leads)}
                  icon={<Users className="w-5 h-5 text-accent" />}
                  trend={{ value: 8.3, isPositive: true }}
                />
                <MetricCard
                  label="Диагностики"
                  value={formatNumber(totals.diagnostics)}
                  icon={<Target className="w-5 h-5 text-warning" />}
                />
                <MetricCard
                  label="Продажи"
                  value={formatNumber(totals.sales)}
                  icon={<ShoppingCart className="w-5 h-5 text-success" />}
                />
                <MetricCard
                  label="Выручка"
                  value={formatCurrency(totals.revenue)}
                  icon={<Wallet className="w-5 h-5 text-success" />}
                  variant="success"
                  trend={{ value: 15.2, isPositive: true }}
                />
              </div>

              {/* Computed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard
                  label="Средний чек"
                  value={formatCurrency(aov)}
                  subValue="Выручка / Продажи"
                  icon={<Calculator className="w-5 h-5 text-primary" />}
                  variant="primary"
                />
                <MetricCard
                  label="Цена лида (CPL)"
                  value={formatCurrency(cpl)}
                  subValue={cpl > 5000 ? '⚠️ Дорогие лиды' : 'Расходы / Лиды'}
                  variant={cpl > 5000 ? 'danger' : 'default'}
                />
                <MetricCard
                  label="Конверсия"
                  value={`${conversionRate.toFixed(1)}%`}
                  subValue="Лиды → Продажи"
                />
                <MetricCard
                  label="ROI"
                  value={`${roi.toFixed(1)}%`}
                  subValue="Окупаемость"
                  variant={roi < 0 ? 'danger' : roi > 100 ? 'success' : 'default'}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <MetricCard
                  label="ROAS"
                  value={`${roas.toFixed(2)}x`}
                  subValue={`₸1 → ₸${roas.toFixed(2)}`}
                  variant={roas < 1 ? 'danger' : roas > 2 ? 'success' : 'warning'}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunnelChart steps={funnelSteps} />
                <QuickStats stats={comparisonStats} />
              </div>
            </div>
          )}

          {activeTab === 'table' && (
            <DataTable 
              dailyData={dailyData} 
              onDataChange={handleDataChange} 
            />
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FunnelChart steps={funnelSteps} />
              <QuickStats stats={comparisonStats} />
              <div className="lg:col-span-2">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Детальная аналитика</h3>
                  <p className="text-muted-foreground">Графики и диаграммы будут здесь...</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'funnel' && (
            <div className="max-w-3xl">
              <FunnelChart steps={funnelSteps} />
            </div>
          )}

          {!['dashboard', 'table', 'analytics', 'funnel'].includes(activeTab) && (
            <div className="bg-card border rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Раздел в разработке</h3>
              <p className="text-muted-foreground">Этот функционал скоро будет доступен</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AnalyticsPlatform;
