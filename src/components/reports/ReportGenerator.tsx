import { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Edit3, 
  Check,
  BarChart3,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReportData {
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

export const ReportGenerator = ({ data }: ReportGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState(() => {
    const roi = data.metrics.romi > 0 ? 'положительной' : 'отрицательной';
    return `За отчётный период реклама показала ${roi} окупаемость с ROMI ${data.metrics.romi.toFixed(1)}%. 
Получено ${formatNumber(data.totals.leads)} лидов по цене ${formatCurrency(data.metrics.cpl)} за лид. 
Совершено ${data.totals.sales} продаж на общую сумму ${formatCurrency(data.totals.revenue)}.
${data.metrics.romi > 100 ? 'Рекомендуется увеличить рекламный бюджет для масштабирования.' : 'Рекомендуется оптимизировать воронку для повышения конверсии.'}`;
  });

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Генерация отчёта</h2>
          <p className="text-sm text-muted-foreground">
            {format(data.dateRange.from, 'd MMMM', { locale: ru })} — {format(data.dateRange.to, 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Check className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
            {isEditing ? 'Сохранить' : 'Редактировать'}
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Скачать PDF
          </Button>
        </div>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-xl border overflow-hidden">
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

          {/* Summary Table */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Сводная таблица</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 p-3 text-left text-sm font-medium">Показатель</th>
                  <th className="border border-gray-200 p-3 text-right text-sm font-medium">Значение</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 p-3 text-sm">Расходы на рекламу</td>
                  <td className="border border-gray-200 p-3 text-right font-semibold text-red-600">{formatCurrency(data.totals.spend)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-3 text-sm">Показы</td>
                  <td className="border border-gray-200 p-3 text-right">{formatNumber(data.totals.impressions)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 text-sm">Клики</td>
                  <td className="border border-gray-200 p-3 text-right">{formatNumber(data.totals.clicks)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-3 text-sm">Лиды</td>
                  <td className="border border-gray-200 p-3 text-right">{formatNumber(data.totals.leads)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 text-sm">Диагностики</td>
                  <td className="border border-gray-200 p-3 text-right">{formatNumber(data.totals.diagnostics)}</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border border-gray-200 p-3 text-sm">Продажи</td>
                  <td className="border border-gray-200 p-3 text-right font-semibold text-green-600">{formatNumber(data.totals.sales)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3 text-sm">Выручка</td>
                  <td className="border border-gray-200 p-3 text-right font-semibold text-green-600">{formatCurrency(data.totals.revenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Metrics */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Ключевые метрики</h2>
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
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Воронка продаж</h2>
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

          {/* Summary Text */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Заключение</h2>
            {isEditing ? (
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-32 bg-white text-gray-900 border-gray-300"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg">
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
    </div>
  );
};
