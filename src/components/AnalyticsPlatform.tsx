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
  Loader2,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
// System health check disabled (hook removed)
// import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useTheme } from '@/hooks/useTheme';

import { AppSidebar } from './AppSidebar';
// Lazy load heavy dashboard components
const DraggableDashboard = lazy(() => import('./dashboard/DraggableDashboard').then(m => ({ default: m.DraggableDashboard })));
const PlanFactCard = lazy(() => import('./dashboard/PlanFactCard').then(m => ({ default: m.PlanFactCard })));
const MetricCard = lazy(() => import('./dashboard/MetricCard').then(m => ({ default: m.MetricCard })));
const DataTable = lazy(() => import('./dashboard/DataTable').then(m => ({ default: m.DataTable })));
const RevenueChart = lazy(() => import('./dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })));
const ConversionStats = lazy(() => import('./dashboard/ConversionStats').then(m => ({ default: m.ConversionStats })));
const FunnelStandalone = lazy(() => import('./widgets/FunnelStandalone').then(m => ({ default: m.FunnelStandalone })));
const PerformanceChartWidget = lazy(() => import('./widgets/PerformanceChartWidget').then(m => ({ default: m.PerformanceChartWidget })));
const AIAssistant = lazy(() => import('@/components/analytics/AIAssistant').then(m => ({ default: m.AIAssistant })));
const UpcomingAppointmentsWidget = lazy(() => import('./dashboard/UpcomingAppointmentsWidget').then(m => ({ default: m.UpcomingAppointmentsWidget })));
const ComputedMetricsWidget = lazy(() => import('@/components/dashboard/ComputedMetricsWidget').then(m => ({ default: m.ComputedMetricsWidget })));
const WelcomeHero = lazy(() => import('./dashboard/WelcomeHero').then(m => ({ default: m.WelcomeHero })));
import { useProjectData, type DailyData, type PlanData } from '@/hooks/useProjectData';
import { useProjects } from '@/hooks/useProjects';
import { DateRangePicker, type PresetKey } from './dashboard/DateRangePicker';
import { FALLBACK_PROJECT_ID } from '@/integrations/supabase/client';
import { PullToRefresh } from './mobile/PullToRefresh';
const MobileBottomNav = lazy(() => import('./mobile/MobileBottomNav').then(m => ({ default: m.MobileBottomNav })));
const MobileMenuDrawer = lazy(() => import('./mobile/MobileMenuDrawer').then(m => ({ default: m.MobileMenuDrawer })));
const MobileHeader = lazy(() => import('./mobile/MobileHeader').then(m => ({ default: m.MobileHeader })));
const FloatingChatReserved = lazy(() => import('./analytics/FloatingChat').then(m => ({ default: m.AIFloatingChat })));
import { Header as DesktopHeader } from './layout/Header';
import { DashboardSkeleton } from './dashboard/DashboardSkeleton';
import { AnalyticsSkeleton } from './analytics/AnalyticsSkeleton';
import { SidebarProvider } from './ui/aceternity-sidebar';
import { DotPatternBackground } from './ui/dot-pattern-background';
import { cn } from '@/lib/utils';

// Lazy load heavy modules for performance
const TeamManagement = lazy(() => import('./team/TeamManagement').then(m => ({ default: m.TeamManagement })));
const ReportGenerator = lazy(() => import('./reports/ReportGenerator').then(m => ({ default: m.ReportGenerator })));
const E2EAnalytics = lazy(() => import('./analytics/E2EAnalytics').then(m => ({ default: m.E2EAnalytics })));
const MetaAccountAnalytics = lazy(() => import('./analytics/MetaAccountAnalytics').then(m => ({ default: m.MetaAccountAnalytics })));
const AdminHub = lazy(() => import('./settings/AdminHub').then(m => ({ default: m.AdminHub })));
const IntegrationsManagement = lazy(() => import('./integrations/IntegrationsManagementNew'));
const AuditLogViewer = lazy(() => import('./audit/AuditLogViewer').then(m => ({ default: m.AuditLogViewer })));
const AgencyAccountsDashboard = lazy(() => import('./ads/AgencyAccountsDashboard').then(m => ({ default: m.AgencyAccountsDashboard })));
const QuantomAdsPage = lazy(() => import('./ads/QuantomAdsPage').then(m => ({ default: m.QuantomAdsPage })));
const ContentFactoryPage = lazy(() => import('./factory/ContentFactoryPage').then(m => ({ default: m.ContentFactoryPage })));
const PublicationsPage = lazy(() => import('./content/PublicationsPage').then(m => ({ default: m.PublicationsPage })));
const StaffManagement = lazy(() => import('./staff/StaffManagement').then(m => ({ default: m.StaffManagement })));
const KnowledgeBase = lazy(() => import('./knowledge/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const FinanceDashboard = lazy(() => import('./finance/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const OmnichannelInbox = lazy(() => import('./inbox/OmnichannelInbox').then(m => ({ default: m.OmnichannelInbox })));
const LeadScoring = lazy(() => import('./scoring/LeadScoring').then(m => ({ default: m.LeadScoring })));

const ABOptimizer = lazy(() => import('./abtesting/ABOptimizer').then(m => ({ default: m.ABOptimizer })));
const TechnicalHealth = lazy(() => import('./health/TechnicalHealth').then(m => ({ default: m.TechnicalHealth })));
const RealtimeDashboard = lazy(() => import('./dashboard/RealtimeDashboard').then(m => ({ default: m.RealtimeDashboard })));
const CalendarPage = lazy(() => import('./calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));
const VisitsPage = lazy(() => import('./visits/VisitsPage').then(m => ({ default: m.VisitsPage })));
const AutomationPage = lazy(() => import('./automation/AutomationPage').then(m => ({ default: m.AutomationPage })));
const AIRopPage = lazy(() => import('./rop/AIRopPage').then(m => ({ default: m.AIRopPage })));

// Loading fallback component
const ModuleLoader = () => (
  <div className="flex flex-col items-center justify-center py-40 gap-6">
    <div className="relative">
      <div className="w-20 h-20 rounded-3xl border-2 border-primary/20 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-pulse" />
      </div>
    </div>
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Neural Link Established</p>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Calibrating Architecture...</p>
    </div>
  </div>
);

// Removed duplicate interfaces

interface DateRange {
  from: Date;
  to: Date;
}

// Форматирование без копеек (с пробелами)
const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

// Умное форматирование для CR (проценты)
const formatCR = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  if (value < 1) {
    return value.toFixed(2) + '%';
  }
  return value.toFixed(1) + '%';
};

// Форматирование для ROAS (коэффициент)
const formatROAS = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  return value.toFixed(2) + 'x';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

export const AnalyticsPlatform = () => {
  const { theme } = useTheme();
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
      'analytics': 'e2e-analytics',
      'agency-accounts': 'agency-accounts',
      'ab-tests': 'ab-testing',
    };
    return urlToTab[path] || path;
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
      'e2e-analytics': '/analytics',
      'agency-accounts': '/agency-accounts',
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
  }, [location.pathname, activeTab]);

  const { projects, currentProjectId, setCurrentProjectId, currentProject, loading: projectsLoading, createProject, deleteProject, refetch: refetchProjects, forceLoadProject } = useProjects();
  const { dailyData, planData, plansMap, loading: dataLoading, updateDailyData, updatePlanData, refetch } = useProjectData(currentProjectId);
  const systemHasErrors = false; // System health check disabled

  // CRITICAL: Super admin UUID - bypass all loading states
  const SUPER_ADMIN_UID = 'd94043b0-1c76-4017-84de-df0dbf00a2c9';
  const isSuperAdminUser = user?.id === SUPER_ADMIN_UID;

  // Debug: выводим информацию о текущем проекте (only in development)
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Debug logs removed for production
    }
  }, [currentProjectId, currentProject, user, projects]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    await refetchProjects();
  }, [refetch, refetchProjects]);

  const [activePreset, setActivePreset] = useState<PresetKey | 'custom'>('month');
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

    // Get the latest available total followers count if exists
    // 1. First check in the selected range
    let latestFollowersTotal = rangeData
      .slice()
      .reverse()
      .find(d => (d.followers_total || 0) > 0)?.followers_total;

    // 2. If not found in range, look in the entire history up to the end of range
    if (!latestFollowersTotal && rangeDays.length > 0) {
      const lastRangeDate = rangeDays[rangeDays.length - 1];
      const allDates = Object.keys(dailyData).sort();
      const candidateDates = allDates.filter(d => d <= lastRangeDate);

      // Try to find explicit total first
      for (let i = candidateDates.length - 1; i >= 0; i--) {
        const d = dailyData[candidateDates[i]];
        if ((d.followers_total || 0) > 0) {
          latestFollowersTotal = d.followers_total;
          break;
        }
      }

      // 3. If still not found, calculate total by summing all 'followers' deltas up to lastRangeDate
      // This handles cases where we only have deltas but no explicit totals
      /* 
       * DISABLED: Summing deltas is incorrect for "Total Followers" unless we have the full history from day 0.
       * If we are missing the baseline (initial followers), this sum will only show the growth (e.g. 19), 
       * which is confusing when labeled as "Total".
       * Better to show 0 or wait for the backend to sync the real total.
       *
      if (!latestFollowersTotal) {
        const calculatedTotal = candidateDates.reduce((sum, date) => {
          return sum + (dailyData[date].followers || 0);
        }, 0);
        
        if (calculatedTotal > 0) {
          latestFollowersTotal = calculatedTotal;
        }
      }
      */
    }

    const aggregated = rangeData.reduce(
      (acc, day) => ({
        spend: acc.spend + (day.spend || 0),
        impressions: acc.impressions + (day.impressions || 0),
        clicks: acc.clicks + (day.clicks || 0),
        leads: acc.leads + (day.leads || 0),
        followers: acc.followers + (day.followers || 0),
        visits: acc.visits + (day.visits || 0),
        sales: acc.sales + (day.sales || 0),
        revenue: acc.revenue + (day.revenue || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
    );

    if (import.meta.env.DEV) {
      console.log('FOLLOWERS DEBUG:', {
        range: daysInRange.length,
        hasTotal: !!latestFollowersTotal,
        latestTotal: latestFollowersTotal,
        sumDeltas: aggregated.followers,
        recordsWithTotal: rangeData.filter(d => (d.followers_total || 0) > 0).length
      });
    }

    return {
      ...aggregated,
      // FIX: If we have an explicit total, use it. Otherwise, fallback to sum of deltas (New Followers).
      // The label logic below handles the distinction: "Подписчики" (Total) vs "Новые подписчики" (New/Delta).
      followers: latestFollowersTotal || aggregated.followers,
      isTotalFollowers: !!latestFollowersTotal
    };
  }, [dailyData, daysInRange]);

  // Данные за прошлую неделю для сравнения (7 дней назад от ПОСЛЕДНЕГО дня текущего диапазона)
  const previousWeekTotals = useMemo(() => {
    // Берем последний день текущего диапазона и отнимаем 7 дней
    const lastDayOfRange = dateRange.to;
    const sevenDaysAgo = subWeeks(lastDayOfRange, 1);

    // Берем данные за 7 дней назад (от sevenDaysAgo минус 6 дней до sevenDaysAgo)
    const prevEnd = sevenDaysAgo;
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6); // 7 дней включая текущий

    const prevDays = eachDayOfInterval({ start: prevStart, end: prevEnd });
    const prevDaysFormatted = prevDays.map(d => format(d, 'yyyy-MM-dd'));
    const prevData = prevDaysFormatted.map(date => dailyData[date]).filter(Boolean);

    // 1. First check in the selected range
    let latestFollowersTotal = prevData
      .slice()
      .reverse()
      .find(d => (d.followers_total || 0) > 0)?.followers_total;

    // 2. If not found in range, look in the entire history up to the end of range
    if (!latestFollowersTotal && prevDaysFormatted.length > 0) {
      const lastRangeDate = prevDaysFormatted[prevDaysFormatted.length - 1];
      const allDates = Object.keys(dailyData).sort();
      const candidateDates = allDates.filter(d => d <= lastRangeDate);

      for (let i = candidateDates.length - 1; i >= 0; i--) {
        const d = dailyData[candidateDates[i]];
        if ((d.followers_total || 0) > 0) {
          latestFollowersTotal = d.followers_total;
          break;
        }
      }
    }

    const aggregated = prevData.reduce(
      (acc, day) => ({
        spend: acc.spend + (day.spend || 0),
        impressions: acc.impressions + (day.impressions || 0),
        clicks: acc.clicks + (day.clicks || 0),
        leads: acc.leads + (day.leads || 0),
        followers: acc.followers + (day.followers || 0),
        visits: acc.visits + (day.visits || 0),
        sales: acc.sales + (day.sales || 0),
        revenue: acc.revenue + (day.revenue || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, followers: 0, visits: 0, sales: 0, revenue: 0 }
    );

    return {
      ...aggregated,
      // FIX: Consistent fallback
      followers: latestFollowersTotal || aggregated.followers,
      isTotalFollowers: !!latestFollowersTotal
    };
  }, [dailyData, dateRange]);

  // Computed metrics (возвращаем null при делении на 0)
  const customerCost = totals.sales > 0 ? Math.round(totals.spend / totals.sales) : null; // Стоимость клиента
  const visitCost = totals.visits > 0 ? Math.round(totals.spend / totals.visits) : null; // Стоимость визита
  const leadCost = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : null; // Стоимость лида (CPL)
  const impressionToLeadConv = totals.impressions > 0 ? (totals.leads / totals.impressions) * 100 : null; // CR (Показы→Лид)
  const leadToVisitConv = totals.leads > 0 ? (totals.visits / totals.leads) * 100 : null; // CR (Лид→Визит)
  const visitToSaleConv = totals.visits > 0 ? (totals.sales / totals.visits) * 100 : null; // CR (Визит→Продажа)

  // ROMI, Рентабельность, ROAS
  const romi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : null; // ROMI: прибыльность маркетинга в %
  const profitability = totals.revenue > 0 ? ((totals.revenue - totals.spend) / totals.revenue) * 100 : null; // Рентабельность: (Прибыль / Выручка) × 100%
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : null; // ROAS: коэффициент возврата

  const prevConversionRate = previousWeekTotals.leads > 0 ? (previousWeekTotals.sales / previousWeekTotals.leads) * 100 : 0;

  const handleDataChange = useCallback((date: string, field: keyof DailyData, value: number) => {
    updateDailyData(date, field, value);
  }, [updateDailyData]);

  const handlePlanChange = useCallback((field: keyof PlanData, value: number, month?: string) => {
    updatePlanData(field, value, month);
  }, [updatePlanData]);

  // Formatting helpers (global rounding policy)
  const formatInt = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));
  const formatPercent1 = (n: number) => `${Math.round(isFinite(n) ? n : 0)}`;
  const calcDelta = (cur: number, prev: number) => {
    if (!prev || prev === 0) return 0;
    return ((cur - prev) / prev) * 100;
  };
  const profit = totals.revenue - totals.spend;
  const romiPercent = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;

  const funnelSteps = [
    { label: 'Показы', value: totals.impressions, color: 'hsl(220, 90%, 56%)' },
    { label: 'Клики', value: totals.clicks, color: 'hsl(200, 80%, 50%)' },
    { label: 'Лиды', value: totals.leads, color: 'hsl(262, 83%, 58%)' },
    { label: 'Диагностика', value: totals.visits, color: 'hsl(38, 92%, 50%)' },
    { label: 'Продажи', value: totals.sales, color: 'hsl(142, 76%, 36%)' },
  ];

  // Сравнение с прошлой неделей (все ключевые показатели)
  const comparisonStats = [
    { label: 'Расходы', current: totals.spend, previous: previousWeekTotals.spend, format: 'currency' as const },
    { label: 'Показы', current: totals.impressions, previous: previousWeekTotals.impressions, format: 'number' as const },
    { label: 'Клики', current: totals.clicks, previous: previousWeekTotals.clicks, format: 'number' as const },
    { label: 'Лиды', current: totals.leads, previous: previousWeekTotals.leads, format: 'number' as const },
    { label: 'Подписчики', current: totals.followers, previous: previousWeekTotals.followers, format: 'number' as const },
    { label: 'Диагностика', current: totals.visits, previous: previousWeekTotals.visits, format: 'number' as const },
    { label: 'Продажи', current: totals.sales, previous: previousWeekTotals.sales, format: 'number' as const },
    { label: 'Выручка', current: totals.revenue, previous: previousWeekTotals.revenue, format: 'currency' as const },
  ];

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return '🏠 Главная панель';
      case 'table': return '📊 Таблица показателей';
      case 'quantom-ads': return '🚀 Управление рекламой';
      case 'crm': return '🤝 CRM';
      case 'factory': return '🎬 Центр контента';
      case 'publications': return '🚀 Публикации';
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
      case 'ab-testing': return '🧪 A/B Оптимизатор';
      case 'knowledge': return '📚 База знаний';
      case 'health': return '🩺 Состояние системы';
      case 'realtime': return '⚡ Живая лента';
      case 'onboarding': return '🧭 Онбординг';
      case 'visits': return '📋 Диагностика';
      case 'calendar': return '📅 Календарь';
      case 'automation': return '🤖 Автоматизация';
      case 'agency-accounts': return 'Сводка по кабинетам';
      default: return 'Раздел в разработке';
    }
  };



  const renderDashboardWidgets = useCallback((registerWidget: any) => {
    // Register all widgets - the DraggableDashboard will render them in sorted order
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const todayData = dailyData[todayKey];

    // Welcome Hero
    const captainName = profile?.name?.split(' ').pop() || profile?.name || 'Запойнов';
    registerWidget('welcome-hero', (
      <WelcomeHero
        projectName={currentProject?.name || 'Стоматология'}
        keyMetrics={{
          revenue: totals.revenue,
          expenses: totals.spend,
          romi: romiPercent,
        }}
        systemStatus={systemHasErrors ? 'error' : 'healthy'}
        onTabChange={handleTabChange}
      />
    ));

    if (currentProjectId) {
      registerWidget('agency-accounts', (
        <AgencyAccountsDashboard projectId={currentProjectId} />
      ));
    }

    registerWidget('plan-fact', (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <PlanFactCard
          label="Показы"
          value={totals.impressions}
          plan={planData.impressions}
          fact={totals.impressions}
          icon={<Eye className="w-4 h-4" />}
          format="number"
        />
        <PlanFactCard
          label="Лиды"
          value={totals.leads}
          plan={planData.leads}
          fact={totals.leads}
          icon={<Users className="w-4 h-4" />}
          format="number"
        />
        <MetricCard
          label="Стоимость лида"
          value={leadCost !== null ? formatInt(leadCost) + ' ₸' : '—'}
          icon={<Users className="w-5 h-5" />}
          variant="primary"
          subValue={`${leadCost !== null ? 'CPL' : 'Нет данных'}`}
        />
        <PlanFactCard
          label="Визиты"
          value={totals.visits}
          plan={planData.visits}
          fact={totals.visits}
          icon={<Target className="w-4 h-4" />}
          format="number"
        />
        <MetricCard
          label="Стоимость визита"
          value={visitCost !== null ? formatInt(visitCost) + ' ₸' : '—'}
          icon={<Target className="w-5 h-5" />}
          variant="success"
          subValue={`${visitCost !== null ? 'CPV' : 'Нет данных'}`}
        />
        <PlanFactCard
          label="Продажи"
          value={totals.sales}
          plan={planData.sales}
          fact={totals.sales}
          icon={<ShoppingCart className="w-4 h-4" />}
          format="number"
        />
        <MetricCard
          label="Стоимость клиента"
          value={customerCost !== null ? formatInt(customerCost) + ' ₸' : '—'}
          icon={<ShoppingCart className="w-5 h-5" />}
          variant="primary"
          subValue={`${customerCost !== null ? 'CPS' : 'Нет данных'}`}
        />
        <PlanFactCard
          label={totals.isTotalFollowers ? "Подписчики" : "Новые подписчики"}
          value={totals.followers}
          plan={planData.followers}
          fact={totals.followers}
          icon={<Users className="w-4 h-4" />}
          format="number"
        />
      </div>
    ));

    // Second Row: Connected Funnel analysis
    registerWidget('charts-row', (
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        <FunnelStandalone steps={funnelSteps} />
        <PerformanceChartWidget data={daysInRange.map(d => {
          const dateKey = format(d, 'yyyy-MM-dd');
          const dd = dailyData[dateKey] as any || {};
          return {
            date: dateKey,
            displayDate: format(d, 'd MMM'),
            spend: dd.spend || 0,
            leads: dd.leads || 0,
            visits: dd.visits || 0,
            sales: dd.sales || 0,
            revenue: dd.revenue || 0,
          };
        })} />
      </div>
    ));

    if (currentProjectId) {
      registerWidget('appointments', (
        <UpcomingAppointmentsWidget projectId={currentProjectId} />
      ));
    }

    return null; // DraggableDashboard handles rendering
  }, [
    dailyData, profile, currentProject, totals, romiPercent, systemHasErrors, handleTabChange,
    planData, leadCost, visitCost, customerCost, funnelSteps, daysInRange, currentProjectId
  ]);

  const projectsList = projects.map(p => ({ id: p.id, name: p.name, owner_id: '' }));

  // CRITICAL: Super admin NEVER sees loading screen
  if ((projectsLoading || dataLoading) && !isSuperAdminUser) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] border-2 border-primary/20 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-black text-white uppercase tracking-[0.3em]">MarkVision <span className="text-primary italic">OS</span></h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Initializing Neural Core...</p>
        </div>
      </div>
    );
  }

  const mainContent = (
    <div className="w-full max-w-7xl mx-auto px-3 py-4 md:p-6 lg:p-8 pb-24 md:pb-8">
      <div className="mb-2" />
      {activeTab === 'dashboard' && (
        <Suspense fallback={<DashboardSkeleton />}>
          <DraggableDashboard>
            {renderDashboardWidgets}
          </DraggableDashboard>
        </Suspense>
      )}

      {activeTab === 'dashboard' && (
        <Suspense fallback={null}>
          <FloatingChatReserved context={{
            spend: totals.spend,
            impressions: totals.impressions,
            clicks: totals.clicks,
            leads: totals.leads,
            visits: totals.visits,
            sales: totals.sales,
            revenue: totals.revenue,
            romi: romiPercent,
            projectId: currentProjectId || FALLBACK_PROJECT_ID
          }} />
        </Suspense>
      )}

      {activeTab === 'table' && currentProjectId && (
        <Suspense fallback={<DashboardSkeleton />}>
          <DataTable
            dailyData={dailyData}
            onDataChange={handleDataChange}
            planData={planData}
            plansMap={plansMap}
            onPlanChange={handlePlanChange}
          />
        </Suspense>
      )}

      {activeTab === 'quantom-ads' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <QuantomAdsPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'agency-accounts' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <AgencyAccountsDashboard projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'factory' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <ContentFactoryPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'publications' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <PublicationsPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'crm' && (
        <div className="bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">CRM в разработке</h3>
          <p className="text-muted-foreground">Этот функционал скоро будет доступен</p>
        </div>
      )}

      {activeTab === 'e2e-analytics' && currentProjectId && (
        <Suspense fallback={<AnalyticsSkeleton />}>
          <E2EAnalytics projectId={currentProjectId} totals={totals} />
        </Suspense>
      )}

      {activeTab === 'reports' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <ReportGenerator data={{
            projectId: currentProjectId,
            projectName: currentProject?.name || 'Проект',
            dateRange: { from: dateRange.from || new Date(), to: dateRange.to || new Date() },
            totals,
            planData,
          }} />
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

      {activeTab === 'scoring' && (
        <Suspense fallback={<ModuleLoader />}>
          <LeadScoring projectId={currentProjectId || FALLBACK_PROJECT_ID} />
        </Suspense>
      )}



      {activeTab === 'ab-testing' && (
        <Suspense fallback={<ModuleLoader />}>
          <ABOptimizer projectId={currentProjectId || FALLBACK_PROJECT_ID} />
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

      {activeTab === 'visits' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <VisitsPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'automation' && (
        <Suspense fallback={<ModuleLoader />}>
          <AutomationPage projectId={currentProjectId || FALLBACK_PROJECT_ID} />
        </Suspense>
      )}

      {activeTab === 'calendar' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <CalendarPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'rop' && currentProjectId && (
        <Suspense fallback={<ModuleLoader />}>
          <AIRopPage projectId={currentProjectId} />
        </Suspense>
      )}

      {activeTab === 'help' && (
        <div className="bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50 rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">🆘 Центр помощи MarkVision AI Medical</h3>
          <p className="text-muted-foreground">
            Платформа сквозной аналитики и CRM для владельцев медицинских клиник. Документация в разработке.
          </p>
        </div>
      )}

      {!['dashboard', 'table', 'quantom-ads', 'agency-accounts', 'crm', 'e2e-analytics', 'reports', 'team', 'integrations', 'settings', 'audit', 'factory', 'publications', 'staff', 'inbox', 'finance', 'scoring', 'ab-testing', 'knowledge', 'health', 'realtime', 'visits', 'calendar', 'help', 'automation', 'rop'].includes(activeTab) && (
        <div className="bg-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 border border-white/50 rounded-2xl p-12 text-center">
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
    <DotPatternBackground className="bg-[#020617]">
      <SidebarProvider>
        <div className="h-screen overflow-hidden flex w-full relative bg-[#020617]">

          {/* Premium Animated Sidebar - Fixed left, sticky */}
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

            systemHasErrors={systemHasErrors}
            onForceLoadProject={forceLoadProject}
          />

          {/* Main Content Area - Takes remaining space, no overlap */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
            {/* Mobile Header */}
            <Suspense fallback={<div className="h-16 md:h-0" />}>
              <MobileHeader
                title={getTabTitle()}
                subtitle={activeTab === 'agency-accounts' ? 'Сквозная аналитика рекламного трафика' : currentProject?.name}
                onMenuClick={() => setIsMobileSidebarOpen(true)}
                projects={projectsList}
                currentProjectId={currentProjectId}
                onProjectChange={setCurrentProjectId}
              />
            </Suspense>

            {/* Desktop Header with interstellar glass */}
            <header className="hidden md:block sticky top-0 z-30 bg-white/[0.02] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.02)]">
              <DesktopHeader
                onTabChange={handleTabChange}
                title={getTabTitle()}
                subtitle={activeTab === 'agency-accounts' ? 'Сквозная аналитика рекламного трафика' : currentProject?.name}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onPresetChange={(preset) => setActivePreset(preset as PresetKey)}
                showDatePicker={activeTab === 'dashboard'}
                onMobileMenuClick={() => setIsMobileSidebarOpen(true)}
                projects={projectsList}
                currentProjectId={currentProjectId}
                onProjectChange={setCurrentProjectId}
                onCreateProject={createProject}
                showProjectSelector={true}
              />
            </header>

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
          </main>

          {/* Mobile Bottom Navigation */}
          <Suspense fallback={null}>
            <MobileBottomNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onMoreClick={() => setIsMobileSidebarOpen(true)}
            />
          </Suspense>

          {/* Mobile Menu Drawer */}
          <Suspense fallback={null}>
            <MobileMenuDrawer
              open={isMobileSidebarOpen}
              onOpenChange={setIsMobileSidebarOpen}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              userProfile={profile}
              currentProjectName={currentProject?.name}
            />
          </Suspense>
        </div>
      </SidebarProvider>
    </DotPatternBackground>
  );
};

export default AnalyticsPlatform;
