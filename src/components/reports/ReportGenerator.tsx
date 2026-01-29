import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Edit3, 
  Check,
  BarChart3,
  Loader2,
  Sparkles,
  Send,
  Clock,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CalendarIcon,
  Save,
  FolderOpen,
  Trash2,
  GitCompare,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  LineChart,
  ShoppingCart,
  Users
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, differenceInDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAIReport } from '@/hooks/useAIReport';
import { supabase } from '@/lib/externalSupabase';

interface DailyDataPoint {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  period_preset: string | null;
  custom_days: number | null;
  include_comparison: boolean;
  comparison_preset: string | null;
  selected_metrics: string[];
}

interface ReportData {
  projectId?: string;
  projectName: string;
  dateRange: { from: Date; to: Date };
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    diagnostics: number;
    sales: number;
    revenue: number;
  };
  planData?: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    diagnostics: number;
    sales: number;
    revenue: number;
  };
  metrics: {
    customerCost: number;
    diagnosticCost: number;
    leadCost: number;
    impressionToLeadConv: number;
    leadToDiagnosticConv: number;
    diagnosticToSaleConv: number;
    roas: number;
    romi?: number;
    profitability?: number;
  };
  funnelSteps: { label: string; value: number; color: string }[];
}

interface ReportGeneratorProps {
  data: ReportData;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

// Умное форматирование для CR (проценты)
const formatCR = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  if (value < 1) {
    return value.toFixed(2) + '%';
  }
  return value.toFixed(1) + '%';
};

const getPlanFactStatus = (fact: number, plan: number) => {
  if (plan === 0) return { status: 'neutral', percent: 0 };
  const percent = (fact / plan) * 100;
  return {
    status: percent >= 100 ? 'success' : percent >= 80 ? 'warning' : 'danger',
    percent: percent
  };
};

type DateRange = { from: Date; to: Date };

type PresetKey = 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'custom';

const presets: { key: PresetKey; label: string }[] = [
  { key: 'week', label: 'Эта неделя' },
  { key: 'lastWeek', label: 'Прошлая неделя' },
  { key: 'month', label: 'Этот месяц' },
  { key: 'lastMonth', label: 'Прошлый месяц' },
];

