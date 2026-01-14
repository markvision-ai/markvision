import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subWeeks } from 'date-fns';
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
import { useAuth } from '@/hooks/useAuth';

import { AppSidebar } from './AppSidebar';
import { DraggableDashboard } from './dashboard/DraggableDashboard';
import { Header } from './layout/Header';
import { MetricCard } from './dashboard/MetricCard';
import { PlanFactCard } from './dashboard/PlanFactCard';
import { QuickStats } from './dashboard/QuickStats';
import { DataTable } from './dashboard/DataTable';
import { RevenueChart } from './dashboard/RevenueChart';
import { ConversionStats } from './dashboard/ConversionStats';
import { TeamManagement } from './team/TeamManagement';
import { ReportGenerator } from './reports/ReportGenerator';
import { E2EAnalytics } from './analytics/E2EAnalytics';
import { AIAssistant } from './analytics/AIAssistant';
import { AdminHub } from './settings/AdminHub';
import { IntegrationsManagement } from './integrations/IntegrationsManagement';
import { CRMPage } from './crm/CRMPage';
import { AuditLogViewer } from './audit/AuditLogViewer';
import { QuantomAdsPage } from './ads/QuantomAdsPage';
import { ContentFactoryPage } from './factory/ContentFactoryPage';
import { OnboardingWizard } from './onboarding/OnboardingWizard';
import { StaffManagement } from './staff/StaffManagement';
import { KnowledgeBase } from './knowledge/KnowledgeBase';
import { FinanceDashboard } from './finance/FinanceDashboard';
import { OmnichannelInbox } from './inbox/OmnichannelInbox';
import { LeadScoring } from './scoring/LeadScoring';
import { GamificationHub } from './gamification/GamificationHub';
import { ABOptimizer } from './abtesting/ABOptimizer';
import { TechnicalHealth } from './health/TechnicalHealth';
import { RealtimeDashboard } from './dashboard/RealtimeDashboard';
import { UpcomingAppointmentsWidget } from './dashboard/UpcomingAppointmentsWidget';
import { CalendarPage } from './calendar/CalendarPage';
import { DiagnosticsPage } from './diagnostics/DiagnosticsPage';
import { useProjectData } from '@/hooks/useProjectData';
import { useProjects } from '@/hooks/useProjects';
import { PullToRefresh } from './mobile/PullToRefresh';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { cn } from '@/lib/utils';

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
  const location = useLocation();
  const navigate = useNavigate();
  
  // Синхронизация activeTab с URL
  const getTabFromPath = (pathname: string): string => {
    const path = pathname.replace('/', '');
    if (!path || path === 'dashboard') return 'dashboard';
    // Маппинг URL к tab идентификаторам
    const urlToTab: Record<string, string> = {
      'quantum-ads': 'quantom-ads',
      'content-factory': 'factory',
      'ab-tests': 'ab-testing',
      'analytics': 'e2e-analytics',
    };
    return urlToTab[path] || path;
  };
  
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isMobile = useIsMobile();
  const { profile, user } = useAuth();
  
  // Обновляем URL при смене вкладки
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Маппинг tab к URL
    const tabToUrl: Record<string, string> = {
      'dashboard': '/',
      'quantom-ads': '/quantum-ads',
      'factory': '/content-factory',
      'ab-testing': '/ab-tests',
      'e2e-analytics': '/analytics',
    };
    const path = tabToUrl[tab] || `/${tab}`;
    navigate(path, { replace: true });
  }, [navigate]);
  
  // При изменении URL (например F5 или история браузера) - обновляем вкладку
  useEffect(() => {
    const newTab = getTabFromPath(location.pathname);
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname]);
  
  const { projects, currentProjectId, setCurrentProjectId, currentProject, loading: projectsLoading, createProject, deleteProject, refetch: refetchProjects } = useProjects();
  const { dailyData, planData, loading: dataLoading, updateDailyData, updatePlanData, refetch } = useProjectData(currentProjectId);

  // Debug: выводим информацию о текущем проекте (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('✅ MarkVision Core: Realtime Active');
      console.log('🏠 AnalyticsPlatform | ТЕКУЩИЙ ПРОЕКТ ID:', currentProjectId);
      console.log('🏠 AnalyticsPlatform | Проект:', currentProject?.name || 'Не выбран');
      console.log('🏠 AnalyticsPlatform | Пользователь:', user?.email);
      console.log('🏠 AnalyticsPlatform | Всего проектов:', projects.length);
    }
  }, [currentProjectId, currentProject, user, projects]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    await refetchProjects();
  }, [refetch, refetchProjects]);

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
      case 'dashboard': return '🏠 Дашборд';
      case 'table': return '📅 Таблица данных';
      case 'quantom-ads': return '🚀 Quantum Ads';
      case 'crm': return '🤝 CRM';
      case 'factory': return '🎬 Content Factory';
      case 'e2e-analytics': return '📊 Сквозная аналитика';
      case 'reports': return 'Отчёты';
      case 'team': return 'Команда';
      case 'integrations': return 'Интеграции';
      case 'audit': return 'Аудит';
      case 'settings': return 'Настройки';
      case 'staff': return '👥 Персонал';
      case 'inbox': return '📬 Inbox';
      case 'finance': return '💰 Финансы';
      case 'scoring': return '🔥 Lead Scoring';
      case 'gamification': return '🏆 Геймификация';
      case 'ab-testing': return '🧪 A/B Тесты';
      case 'knowledge': return '📚 База знаний';
      case 'health': return '🩺 Здоровье системы';
      case 'onboarding': return '🧭 Онбординг';
      case 'diagnostics': return '📋 Диагностика';
      case 'calendar': return '📅 Календарь';
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

  const projectsList = projects.map(p => ({ id: p.id, name: p.name, owner_id: p.owner_id }));

  const mainContent = (
    <main className="p-3 md:p-6 pb-20 md:pb-6">
      {activeTab === 'dashboard' && (
        <DraggableDashboard>
          {(renderWidget) => (
            <div className="space-y-6">
              {/* Main Metrics with Plan/Fact */}
              {renderWidget('metrics', (
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
              ))}

              {/* Computed Metrics */}
              {renderWidget('computed', (
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
              ))}

              {/* Charts Row */}
              {renderWidget('charts', (
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
                      projectId: currentProjectId || undefined,
                    }}
                  />
                </div>
              ))}

              {/* Comparison */}
              {renderWidget('comparison', (
                <QuickStats stats={comparisonStats} />
              ))}

              {/* Upcoming Appointments Widget */}
              {renderWidget('appointments', (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <UpcomingAppointmentsWidget projectId={currentProjectId} />
                </div>
              ))}
            </div>
          )}
        </DraggableDashboard>
      )}

      {activeTab === 'table' && (
        <DataTable 
          dailyData={dailyData} 
          onDataChange={handleDataChange}
          planData={planData}
          onPlanChange={handlePlanChange}
        />
      )}

      {activeTab === 'crm' && (
        <CRMPage projectId={currentProjectId} />
      )}

      {activeTab === 'realtime' && (
        <RealtimeDashboard projectId={currentProjectId} />
      )}

      {activeTab === 'quantom-ads' && (
        <QuantomAdsPage projectId={currentProjectId} />
      )}

      {activeTab === 'factory' && (
        <ContentFactoryPage projectId={currentProjectId} />
      )}

      {activeTab === 'e2e-analytics' && (
        <E2EAnalytics totals={totals} projectId={currentProjectId} />
      )}

      {activeTab === 'reports' && (
        <ReportGenerator 
          data={{
            projectId: currentProjectId || undefined,
            projectName: currentProject?.name || 'Проект',
            dateRange: dateRange,
            totals,
            planData,
            funnelSteps,
            metrics: { aov, cpl, cac, romi, roas }
          }}
        />
      )}

      {activeTab === 'team' && (
        <TeamManagement projects={projectsList} />
      )}

      {activeTab === 'integrations' && (
        <IntegrationsManagement projectId={currentProjectId || undefined} />
      )}

      {activeTab === 'audit' && (
        <AuditLogViewer />
      )}

      {activeTab === 'settings' && currentProject && (
        <AdminHub projectId={currentProject.id} projects={projects} />
      )}
      
      {activeTab === 'settings' && !currentProject && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Настройки</h3>
          <p className="text-muted-foreground">Выберите проект для просмотра настроек.</p>
        </div>
      )}

      {activeTab === 'staff' && currentProjectId && (
        <StaffManagement projectId={currentProjectId} />
      )}

      {activeTab === 'inbox' && currentProjectId && (
        <OmnichannelInbox projectId={currentProjectId} />
      )}

      {activeTab === 'finance' && currentProjectId && (
        <FinanceDashboard projectId={currentProjectId} />
      )}

      {activeTab === 'scoring' && currentProjectId && (
        <LeadScoring projectId={currentProjectId} />
      )}

      {activeTab === 'gamification' && currentProjectId && (
        <GamificationHub projectId={currentProjectId} />
      )}

      {activeTab === 'ab-testing' && currentProjectId && (
        <ABOptimizer projectId={currentProjectId} />
      )}

      {activeTab === 'knowledge' && currentProjectId && (
        <KnowledgeBase projectId={currentProjectId} />
      )}

      {activeTab === 'health' && currentProjectId && (
        <TechnicalHealth projectId={currentProjectId} />
      )}

      {activeTab === 'diagnostics' && currentProjectId && (
        <DiagnosticsPage projectId={currentProjectId} />
      )}

      {activeTab === 'help' && (
        <div className="bg-card border border-border rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">🆘 Центр помощи MarkVision AI Medical</h3>
          <p className="text-muted-foreground">
            Платформа сквозной аналитики и CRM для владельцев медицинских клиник. Документация в разработке.
          </p>
        </div>
      )}

      {!['dashboard', 'table', 'quantom-ads', 'crm', 'e2e-analytics', 'reports', 'team', 'integrations', 'settings', 'audit', 'factory', 'staff', 'inbox', 'finance', 'scoring', 'gamification', 'ab-testing', 'knowledge', 'health', 'realtime', 'diagnostics', 'calendar', 'help'].includes(activeTab) && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Раздел в разработке</h3>
          <p className="text-muted-foreground">Этот функционал скоро будет доступен</p>
        </div>
      )}

      {activeTab === 'calendar' && currentProjectId && (
        <CalendarPage projectId={currentProjectId} />
      )}
    </main>
  );

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col md:flex-row w-full"
    )}>
      {showOnboarding && (
        <OnboardingWizard 
          createProject={createProject}
          onComplete={(projectId) => {
            setShowOnboarding(false);
            setCurrentProjectId(projectId);
            setActiveTab('dashboard');
          }}
        />
      )}
      
      {/* Premium Animated Sidebar */}
      <AppSidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        userProfile={profile}
        realtimeStatus="SUBSCRIBED"
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectChange={setCurrentProjectId}
        onCreateProject={createProject}
        onDeleteProject={deleteProject}
        userId={user?.id}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={getTabTitle()} 
          subtitle={currentProject?.name}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          showDatePicker={activeTab === 'dashboard'}
          onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        
        <div className="flex-1 overflow-y-auto">
          {isMobile ? (
            <PullToRefresh onRefresh={handleRefresh}>
              {mainContent}
            </PullToRefresh>
          ) : (
            mainContent
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        onMoreClick={() => setIsMobileSidebarOpen(true)}
      />
    </div>
  );
};

export default AnalyticsPlatform;
