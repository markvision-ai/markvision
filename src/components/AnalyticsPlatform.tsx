import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
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
import { useSystemHealth } from '@/hooks/useSystemHealth';

import { AppSidebar } from './AppSidebar';
import { DraggableDashboard } from './dashboard/DraggableDashboard';
import { Header } from './layout/Header';
import { MetricCard } from './dashboard/MetricCard';
import { PlanFactCard } from './dashboard/PlanFactCard';
import { QuickStats } from './dashboard/QuickStats';
import { DataTable } from './dashboard/DataTable';
import { RevenueChart } from './dashboard/RevenueChart';
import { ConversionStats } from './dashboard/ConversionStats';
import { AIAssistant } from './analytics/AIAssistant';
import { OnboardingWizard } from './onboarding/OnboardingWizard';
import { UpcomingAppointmentsWidget } from './dashboard/UpcomingAppointmentsWidget';
import { useProjectData } from '@/hooks/useProjectData';
import { useProjects } from '@/hooks/useProjects';
import { PullToRefresh } from './mobile/PullToRefresh';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { DashboardSkeleton } from './dashboard/DashboardSkeleton';
import { AnalyticsSkeleton } from './analytics/AnalyticsSkeleton';
import { SidebarProvider } from './ui/aceternity-sidebar';
import { cn } from '@/lib/utils';

