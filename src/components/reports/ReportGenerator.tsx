import { useState, useRef, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAIReport } from '@/hooks/useAIReport';
import { supabase } from '@/integrations/supabase/client';

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
    cpl: number;
    cac: number;
    aov: number;
    romi: number;
    roas: number;
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

const getPlanFactStatus = (fact: number, plan: number) => {
  if (plan === 0) return { status: 'neutral', percent: 0 };
  const percent = (fact / plan) * 100;
  return {
    status: percent >= 100 ? 'success' : percent >= 80 ? 'warning' : 'danger',
    percent: percent
  };
};

export const ReportGenerator = ({ data }: ReportGeneratorProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isAutoReportEnabled, setIsAutoReportEnabled] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { isGenerating: isGeneratingAI, aiAnalysis, generateAIReport } = useAIReport();

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

  const defaultSummary = `За отчётный период реклама показала ${data.metrics.romi > 0 ? 'положительной' : 'отрицательной'} окупаемость с ROMI ${data.metrics.romi.toFixed(1)}%. 
Получено ${formatNumber(data.totals.leads)} лидов по цене ${formatCurrency(data.metrics.cpl)} за лид. 
Совершено ${data.totals.sales} продаж на общую сумму ${formatCurrency(data.totals.revenue)}.
${data.metrics.romi > 100 ? 'Рекомендуется увеличить рекламный бюджет для масштабирования.' : 'Рекомендуется оптимизировать воронку для повышения конверсии.'}`;

  const [summary, setSummary] = useState(defaultSummary);

  useEffect(() => {
    if (aiAnalysis) {
      setSummary(aiAnalysis);
    }
  }, [aiAnalysis]);

  const handleGenerateAI = async () => {
    await generateAIReport(data);
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
      
      const fileName = `report_${format(data.dateRange.from, 'yyyy-MM-dd')}_${format(data.dateRange.to, 'yyyy-MM-dd')}.pdf`;
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
  const planData = data.planData || { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 };

  const metrics = [
    { label: 'Расход', value: data.totals.spend, plan: planData.spend, format: 'currency', inverse: true },
    { label: 'Показы', value: data.totals.impressions, plan: planData.impressions, format: 'number' },
    { label: 'Клики', value: data.totals.clicks, plan: planData.clicks, format: 'number' },
    { label: 'Лиды', value: data.totals.leads, plan: planData.leads, format: 'number' },
    { label: 'Диагностики', value: data.totals.diagnostics, plan: planData.diagnostics, format: 'number' },
    { label: 'Продажи', value: data.totals.sales, plan: planData.sales, format: 'number' },
    { label: 'Выручка', value: data.totals.revenue, plan: planData.revenue, format: 'currency' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Отчёты</h2>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Генерируйте PDF-отчёты с AI-аналитикой и настраивайте автоматическую отправку в Telegram
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {format(data.dateRange.from, 'd MMM', { locale: ru })} — {format(data.dateRange.to, 'd MMM', { locale: ru })}
          </Badge>
        </div>
      </div>

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
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <div ref={reportRef} className="p-8 text-gray-900">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">AdMetrics</h1>
                    <p className="text-sm text-gray-500">Аналитический отчёт</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Проект</p>
                  <p className="font-semibold">{data.projectName}</p>
                </div>
              </div>

              {/* Report Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Calendar className="w-4 h-4" />
                <span>Период: {format(data.dateRange.from, 'd MMMM', { locale: ru })} — {format(data.dateRange.to, 'd MMMM yyyy', { locale: ru })}</span>
                <span className="text-gray-300 mx-2">|</span>
                <FileText className="w-4 h-4" />
                <span>Дата формирования: {format(new Date(), 'd MMMM yyyy', { locale: ru })}</span>
              </div>

              {/* Plan/Fact Table */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">📊 План / Факт</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-200 p-3 text-left text-sm font-medium">Показатель</th>
                      <th className="border border-gray-200 p-3 text-right text-sm font-medium">План</th>
                      <th className="border border-gray-200 p-3 text-right text-sm font-medium">Факт</th>
                      <th className="border border-gray-200 p-3 text-center text-sm font-medium">Выполнение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric, idx) => {
                      const { status, percent } = getPlanFactStatus(metric.value, metric.plan);
                      const statusColor = metric.inverse 
                        ? (status === 'success' ? 'text-red-600' : status === 'danger' ? 'text-green-600' : 'text-yellow-600')
                        : (status === 'success' ? 'text-green-600' : status === 'danger' ? 'text-red-600' : 'text-yellow-600');
                      
                      return (
                        <tr key={metric.label} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                          <td className="border border-gray-200 p-3 text-sm font-medium">{metric.label}</td>
                          <td className="border border-gray-200 p-3 text-right text-gray-500">
                            {metric.format === 'currency' ? formatCurrency(metric.plan) : formatNumber(metric.plan)}
                          </td>
                          <td className="border border-gray-200 p-3 text-right font-semibold">
                            {metric.format === 'currency' ? formatCurrency(metric.value) : formatNumber(metric.value)}
                          </td>
                          <td className={`border border-gray-200 p-3 text-center font-semibold ${statusColor}`}>
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
                <h2 className="text-lg font-semibold mb-4 text-gray-900">📈 Ключевые метрики</h2>
                <div className="grid grid-cols-5 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">CPL</p>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(data.metrics.cpl)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">CAC</p>
                    <p className="text-lg font-bold">{formatCurrency(data.metrics.cac)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">AOV</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(data.metrics.aov)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">ROMI</p>
                    <p className={`text-lg font-bold ${data.metrics.romi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.metrics.romi.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">ROAS</p>
                    <p className={`text-lg font-bold ${data.metrics.roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.metrics.roas.toFixed(2)}x
                    </p>
                  </div>
                </div>
              </div>

              {/* Funnel */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">🎯 Воронка продаж</h2>
                <div className="space-y-3">
                  {data.funnelSteps.map((step, index) => {
                    const maxValue = data.funnelSteps[0].value;
                    const percentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
                    const nextStep = data.funnelSteps[index + 1];
                    const conversion = nextStep && step.value > 0 
                      ? ((nextStep.value / step.value) * 100).toFixed(1) 
                      : null;

                    return (
                      <div key={step.label} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium text-gray-700">{step.label}</div>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
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
                          <div className="w-16 text-right text-sm text-gray-500">
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
                <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  AI-анализ и рекомендации
                </h2>
                {isEditing ? (
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-32 bg-white text-gray-900 border-gray-300"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
                    {summary}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400">
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