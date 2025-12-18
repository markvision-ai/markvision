import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  DollarSign, 
  Eye, 
  Users, 
  Target, 
  ShoppingCart, 
  Wallet,
  TrendingUp,
  Calculator,
  MousePointer
} from 'lucide-react';

import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { MetricCard } from './dashboard/MetricCard';
import { PlanFactCard } from './dashboard/PlanFactCard';
import { FunnelChart } from './dashboard/FunnelChart';
import { QuickStats } from './dashboard/QuickStats';
import { DataTable } from './dashboard/DataTable';
import { RevenueChart } from './dashboard/RevenueChart';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks?: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

export const AnalyticsPlatform = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentProject, setCurrentProject] = useState('project1');
  
  const projects = [
    { id: 'project1', name: 'Стоматология "Улыбка"' },
    { id: 'project2', name: 'Автосервис "Мотор"' },
    { id: 'project3', name: 'Фитнес клуб "Энергия"' },
  ];

  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }));

  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({
    '2025-12-01': { date: '2025-12-01', spend: 45000, impressions: 120000, clicks: 3600, leads: 35, diagnostics: 12, sales: 4, revenue: 180000 },
    '2025-12-02': { date: '2025-12-02', spend: 52000, impressions: 145000, clicks: 4350, leads: 42, diagnostics: 15, sales: 5, revenue: 225000 },
    '2025-12-03': { date: '2025-12-03', spend: 38000, impressions: 98000, clicks: 2940, leads: 28, diagnostics: 9, sales: 3, revenue: 135000 },
    '2025-12-04': { date: '2025-12-04', spend: 61000, impressions: 167000, clicks: 5010, leads: 55, diagnostics: 18, sales: 6, revenue: 270000 },
    '2025-12-05': { date: '2025-12-05', spend: 47000, impressions: 132000, clicks: 3960, leads: 38, diagnostics: 14, sales: 5, revenue: 225000 },
    '2025-12-06': { date: '2025-12-06', spend: 55000, impressions: 155000, clicks: 4650, leads: 48, diagnostics: 16, sales: 6, revenue: 280000 },
    '2025-12-07': { date: '2025-12-07', spend: 42000, impressions: 110000, clicks: 3300, leads: 32, diagnostics: 11, sales: 4, revenue: 190000 },
    '2025-12-08': { date: '2025-12-08', spend: 58000, impressions: 160000, clicks: 4800, leads: 50, diagnostics: 17, sales: 7, revenue: 320000 },
  });

  const [planData, setPlanData] = useState<PlanData>({
    spend: 1500000,
    impressions: 5000000,
    clicks: 150000,
    leads: 1200,
    diagnostics: 400,
    sales: 150,
    revenue: 7000000,
  });

  const daysInRange = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  }, [dateRange]);

  const totals = useMemo(() => {
    const rangeDays = daysInRange.map(d => format(d, 'yyyy-MM-dd'));
    const rangeData = rangeDays.map(date => dailyData[date]).filter(Boolean);

    return rangeData.reduce(
      (acc, day) => ({
        spend: acc.spend + (day.spend || 0),
        impressions: acc.impressions + (day.impressions || 0),
        clicks: acc.clicks + (day.clicks || 0),
        leads: acc.leads + (day.leads || 0),
        diagnostics: acc.diagnostics + (day.diagnostics || 0),
        sales: acc.sales + (day.sales || 0),
        revenue: acc.revenue + (day.revenue || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 }
    );
  }, [dailyData, daysInRange]);

  // Computed metrics
  const aov = totals.sales > 0 ? totals.revenue / totals.sales : 0;
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const cac = totals.sales > 0 ? totals.spend / totals.sales : 0;
  const conversionRate = totals.leads > 0 ? (totals.sales / totals.leads) * 100 : 0;
  const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const romi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;

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

  const handlePlanChange = (field: keyof PlanData, value: number) => {
    setPlanData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const funnelSteps = [
    { label: 'Показы', value: totals.impressions, color: 'hsl(220, 90%, 56%)' },
    { label: 'Клики', value: totals.clicks, color: 'hsl(200, 80%, 50%)' },
    { label: 'Лиды', value: totals.leads, color: 'hsl(262, 83%, 58%)' },
    { label: 'Диагностики', value: totals.diagnostics, color: 'hsl(38, 92%, 50%)' },
    { label: 'Продажи', value: totals.sales, color: 'hsl(142, 76%, 36%)' },
  ];

  const comparisonStats = [
    { label: 'Выручка', current: totals.revenue, previous: totals.revenue * 0.85, format: 'currency' as const },
    { label: 'Лиды', current: totals.leads, previous: totals.leads * 0.92, format: 'number' as const },
    { label: 'Конверсия', current: conversionRate, previous: conversionRate * 0.88, format: 'percent' as const },
    { label: 'ROMI', current: romi, previous: romi * 0.78, format: 'percent' as const },
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Дашборд';
      case 'table': return 'Таблица данных';
      case 'analytics': return 'Аналитика';
      case 'funnel': return 'Воронка продаж';
      case 'reports': return 'Отчёты';
      case 'team': return 'Команда';
      case 'settings': return 'Настройки';
      default: return 'Раздел в разработке';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        currentProject={currentProject}
        projects={projects}
        onProjectChange={setCurrentProject}
      />
      
      <div className="ml-64">
        <Header 
          title={getTabTitle()} 
          subtitle={projects.find(p => p.id === currentProject)?.name}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          showDatePicker={['dashboard', 'analytics'].includes(activeTab)}
        />
        
        <main className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Main Metrics with Plan/Fact */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <PlanFactCard
                  label="Расходы"
                  value={formatCurrency(totals.spend)}
                  plan={planData.spend}
                  fact={totals.spend}
                  icon={<DollarSign className="w-5 h-5 text-destructive" />}
                  format="currency"
                />
                <PlanFactCard
                  label="Показы"
                  value={formatNumber(totals.impressions)}
                  plan={planData.impressions}
                  fact={totals.impressions}
                  icon={<Eye className="w-5 h-5 text-primary" />}
                  format="number"
                />
                <PlanFactCard
                  label="Лиды"
                  value={formatNumber(totals.leads)}
                  plan={planData.leads}
                  fact={totals.leads}
                  icon={<Users className="w-5 h-5 text-accent" />}
                  format="number"
                />
                <PlanFactCard
                  label="Диагностики"
                  value={formatNumber(totals.diagnostics)}
                  plan={planData.diagnostics}
                  fact={totals.diagnostics}
                  icon={<Target className="w-5 h-5 text-warning" />}
                  format="number"
                />
                <PlanFactCard
                  label="Продажи"
                  value={formatNumber(totals.sales)}
                  plan={planData.sales}
                  fact={totals.sales}
                  icon={<ShoppingCart className="w-5 h-5 text-success" />}
                  format="number"
                />
                <PlanFactCard
                  label="Выручка"
                  value={formatCurrency(totals.revenue)}
                  plan={planData.revenue}
                  fact={totals.revenue}
                  icon={<Wallet className="w-5 h-5 text-success" />}
                  format="currency"
                />
              </div>

              {/* Computed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard
                  label="Средний чек (AOV)"
                  value={formatCurrency(aov)}
                  subValue="Выручка / Продажи"
                  icon={<Calculator className="w-5 h-5 text-primary" />}
                  variant="primary"
                />
                <MetricCard
                  label="Цена лида (CPL)"
                  value={formatCurrency(cpl)}
                  subValue="Расходы / Лиды"
                  variant={cpl > 5000 ? 'danger' : 'default'}
                />
                <MetricCard
                  label="Цена клиента (CAC)"
                  value={formatCurrency(cac)}
                  subValue="Расходы / Продажи"
                />
                <MetricCard
                  label="ROMI"
                  value={`${romi.toFixed(1)}%`}
                  subValue="(Выручка - Расход) / Расход"
                  variant={romi < 0 ? 'danger' : romi > 100 ? 'success' : 'default'}
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
                <RevenueChart data={dailyData} daysInMonth={daysInRange} />
                <FunnelChart steps={funnelSteps} />
              </div>

              {/* Comparison */}
              <QuickStats stats={comparisonStats} />
            </div>
          )}

          {activeTab === 'table' && (
            <DataTable 
              dailyData={dailyData} 
              onDataChange={handleDataChange}
              planData={planData}
              onPlanChange={handlePlanChange}
            />
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Efficiency Metrics */}
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Метрики эффективности</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">CPL (Цена лида)</div>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(cpl)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Расход / Лиды</div>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">CAC (Цена клиента)</div>
                    <div className="text-2xl font-bold">{formatCurrency(cac)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Расход / Продажи</div>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">AOV (Средний чек)</div>
                    <div className="text-2xl font-bold text-success">{formatCurrency(aov)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Выручка / Продажи</div>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="text-sm text-muted-foreground">ROMI</div>
                    <div className={`text-2xl font-bold ${romi >= 100 ? 'text-success' : romi >= 0 ? 'text-warning' : 'text-destructive'}`}>
                      {romi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">(Выручка - Расход) / Расход × 100%</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart data={dailyData} daysInMonth={daysInRange} />
                <QuickStats stats={comparisonStats} />
              </div>

              <FunnelChart steps={funnelSteps} />
            </div>
          )}

          {activeTab === 'funnel' && (
            <div className="space-y-6">
              <FunnelChart steps={funnelSteps} />
              
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Конверсии между этапами</h3>
                <div className="space-y-4">
                  {funnelSteps.slice(0, -1).map((step, index) => {
                    const nextStep = funnelSteps[index + 1];
                    const conversion = step.value > 0 ? (nextStep.value / step.value) * 100 : 0;
                    
                    return (
                      <div key={step.label} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium">{step.label}</div>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${conversion}%`,
                              backgroundColor: nextStep.color 
                            }}
                          />
                        </div>
                        <div className="w-20 text-right">
                          <span className="font-bold">{conversion.toFixed(1)}%</span>
                        </div>
                        <div className="w-32 text-sm text-muted-foreground">→ {nextStep.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Отчёты</h3>
              <p className="text-muted-foreground">Генерация отчётов будет доступна после подключения базы данных.</p>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Команда</h3>
              <p className="text-muted-foreground">Управление командой будет доступно после подключения авторизации.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Настройки</h3>
              <p className="text-muted-foreground">Настройки проекта будут доступны после подключения базы данных.</p>
            </div>
          )}

          {!['dashboard', 'table', 'analytics', 'funnel', 'reports', 'team', 'settings'].includes(activeTab) && (
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