// Lazy load heavy modules for performance
const TeamManagement = lazy(() => import('./team/TeamManagement').then(m => ({ default: m.TeamManagement })));
const ReportGenerator = lazy(() => import('./reports/ReportGenerator').then(m => ({ default: m.ReportGenerator })));
const E2EAnalytics = lazy(() => import('./analytics/E2EAnalytics').then(m => ({ default: m.E2EAnalytics })));
const AdminHub = lazy(() => import('./settings/AdminHub').then(m => ({ default: m.AdminHub })));
const IntegrationsManagement = lazy(() => import('./integrations/IntegrationsManagement').then(m => ({ default: m.IntegrationsManagement })));
const CRMPage = lazy(() => import('./crm/CRMPage').then(m => ({ default: m.CRMPage })));
const AuditLogViewer = lazy(() => import('./audit/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const QuantomAdsPage = lazy(() => import('./ads/QuantomAdsPage').then(m => ({ default: m.QuantomAdsPage })));
const ContentFactoryPage = lazy(() => import('./factory/ContentFactoryPage').then(m => ({ default: m.ContentFactoryPage })));
const StaffManagement = lazy(() => import('./staff/StaffManagement').then(m => ({ default: m.StaffManagement })));
const KnowledgeBase = lazy(() => import('./knowledge/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const FinanceDashboard = lazy(() => import('./finance/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const OmnichannelInbox = lazy(() => import('./inbox/OmnichannelInbox').then(m => ({ default: m.OmnichannelInbox })));
const LeadScoring = lazy(() => import('./scoring/LeadScoring').then(m => ({ default: m.LeadScoring })));
const GamificationHub = lazy(() => import('./gamification/GamificationHub').then(m => ({ default: m.GamificationHub })));
const ABOptimizer = lazy(() => import('./abtesting/ABOptimizer').then(m => ({ default: m.ABOptimizer })));
const TechnicalHealth = lazy(() => import('./health/TechnicalHealth').then(m => ({ default: m.TechnicalHealth })));
const RealtimeDashboard = lazy(() => import('./dashboard/RealtimeDashboard').then(m => ({ default: m.RealtimeDashboard })));
const CalendarPage = lazy(() => import('./calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));
const DiagnosticsPage = lazy(() => import('./diagnostics/DiagnosticsPage').then(m => ({ default: m.DiagnosticsPage })));
const AutomationPage = lazy(() => import('./automation/AutomationPage').then(m => ({ default: m.AutomationPage })));

// Loading fallback component
const ModuleLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

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
  const { hasErrors: systemHasErrors } = useSystemHealth(currentProjectId);

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
      case 'dashboard': return '🏠 Главная панель';
      case 'table': return '📊 Таблица показателей';
      case 'quantom-ads': return '🚀 Управление рекламой';
      case 'crm': return '🤝 База пациентов';
      case 'factory': return '🎬 Центр контента';
      case 'e2e-analytics': return '📊 Сквозная аналитика';
      case 'reports': return '📄 Отчёты';
      case 'team': return '👥 Сотрудники и доступ';
      case 'integrations': return '🔌 Подключения';
      case 'audit': return '🔒 Аудит';
      case 'settings': return '⚙️ Настройки';
      case 'staff': return '👥 Персонал';
      case 'inbox': return '📬 Входящие';
      case 'finance': return '💰 Финансы и прибыль';
      case 'scoring': return '🔥 Рейтинг заявок';
      case 'gamification': return '🏆 Мотивация';
      case 'ab-testing': return '🧪 A/B Оптимизатор';
      case 'knowledge': return '📚 База знаний';
      case 'health': return '🩺 Состояние системы';
      case 'realtime': return '⚡ Живая лента';
      case 'onboarding': return '🧭 Онбординг';
      case 'diagnostics': return '📋 Диагностика';
      case 'calendar': return '📅 Календарь';
      case 'automation': return '🤖 Автоматизация';
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      {activeTab === 'dashboard' && (
        <DraggableDashboard>
          {(renderWidget) => (
            <div className="space-y-6">
              {/* Main Metrics with Plan/Fact */}
              {renderWidget('metrics', (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

              {/* Quick Stats */}
              {renderWidget('quick-stats', (
                <QuickStats stats={comparisonStats} />
              ))}

              {/* Appointments Widget */}
              {renderWidget('appointments', currentProjectId && (
                <UpcomingAppointmentsWidget projectId={currentProjectId} />
              ))}

              {/* Revenue Chart */}
              {renderWidget('revenue-chart', (
                <RevenueChart data={dailyData} daysInMonth={daysInRange} />
              ))}

              {/* Conversion Stats */}
              {renderWidget('conversions', (
                <ConversionStats steps={funnelSteps} />
              ))}

              {/* AI Assistant */}
              {renderWidget('ai-assistant', currentProjectId && (
                <AIAssistant />
              ))}
            </div>
          )}
        </DraggableDashboard>
      )}

      {activeTab === 'table' && currentProjectId && (
        <DataTable 
          dailyData={dailyData}
          onDataChange={handleDataChange}
        />
      )}

      {activeTab === 'quantom-ads' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <QuantomAdsPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'factory' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <ContentFactoryPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'crm' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <CRMPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'e2e-analytics' && currentProjectId && (
        <Suspense fallback={<AnalyticsSkeleton />}>
          <E2EAnalytics projectId={currentProjectId} totals={totals} />
        </Suspense>
      )}

      {activeTab === 'reports' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <ReportGenerator data={{ totals, planData, dailyData, dateRange }} />
        </Suspense>
      )}

      {activeTab === 'team' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <TeamManagement projects={projects} />
        </Suspense>
      )}

      {activeTab === 'integrations' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <IntegrationsManagement projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'settings' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <AdminHub projectId={currentProjectId} projects={projects} />
        </Suspense>
      )}

      {activeTab === 'audit' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <AuditLogViewer />
        </Suspense>
      )}

      {activeTab === 'staff' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <StaffManagement projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'inbox' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <OmnichannelInbox projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'finance' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <FinanceDashboard projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'scoring' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <LeadScoring projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'gamification' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <GamificationHub projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'ab-testing' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <ABOptimizer projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'realtime' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <RealtimeDashboard projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'knowledge' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <KnowledgeBase projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'health' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <TechnicalHealth projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'diagnostics' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <DiagnosticsPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'automation' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <AutomationPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'calendar' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <CalendarPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'help' && (
        <div className="bg-card border border-border rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">🆘 Центр помощи MarkVision AI Medical</h3>
          <p className="text-muted-foreground">
            Платформа сквозной аналитики и CRM для владельцев медицинских клиник. Документация в разработке.
          </p>
        </div>
      )}

      {!['dashboard', 'table', 'quantom-ads', 'crm', 'e2e-analytics', 'reports', 'team', 'integrations', 'settings', 'audit', 'factory', 'staff', 'inbox', 'finance', 'scoring', 'gamification', 'ab-testing', 'knowledge', 'health', 'realtime', 'diagnostics', 'calendar', 'help', 'automation'].includes(activeTab) && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Раздел в разработке</h3>
          <p className="text-muted-foreground">Этот функционал скоро будет доступен</p>
        </div>
      )}
    </div>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        {/* Onboarding Wizard - показывается если проект не завершил онбординг */}
        {currentProject && currentProject.onboarding_status !== 'completed' && (
          <OnboardingWizard 
            projectId={currentProjectId || ''}
            projectName={currentProject.name}
            onComplete={() => {
              refetchProjects();
              handleTabChange('dashboard');
            }}
          />
        )}
        
        {/* Premium Animated Sidebar - Fixed left */}
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
          systemHasErrors={systemHasErrors}
        />
        
        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header with backdrop blur */}
          <div className="hidden md:block sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <Header 
              title={getTabTitle()} 
              subtitle={currentProject?.name}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              showDatePicker={activeTab === 'dashboard'}
              onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
            />
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
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
    </SidebarProvider>
  );
};

export default AnalyticsPlatform;