export const ReportGenerator = ({ data }: ReportGeneratorProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isAutoReportEnabled, setIsAutoReportEnabled] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>('month');
  const reportRef = useRef<HTMLDivElement>(null);
  const { isGenerating: isGeneratingAI, aiAnalysis, generateAIReport } = useAIReport();

  // Templates state
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Comparison state
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
  const [comparisonPreset, setComparisonPreset] = useState<PresetKey>('lastMonth');
  const [comparisonDateRange, setComparisonDateRange] = useState<DateRange>(() => {
    const lastMonth = subMonths(new Date(), 1);
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
  });
  const [comparisonData, setComparisonData] = useState<{
    totals: typeof data.totals;
    dailyData: DailyDataPoint[];
    isLoading: boolean;
  }>({ totals: { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 }, dailyData: [], isLoading: false });

  // Local date range state for reports
  const [reportDateRange, setReportDateRange] = useState<DateRange>(() => ({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  }));

  // Fetch data for selected date range
  const [reportData, setReportData] = useState<{
    totals: typeof data.totals;
    dailyData: DailyDataPoint[];
    isLoading: boolean;
  }>({ totals: data.totals, dailyData: [], isLoading: false });

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!data.projectId) return;
      
      setIsLoadingTemplates(true);
      const { data: templatesData, error } = await supabase
        .from('report_templates' as any)
        .select('*')
        .eq('project_id', data.projectId)
        .order('created_at', { ascending: false });
      
      if (!error && templatesData) {
        const templatesRows: any[] = (templatesData as any[]) || [];
        const normalized = templatesRows.map((t: any) => ({
          id: t.id,
          name: t.name,
          period_preset: t.period_preset,
          custom_days: t.custom_days,
          include_comparison: t.include_comparison || false,
          comparison_preset: t.comparison_preset,
          selected_metrics: (t.selected_metrics as string[]) || [],
        }));
        setTemplates(normalized as any);
      }
      setIsLoadingTemplates(false);
    };
    
    loadTemplates();
  }, [data.projectId]);

  // Fetch comparison data when enabled
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!data.projectId || !isComparisonEnabled) {
        return;
      }

      setComparisonData(prev => ({ ...prev, isLoading: true }));

      const fromDate = format(comparisonDateRange.from, 'yyyy-MM-dd');
      const toDate = format(comparisonDateRange.to, 'yyyy-MM-dd');

      const { data: dailyDataResult, error } = await supabase
        .from('daily_data')
        .select('*')
        .eq('project_id', data.projectId)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching comparison data:', error);
        setComparisonData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const dailyData: DailyDataPoint[] = (dailyDataResult || []).map(day => ({
        date: day.date,
        spend: Number(day.spend) || 0,
        impressions: day.impressions || 0,
        clicks: day.clicks || 0,
        leads: day.leads || 0,
        diagnostics: day.diagnostics || 0,
        sales: day.sales || 0,
        revenue: Number(day.revenue) || 0,
      }));

      const totals = dailyData.reduce(
        (acc, day) => ({
          spend: acc.spend + day.spend,
          impressions: acc.impressions + day.impressions,
          clicks: acc.clicks + day.clicks,
          leads: acc.leads + day.leads,
          diagnostics: acc.diagnostics + day.diagnostics,
          sales: acc.sales + day.sales,
          revenue: acc.revenue + day.revenue,
        }),
        { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 }
      );

      setComparisonData({ totals, dailyData, isLoading: false });
    };

    fetchComparisonData();
  }, [comparisonDateRange, data.projectId, isComparisonEnabled]);

  // Fetch data when date range changes
  useEffect(() => {
    const fetchReportData = async () => {
      if (!data.projectId) {
        setReportData({ totals: data.totals, dailyData: [], isLoading: false });
        return;
      }

      setReportData(prev => ({ ...prev, isLoading: true }));

      const fromDate = format(reportDateRange.from, 'yyyy-MM-dd');
      const toDate = format(reportDateRange.to, 'yyyy-MM-dd');

      const { data: dailyDataResult, error } = await supabase
        .from('daily_data')
        .select('*')
        .eq('project_id', data.projectId)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching report data:', error);
        setReportData({ totals: data.totals, dailyData: [], isLoading: false });
        return;
      }

      const dailyData: DailyDataPoint[] = (dailyDataResult || []).map(day => ({
        date: day.date,
        spend: Number(day.spend) || 0,
        impressions: day.impressions || 0,
        clicks: day.clicks || 0,
        leads: day.leads || 0,
        diagnostics: day.diagnostics || 0,
        sales: day.sales || 0,
        revenue: Number(day.revenue) || 0,
      }));

      const totals = dailyData.reduce(
        (acc, day) => ({
          spend: acc.spend + day.spend,
          impressions: acc.impressions + day.impressions,
          clicks: acc.clicks + day.clicks,
          leads: acc.leads + day.leads,
          diagnostics: acc.diagnostics + day.diagnostics,
          sales: acc.sales + day.sales,
          revenue: acc.revenue + day.revenue,
        }),
        { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 }
      );

      setReportData({ totals, dailyData, isLoading: false });
    };

    fetchReportData();
  }, [reportDateRange, data.projectId, data.totals]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (reportData.dailyData.length === 0) return [];

    const periodDays = differenceInDays(reportDateRange.to, reportDateRange.from) + 1;
    
    return reportData.dailyData.map((day, index) => {
      const comparisonDay = isComparisonEnabled && comparisonData.dailyData[index];
      const dayLabel = format(new Date(day.date), 'd MMM', { locale: ru });
      
      return {
        name: dayLabel,
        dayIndex: index + 1,
        revenue: day.revenue,
        spend: day.spend,
        leads: day.leads,
        sales: day.sales,
        comparisonRevenue: comparisonDay ? comparisonDay.revenue : undefined,
        comparisonSpend: comparisonDay ? comparisonDay.spend : undefined,
        comparisonLeads: comparisonDay ? comparisonDay.leads : undefined,
        comparisonSales: comparisonDay ? comparisonDay.sales : undefined,
      };
    });
  }, [reportData.dailyData, comparisonData.dailyData, isComparisonEnabled, reportDateRange]);

  // Computed metrics based on report data (возвращаем null при делении на 0)
  const computedMetrics = useMemo(() => {
    const t = reportData.totals;
    return {
      customerCost: t.sales > 0 ? Math.round(t.spend / t.sales) : null,
      diagnosticCost: t.diagnostics > 0 ? Math.round(t.spend / t.diagnostics) : null,
      leadCost: t.leads > 0 ? Math.round(t.spend / t.leads) : null,
      impressionToLeadConv: t.impressions > 0 ? (t.leads / t.impressions) * 100 : null,
      leadToDiagnosticConv: t.leads > 0 ? (t.diagnostics / t.leads) * 100 : null,
      diagnosticToSaleConv: t.diagnostics > 0 ? (t.sales / t.diagnostics) * 100 : null,
      roas: t.spend > 0 ? t.revenue / t.spend : 0,
    };
  }, [reportData.totals]);

  const funnelSteps = useMemo(() => [
    { label: 'Показы', value: reportData.totals.impressions, color: 'hsl(220, 90%, 56%)' },
    { label: 'Клики', value: reportData.totals.clicks, color: 'hsl(200, 80%, 50%)' },
    { label: 'Лиды', value: reportData.totals.leads, color: 'hsl(262, 83%, 58%)' },
    { label: 'Диагностики', value: reportData.totals.diagnostics, color: 'hsl(38, 92%, 50%)' },
    { label: 'Продажи', value: reportData.totals.sales, color: 'hsl(142, 76%, 36%)' },
  ], [reportData.totals]);

  // Handle preset click
  const handlePresetClick = (preset: PresetKey) => {
    const now = new Date();
    let newRange: DateRange;

    switch (preset) {
      case 'week':
        newRange = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
        break;
      case 'lastWeek':
        const lastWeek = subWeeks(now, 1);
        newRange = { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
        break;
      case 'month':
        newRange = { from: startOfMonth(now), to: endOfMonth(now) };
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      default:
        return;
    }

    setReportDateRange(newRange);
    setActivePreset(preset);
  };

  // Handle calendar selection
  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      setReportDateRange({
        from: range.from,
        to: range.to || range.from,
      });
      setActivePreset('custom');
    }
  };

  // Handle comparison preset
  const handleComparisonPresetChange = (preset: PresetKey) => {
    const now = new Date();
    let newRange: DateRange;

    switch (preset) {
      case 'week':
        newRange = { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
        break;
      case 'lastWeek':
        const lastWeek = subWeeks(now, 1);
        newRange = { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
        break;
      case 'month':
        newRange = { from: startOfMonth(now), to: endOfMonth(now) };
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        newRange = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      default:
        return;
    }

    setComparisonDateRange(newRange);
    setComparisonPreset(preset);
  };

  // Comparison metrics (возвращаем null при делении на 0)
  const comparisonMetrics = useMemo(() => {
    const t = comparisonData.totals;
    return {
      customerCost: t.sales > 0 ? Math.round(t.spend / t.sales) : null,
      diagnosticCost: t.diagnostics > 0 ? Math.round(t.spend / t.diagnostics) : null,
      leadCost: t.leads > 0 ? Math.round(t.spend / t.leads) : null,
      impressionToLeadConv: t.impressions > 0 ? (t.leads / t.impressions) * 100 : null,
      leadToDiagnosticConv: t.leads > 0 ? (t.diagnostics / t.leads) * 100 : null,
      diagnosticToSaleConv: t.diagnostics > 0 ? (t.sales / t.diagnostics) * 100 : null,
      roas: t.spend > 0 ? t.revenue / t.spend : 0,
    };
  }, [comparisonData.totals]);

  // Calculate change percentage
  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Save template
  const handleSaveTemplate = async () => {
    if (!data.projectId || !newTemplateName.trim()) {
      toast.error('Введите название шаблона');
      return;
    }

    setIsSavingTemplate(true);
    try {
      const { error } = await supabase.from('report_templates' as any).insert({
        project_id: data.projectId,
        name: newTemplateName.trim(),
        period_preset: activePreset,
        include_comparison: isComparisonEnabled,
        comparison_preset: comparisonPreset,
        selected_metrics: ['spend', 'leads', 'sales', 'revenue', 'customerCost', 'diagnosticCost', 'leadCost', 'impressionToLeadConv', 'leadToDiagnosticConv', 'diagnosticToSaleConv'],
      });

      if (error) throw error;

      toast.success('Шаблон сохранён');
      setNewTemplateName('');
      setIsSaveTemplateOpen(false);

      // Reload templates
      const { data: templatesData } = await supabase
        .from('report_templates' as any)
        .select('*')
        .eq('project_id', data.projectId)
        .order('created_at', { ascending: false });

      if (templatesData) {
        const templatesRows: any[] = (templatesData as any[]) || [];
        const normalized = templatesRows.map((t: any) => ({
          id: t.id,
          name: t.name,
          period_preset: t.period_preset,
          custom_days: t.custom_days,
          include_comparison: t.include_comparison || false,
          comparison_preset: t.comparison_preset,
          selected_metrics: (t.selected_metrics as string[]) || [],
        }));
        setTemplates(normalized as any);
      }
    } catch (error) {
      toast.error('Ошибка сохранения шаблона');
      console.error(error);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Load template
  const handleLoadTemplate = (template: ReportTemplate) => {
    if (template.period_preset && template.period_preset !== 'custom') {
      handlePresetClick(template.period_preset as PresetKey);
    }
    setIsComparisonEnabled(template.include_comparison);
    if (template.comparison_preset) {
      handleComparisonPresetChange(template.comparison_preset as PresetKey);
    }
    toast.success(`Шаблон "${template.name}" загружен`);
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('report_templates' as any)
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Шаблон удалён');
    } catch (error) {
      toast.error('Ошибка удаления шаблона');
      console.error(error);
    }
  };

  // Load project settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!data.projectId) return;
      
      const { data: project } = await supabase
        .from('projects')
        .select('telegram_chat_id')
        .eq('id', data.projectId)
        .single();
      
      if (project) {
        setTelegramChatId(project.telegram_chat_id || '');
        setIsAutoReportEnabled(!!project.telegram_chat_id);
      }
    };
    
    loadSettings();
  }, [data.projectId]);

  const defaultSummary = `За отчётный период получено ${formatNumber(reportData.totals.leads)} лидов${computedMetrics.leadCost !== null ? ` по цене ${formatCurrency(computedMetrics.leadCost)} за лид` : ''}.${computedMetrics.customerCost !== null ? ` Стоимость клиента — ${formatCurrency(computedMetrics.customerCost)}.` : ''}
Совершено ${reportData.totals.sales} продаж на общую сумму ${formatCurrency(reportData.totals.revenue)}. ROAS ${computedMetrics.roas.toFixed(1)}x.${computedMetrics.impressionToLeadConv !== null ? ` CR (Показы→Лид) составила ${formatCR(computedMetrics.impressionToLeadConv)}.` : ''}${computedMetrics.leadToDiagnosticConv !== null ? ` CR (Лид→Диагностика) — ${formatCR(computedMetrics.leadToDiagnosticConv)}.` : ''}${computedMetrics.diagnosticToSaleConv !== null ? ` CR (Диагностика→Продажа) — ${formatCR(computedMetrics.diagnosticToSaleConv)}.` : ''}`;

  const [summary, setSummary] = useState(defaultSummary);

  // Update summary when data changes
  useEffect(() => {
    if (!aiAnalysis) {
      setSummary(defaultSummary);
    }
  }, [reportData.totals, computedMetrics, aiAnalysis]);

  useEffect(() => {
    if (aiAnalysis) {
      setSummary(aiAnalysis);
    }
  }, [aiAnalysis]);

  const handleGenerateAI = async () => {
    await generateAIReport({
      projectId: data.projectId,
      projectName: data.projectName,
      dateRange: reportDateRange,
      totals: reportData.totals,
      metrics: computedMetrics,
    });
  };

  const handleSaveSettings = async () => {
    if (!data.projectId) {
      toast.error('Проект не выбран');
      return;
    }

    setIsSavingSettings(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ telegram_chat_id: isAutoReportEnabled ? telegramChatId : null })
        .eq('id', data.projectId);

      if (error) throw error;
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error('Ошибка сохранения настроек');
      console.error(error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendTestReport = async () => {
    if (!telegramChatId) {
      toast.error('Укажите Chat ID Telegram');
      return;
    }

    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('weekly-report');
      
      if (error) throw error;
      toast.success('Тестовый отчёт отправлен');
    } catch (error) {
      toast.error('Ошибка отправки отчёта');
      console.error(error);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsGeneratingPDF(true);
    try {
      // Dynamic import for code splitting
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const fileName = `report_${format(reportDateRange.from, 'yyyy-MM-dd')}_${format(reportDateRange.to, 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast.success('Отчёт скачан', { description: fileName });
    } catch (error) {
      toast.error('Ошибка генерации PDF');
      console.error(error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Calculate plan/fact for display
  const planDataValues = data.planData || { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 };

  const metrics = [
    { label: 'Расход', value: reportData.totals.spend, plan: planDataValues.spend, format: 'currency', inverse: true },
    { label: 'Показы', value: reportData.totals.impressions, plan: planDataValues.impressions, format: 'number' },
    { label: 'Клики', value: reportData.totals.clicks, plan: planDataValues.clicks, format: 'number' },
    { label: 'Лиды', value: reportData.totals.leads, plan: planDataValues.leads, format: 'number' },
    { label: 'Диагностики', value: reportData.totals.diagnostics, plan: planDataValues.diagnostics, format: 'number' },
    { label: 'Продажи', value: reportData.totals.sales, plan: planDataValues.sales, format: 'number' },
    { label: 'Выручка', value: reportData.totals.revenue, plan: planDataValues.revenue, format: 'currency' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border rounded-2xl p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Отчёты</h2>
              </div>
              <p className="text-muted-foreground max-w-xl">
                Генерируйте PDF-отчёты с AI-аналитикой и настраивайте автоматическую отправку в Telegram
              </p>
            </div>
            
            {/* Templates */}
            <div className="flex gap-2">
              {templates.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Шаблоны ({templates.length})
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-2">
                      <p className="text-sm font-medium mb-3">Сохранённые шаблоны</p>
                      {templates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted">
                          <button
                            onClick={() => handleLoadTemplate(template)}
                            className="flex-1 text-left text-sm hover:text-primary"
                          >
                            {template.name}
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить шаблон
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Сохранить шаблон отчёта</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Название шаблона</Label>
                      <Input
                        id="template-name"
                        placeholder="Например: Еженедельный отчёт"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Будет сохранено:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Период: {presets.find(p => p.key === activePreset)?.label || 'Произвольный'}</li>
                        <li>Сравнение: {isComparisonEnabled ? 'Включено' : 'Выключено'}</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={handleSaveTemplate} 
                      disabled={isSavingTemplate || !newTemplateName.trim()}
                      className="w-full"
                    >
                      {isSavingTemplate ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Сохранить
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Date Range and Comparison */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            {/* Main Period */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Период:</span>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal min-w-[200px]",
                      !reportDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(reportDateRange.from, 'd MMM', { locale: ru })} — {format(reportDateRange.to, 'd MMM yyyy', { locale: ru })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="flex flex-wrap gap-2">
                      {presets.map((preset) => (
                        <Button
                          key={preset.key}
                          variant={activePreset === preset.key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePresetClick(preset.key)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <CalendarComponent
                    mode="range"
                    selected={{ from: reportDateRange.from, to: reportDateRange.to }}
                    onSelect={handleCalendarSelect}
                    numberOfMonths={2}
                    locale={ru}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Comparison Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="comparison-toggle"
                  checked={isComparisonEnabled}
                  onCheckedChange={setIsComparisonEnabled}
                />
                <Label htmlFor="comparison-toggle" className="text-sm flex items-center gap-1 cursor-pointer">
                  <GitCompare className="w-4 h-4" />
                  Сравнить с
                </Label>
              </div>
              
              {isComparisonEnabled && (
                <Select value={comparisonPreset} onValueChange={(v) => handleComparisonPresetChange(v as PresetKey)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.key} value={preset.key}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
        
        {(reportData.isLoading || comparisonData.isLoading) && (
          <div className="flex items-center gap-2 mt-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Загрузка данных...</span>
          </div>
        )}
      </div>

      {/* Comparison Summary */}
      {isComparisonEnabled && !comparisonData.isLoading && (
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <GitCompare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Сравнение периодов</h3>
            <Badge variant="secondary" className="text-xs">
              {format(comparisonDateRange.from, 'd MMM', { locale: ru })} — {format(comparisonDateRange.to, 'd MMM', { locale: ru })}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'Расход', current: reportData.totals.spend, previous: comparisonData.totals.spend, format: 'currency', inverse: true },
              { label: 'Показы', current: reportData.totals.impressions, previous: comparisonData.totals.impressions, format: 'number' },
              { label: 'Лиды', current: reportData.totals.leads, previous: comparisonData.totals.leads, format: 'number' },
              { label: 'Продажи', current: reportData.totals.sales, previous: comparisonData.totals.sales, format: 'number' },
              { label: 'Выручка', current: reportData.totals.revenue, previous: comparisonData.totals.revenue, format: 'currency' },
              { label: 'Стоимость лида', current: computedMetrics.leadCost ?? 0, previous: comparisonMetrics.leadCost ?? 0, format: 'currency', inverse: true },
            ].map((item) => {
              const change = getChange(item.current, item.previous);
              const isPositive = item.inverse ? change < 0 : change > 0;
              const isNeutral = Math.abs(change) < 0.5;
              
              return (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-semibold">
                    {item.format === 'currency' ? formatCurrency(item.current) : 
                     item.format === 'percent' ? `${item.current.toFixed(1)}%` : 
                     formatNumber(item.current)}
                  </p>
                  <div className={cn(
                    "text-xs flex items-center justify-center gap-1 mt-1",
                    isNeutral ? "text-muted-foreground" : isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {isNeutral ? (
                      <Minus className="w-3 h-3" />
                    ) : isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Предпросмотр отчёта
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Автоматизация
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6 mt-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
              >
                {isGeneratingAI ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI-анализ
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Check className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {isEditing ? 'Сохранить' : 'Редактировать'}
              </Button>
            </div>
            <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Скачать PDF
            </Button>
          </div>

          {/* Report Preview */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div ref={reportRef} className="p-8 text-foreground">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">AdMetrics</h1>
                    <p className="text-sm text-muted-foreground">Аналитический отчёт</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Проект</p>
                  <p className="font-semibold">{data.projectName}</p>
                </div>
              </div>

              {/* Report Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Calendar className="w-4 h-4" />
                <span>Период: {format(reportDateRange.from, 'd MMMM', { locale: ru })} — {format(reportDateRange.to, 'd MMMM yyyy', { locale: ru })}</span>
                <span className="text-border mx-2">|</span>
                <FileText className="w-4 h-4" />
                <span>Дата формирования: {format(new Date(), 'd MMMM yyyy', { locale: ru })}</span>
              </div>

              {/* Plan/Fact Table */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-foreground">📊 План / Факт</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left text-sm font-medium">Показатель</th>
                      <th className="border border-border p-3 text-right text-sm font-medium">План</th>
                      <th className="border border-border p-3 text-right text-sm font-medium">Факт</th>
                      <th className="border border-border p-3 text-center text-sm font-medium">Выполнение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, idx) => {
                      const { status, percent } = getPlanFactStatus(metric.value, metric.plan);
                      const statusColor = metric.inverse 
                        ? (status === 'success' ? 'text-destructive' : status === 'danger' ? 'text-success' : 'text-warning')
                        : (status === 'success' ? 'text-success' : status === 'danger' ? 'text-destructive' : 'text-warning');
                      
                      return (
                        <tr key={metric.label} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                          <td className="border border-border p-3 text-sm font-medium">{metric.label}</td>
                          <td className="border border-border p-3 text-right text-muted-foreground">
                            {metric.format === 'currency' ? formatCurrency(metric.plan) : formatNumber(metric.plan)}
                          </td>
                          <td className="border border-border p-3 text-right font-semibold">
                            {metric.format === 'currency' ? formatCurrency(metric.value) : formatNumber(metric.value)}
                          </td>
                          <td className={`border border-border p-3 text-center font-semibold ${statusColor}`}>
                            {metric.plan > 0 ? `${percent.toFixed(0)}%` : '—'}
                            {status === 'success' && !metric.inverse && ' ✓'}
                            {status === 'danger' && !metric.inverse && ' ↓'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Key Metrics */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-foreground">📈 Ключевые метрики</h2>
                <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                  {/* Стоимость клиента */}
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/70 dark:bg-slate-800/70 backdrop-blur p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-400 leading-tight">
                        Стоимость клиента
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-slate-900/5 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-400 flex-shrink-0">
                        <ShoppingCart className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                      {computedMetrics.customerCost !== null ? formatCurrency(computedMetrics.customerCost) : <span className="text-slate-400">—</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {computedMetrics.customerCost !== null ? 'Расходы / продажи' : 'Нет данных'}
                    </div>
                  </div>

                  {/* Стоимость диагностики */}
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/70 dark:bg-slate-800/70 backdrop-blur p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-400 leading-tight">
                        Стоимость диагностики
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-slate-900/5 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-400 flex-shrink-0">
                        <Target className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                      {computedMetrics.diagnosticCost !== null ? formatCurrency(computedMetrics.diagnosticCost) : <span className="text-slate-400">—</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {computedMetrics.diagnosticCost !== null ? 'Расходы / диагностики' : 'Нет данных'}
                    </div>
                  </div>

                  {/* Стоимость лида */}
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/70 dark:bg-slate-800/70 backdrop-blur p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-400 leading-tight">
                        Стоимость лида
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-slate-900/5 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-400 flex-shrink-0">
                        <Users className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                      {computedMetrics.leadCost !== null ? formatCurrency(computedMetrics.leadCost) : <span className="text-slate-400">—</span>}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {computedMetrics.leadCost !== null ? 'Расходы / лиды' : 'Нет данных'}
                    </div>
                  </div>

                  {/* CR (Показы→Лид) */}
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/70 dark:bg-slate-800/70 backdrop-blur p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-400 leading-tight">
                        CR (Показы→Лид)
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-slate-900/5 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-400 flex-shrink-0">
                        <TrendingUp className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                      {computedMetrics.impressionToLeadConv !== null ? (
                        <>
                          {formatCR(computedMetrics.impressionToLeadConv).replace('%', '')}
                          <span className="text-slate-400">%</span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {computedMetrics.impressionToLeadConv !== null ? 'Лиды / показы' : 'Нет данных'}
                    </div>
                  </div>

                  {/* CR (Лид→Диагностика) */}
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/70 dark:bg-slate-800/70 backdrop-blur p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-400 leading-tight">
                        CR (Лид→Диагностика)
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-slate-900/5 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-400 flex-shrink-0">
                        <Target className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                      {computedMetrics.leadToDiagnosticConv !== null ? (
                        <>
                          {formatCR(computedMetrics.leadToDiagnosticConv).replace('%', '')}
                          <span className="text-slate-400">%</span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {computedMetrics.leadToDiagnosticConv !== null ? 'Диагностики / лиды' : 'Нет данных'}
                    </div>
                  </div>

                  {/* CR (Диагностика→Продажа) */}
                  <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-800/70 dark:bg-slate-800/70 backdrop-blur p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-400 leading-tight">
                        CR (Диагностика→Продажа)
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-slate-900/5 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-400 flex-shrink-0">
                        <ShoppingCart className="w-3 h-3" />
                      </div>
                    </div>
                    <div className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                      {computedMetrics.diagnosticToSaleConv !== null ? (
                        <>
                          {formatCR(computedMetrics.diagnosticToSaleConv).replace('%', '')}
                          <span className="text-slate-400">%</span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {computedMetrics.diagnosticToSaleConv !== null ? 'Продажи / диагностики' : 'Нет данных'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Dynamics Chart */}
              {chartData.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-primary" />
                    Динамика метрик
                    {isComparisonEnabled && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (сплошная — текущий период, пунктир — сравнение)
                      </span>
                    )}
                  </h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                          tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'hsl(var(--popover-foreground))'
                          }}
                          formatter={(value: number, name: string) => {
                            const label = name.includes('Revenue') || name.includes('Выручка') ? formatCurrency(value) :
                                         name.includes('Spend') || name.includes('Расход') ? formatCurrency(value) :
                                         formatNumber(value);
                            return [label, name];
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '11px' }}
                          formatter={(value) => {
                            const labels: Record<string, string> = {
                              revenue: 'Выручка',
                              spend: 'Расход',
                              leads: 'Лиды',
                              sales: 'Продажи',
                              comparisonRevenue: 'Выручка (сравн.)',
                              comparisonSpend: 'Расход (сравн.)',
                              comparisonLeads: 'Лиды (сравн.)',
                              comparisonSales: 'Продажи (сравн.)',
                            };
                            return labels[value] || value;
                          }}
                        />
                        
                        {/* Current period lines */}
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="spend" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="leads" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        
                        {/* Comparison period lines (dashed) */}
                        {isComparisonEnabled && (
                          <>
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="comparisonRevenue" 
                              stroke="#22c55e" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                            <Line 
                              yAxisId="left"
                              type="monotone" 
                              dataKey="comparisonSpend" 
                              stroke="#ef4444" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="comparisonLeads" 
                              stroke="#8b5cf6" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                            <Line 
                              yAxisId="right"
                              type="monotone" 
                              dataKey="comparisonSales" 
                              stroke="#f59e0b" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                          </>
                        )}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Funnel */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-foreground">🎯 Воронка продаж</h2>
                <div className="space-y-3">
                  {funnelSteps.map((step, index) => {
                    const maxValue = funnelSteps[0].value;
                    const percentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
                    const nextStep = funnelSteps[index + 1];
                    const conversion = nextStep && step.value > 0 
                      ? ((nextStep.value / step.value) * 100).toFixed(1) 
                      : null;

                    return (
                      <div key={step.label} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-foreground">{step.label}</div>
                        <div className="flex-1 h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                          <div 
                            className="h-full rounded-lg flex items-center justify-end pr-3"
                            style={{ 
                              width: `${Math.max(percentage, 5)}%`,
                              backgroundColor: step.color 
                            }}
                          >
                            <span className="text-xs font-medium text-white">
                              {formatNumber(step.value)}
                            </span>
                          </div>
                        </div>
                        {conversion && (
                          <div className="w-16 text-right text-sm text-muted-foreground">
                            → {conversion}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI-анализ и рекомендации
                </h2>
                {isEditing ? (
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-32 bg-background text-foreground border-border"
                  />
                ) : (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/50 p-4 rounded-lg border border-border">
                    {summary}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Сгенерировано в AdMetrics • {format(new Date(), 'dd.MM.yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          {/* Auto Reports Settings */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Еженедельные отчёты в Telegram</h3>
                <p className="text-sm text-muted-foreground">Каждый понедельник в 09:00</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-report">Автоматическая отправка</Label>
                  <p className="text-sm text-muted-foreground">Отчёт будет приходить каждый понедельник</p>
                </div>
                <Switch
                  id="auto-report"
                  checked={isAutoReportEnabled}
                  onCheckedChange={setIsAutoReportEnabled}
                />
              </div>

              {isAutoReportEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="telegram-chat-id">Telegram Chat ID</Label>
                    <Input
                      id="telegram-chat-id"
                      placeholder="-1001234567890"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Получите Chat ID от @userinfobot в Telegram или используйте ID вашей группы
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSendTestReport}
                      disabled={isSendingTest || !telegramChatId}
                    >
                      {isSendingTest ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Отправить тестовый отчёт
                    </Button>
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                    >
                      {isSavingSettings ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Сохранить настройки
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* What's Included */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Что входит в отчёт
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">План / Факт</p>
                  <p className="text-sm text-muted-foreground">Сравнение с недельным планом</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Сравнение с прошлой неделей</p>
                  <p className="text-sm text-muted-foreground">Динамика ключевых метрик</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">AI-анализ</p>
                  <p className="text-sm text-muted-foreground">Выводы и рекомендации от ИИ</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Автоматическая доставка</p>
                  <p className="text-sm text-muted-foreground">Понедельник, 09:00 по местному времени</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">Требуется настройка Telegram бота</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Для работы автоматических отчётов необходимо настроить Telegram Bot Token в настройках проекта. 
                  Создайте бота через @BotFather и добавьте токен в секреты.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
