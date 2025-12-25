import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subWeeks } from 'date-fns';
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
  Loader2
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { MetricCard } from './dashboard/MetricCard';
import { PlanFactCard } from './dashboard/PlanFactCard';
import { FunnelChart } from './dashboard/FunnelChart';
import { QuickStats } from './dashboard/QuickStats';
import { DataTable } from './dashboard/DataTable';
import { RevenueChart } from './dashboard/RevenueChart';
import { ConversionStats } from './dashboard/ConversionStats';
import { TeamManagement } from './team/TeamManagement';
import { ReportGenerator } from './reports/ReportGenerator';
import { E2EAnalytics } from './analytics/E2EAnalytics';
import { GrowthPoints } from './analytics/GrowthPoints';
import { AIAssistant } from './analytics/AIAssistant';
import { MultichannelAnalytics } from './multichannel/MultichannelAnalytics';
import { UTMAnalytics } from './utm/UTMAnalytics';
import { WebhookSettings } from './settings/WebhookSettings';
import { ClientsManagement } from './clients/ClientsManagement';
import { useProjectData } from '@/hooks/useProjectData';
import { useProjects } from '@/hooks/useProjects';
import { PullToRefresh } from './mobile/PullToRefresh';
import { MobileBottomNav } from './mobile/MobileBottomNav';

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

// Форматирование без копеек
const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

export const AnalyticsPlatform = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { projects, currentProjectId, setCurrentProjectId, currentProject, loading: projectsLoading, createProject } = useProjects();
  const { dailyData, planData, loading: dataLoading, updateDailyData, updatePlanData, refetch } = useProjectData(currentProjectId);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }));

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

  // Данные за прошлую неделю для сравнения
  const previousWeekTotals = useMemo(() => {
    const weekAgoStart = subWeeks(dateRange.from, 1);
    const weekAgoEnd = subWeeks(dateRange.to, 1);
    const prevDays = eachDayOfInterval({ start: weekAgoStart, end: weekAgoEnd });
    const prevDaysFormatted = prevDays.map(d => format(d, 'yyyy-MM-dd'));
    const prevData = prevDaysFormatted.map(date => dailyData[date]).filter(Boolean);

    return prevData.reduce(
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
  }, [dailyData, dateRange]);

  // Computed metrics (округляем)
  const aov = totals.sales > 0 ? Math.round(totals.revenue / totals.sales) : 0;
  const cpl = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : 0;
  const cac = totals.sales > 0 ? Math.round(totals.spend / totals.sales) : 0;
  const conversionRate = totals.leads > 0 ? (totals.sales / totals.leads) * 100 : 0;
  const romi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  const prevConversionRate = previousWeekTotals.leads > 0 ? (previousWeekTotals.sales / previousWeekTotals.leads) * 100 : 0;
  const prevRomi = previousWeekTotals.spend > 0 ? ((previousWeekTotals.revenue - previousWeekTotals.spend) / previousWeekTotals.spend) * 100 : 0;

  const handleDataChange = (date: string, field: keyof DailyData, value: number) => {
    updateDailyData(date, field, value);
  };

  const handlePlanChange = (field: keyof PlanData, value: number) => {
    updatePlanData(field, value);
  };

  const funnelSteps = [
    { label: 'Показы', value: totals.impressions, color: 'hsl(220, 90%, 56%)' },
    { label: 'Клики', value: totals.clicks, color: 'hsl(200, 80%, 50%)' },
    { label: 'Лиды', value: totals.leads, color: 'hsl(262, 83%, 58%)' },
    { label: 'Диагностики', value: totals.diagnostics, color: 'hsl(38, 92%, 50%)' },
    { label: 'Продажи', value: totals.sales, color: 'hsl(142, 76%, 36%)' },
  ];

  // Сравнение с прошлой неделей
  const comparisonStats = [
    { label: 'Выручка', current: totals.revenue, previous: previousWeekTotals.revenue, format: 'currency' as const },
    { label: 'Лиды', current: totals.leads, previous: previousWeekTotals.leads, format: 'number' as const },
    { label: 'Конверсия', current: conversionRate, previous: prevConversionRate, format: 'percent' as const },
    { label: 'ROMI', current: romi, previous: prevRomi, format: 'percent' as const },
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Дашборд';
      case 'table': return 'Таблица данных';
      case 'clients': return 'Клиенты';
      case 'analytics': return 'Аналитика';
      case 'funnel': return 'Воронка продаж';
      case 'e2e-analytics': return 'Сквозная аналитика';
      case 'multichannel': return 'Мультиканальная аналитика';
      case 'utm-analytics': return 'UTM-аналитика';
      case 'growth': return 'Точки роста';
      case 'reports': return 'Отчёты';
      case 'team': return 'Команда';
      case 'settings': return 'Настройки';
      default: return 'Раздел в разработке';
    }
  };

  if (projectsLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const projectsList = projects.map(p => ({ id: p.id, name: p.name }));

  const mainContent = (
    <main className="p-3 md:p-6 pb-20 md:pb-6">
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

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RevenueChart data={dailyData} daysInMonth={daysInRange} />
            <ConversionStats steps={funnelSteps} />
            <AIAssistant 
              context={{
                ...totals,
                cpl,
                cac,
                aov,
                romi,
              }}
            />
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

      {activeTab === 'clients' && (
        <ClientsManagement projectId={currentProjectId} />
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

      {activeTab === 'e2e-analytics' && (
        <E2EAnalytics totals={totals} projectId={currentProjectId} />
      )}

      {activeTab === 'growth' && (
        <GrowthPoints totals={totals} planData={planData} />
      )}

      {activeTab === 'multichannel' && (
        <MultichannelAnalytics projectId={currentProjectId} />
      )}

      {activeTab === 'utm-analytics' && (
        <UTMAnalytics projectId={currentProjectId} />
      )}

      {activeTab === 'reports' && (
        <ReportGenerator 
          data={{
            projectName: currentProject?.name || 'Проект',
            dateRange: dateRange,
            totals,
            funnelSteps,
            metrics: { aov, cpl, cac, romi, roas }
          }}
        />
      )}

      {activeTab === 'team' && (
        <TeamManagement projects={projectsList} />
      )}

      {activeTab === 'settings' && currentProject && (
        <WebhookSettings projectId={currentProject.id} />
      )}
      
      {activeTab === 'settings' && !currentProject && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Настройки</h3>
          <p className="text-muted-foreground">Выберите проект для просмотра настроек.</p>
        </div>
      )}

      {!['dashboard', 'table', 'clients', 'analytics', 'funnel', 'e2e-analytics', 'multichannel', 'utm-analytics', 'growth', 'reports', 'team', 'settings'].includes(activeTab) && (
        <div className="bg-card border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Раздел в разработке</h3>
          <p className="text-muted-foreground">Этот функционал скоро будет доступен</p>
        </div>
      )}
    </main>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        currentProject={currentProjectId || undefined}
        projects={projectsList}
        onProjectChange={setCurrentProjectId}
        onCreateProject={createProject}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      
      <div className="md:ml-64">
        <Header 
          title={getTabTitle()} 
          subtitle={currentProject?.name}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          showDatePicker={['dashboard', 'analytics'].includes(activeTab)}
          onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        {isMobile ? (
          <PullToRefresh onRefresh={handleRefresh}>
            {mainContent}
          </PullToRefresh>
        ) : (
          mainContent
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default AnalyticsPlatform;
