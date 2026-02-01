import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, 
  subMonths
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Download, Target, Loader2, 
  ShoppingCart, Users, TrendingUp 
} from 'lucide-react';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SummaryCard } from './SummaryCard';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
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

const formatPercent = (value: number): string => {
  return Math.round(value) + '%';
};

// Умное форматирование для CR (проценты)
const formatCR = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  if (value < 1) {
    return value.toFixed(2) + '%';
  }
  return value.toFixed(1) + '%';
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getWeekDay = (date: Date): number => {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
};

interface DataTableProps {
  dailyData: Record<string, DailyData>;
  onDataChange: (date: string, field: keyof DailyData, value: number) => void;
  planData?: PlanData;
  plansMap?: Record<string, PlanData>;
  onPlanChange?: (field: keyof PlanData, value: number, month?: string) => void;
}

// Editable cell component that only saves on blur
const EditableCell = ({ 
  value, 
  onSave, 
  className 
}: { 
  value: number | undefined; 
  onSave: (value: number) => void;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const initialValueRef = useRef(value?.toString() || '');

  // Sync with external value changes
  useEffect(() => {
    const newVal = value?.toString() || '';
    setLocalValue(newVal);
    initialValueRef.current = newVal;
  }, [value]);

  const handleBlur = useCallback(async () => {
    const numValue = parseFloat(localValue) || 0;
    const initialNum = parseFloat(initialValueRef.current) || 0;
    
    // Only save if value actually changed
    if (numValue !== initialNum) {
      setIsSaving(true);
      try {
        await onSave(numValue);
        initialValueRef.current = localValue;
      } finally {
        setIsSaving(false);
      }
    }
  }, [localValue, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        placeholder="0"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        disabled={isSaving}
      />
      {isSaving && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

type PresetKey = 'month' | 'lastMonth' | 'custom';

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'month', label: 'Этот месяц' },
  { key: 'lastMonth', label: 'Прошл. месяц' },
];



export const DataTable = React.memo(({
  dailyData,
  onDataChange,
  planData,
  plansMap,
  onPlanChange
}: DataTableProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const [activePreset, setActivePreset] = useState<PresetKey>('month');

  // Если пользователь выбирает произвольный диапазон в календаре, сбрасываем пресет
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    // Проверка соответствия текущего диапазона какому-либо пресету - сложная логика, 
    // проще сбрасывать activePreset, если он не был установлен через кнопку.
    // Но пока оставим ручное управление через handlePresetClick
  }, [dateRange]);

  const daysInRange = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    try {
      return eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
      });
    } catch (e) {
      return [];
    }
  }, [dateRange]);

  const handlePresetClick = (preset: PresetKey) => {
    const now = new Date();
    let newRange: DateRange;

    switch (preset) {
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

    setDateRange(newRange);
    setActivePreset(preset);
  };

  const totals = useMemo(() => {
    const rangeDays = daysInRange.map(d => format(d, 'yyyy-MM-dd'));
    const rangeData = rangeDays.map(date => dailyData[date]).filter(Boolean);
    
    return {
      spend: rangeData.reduce((sum, day) => sum + (day.spend || 0), 0),
      impressions: rangeData.reduce((sum, day) => sum + (day.impressions || 0), 0),
      clicks: rangeData.reduce((sum, day) => sum + (day.clicks || 0), 0),
      leads: rangeData.reduce((sum, day) => sum + (day.leads || 0), 0),
      followers: rangeData.reduce((sum, day) => sum + (day.followers || 0), 0),
      diagnostics: rangeData.reduce((sum, day) => sum + (day.diagnostics || 0), 0),
      sales: rangeData.reduce((sum, day) => sum + (day.sales || 0), 0),
      revenue: rangeData.reduce((sum, day) => sum + (day.revenue || 0), 0)
    };
  }, [dailyData, daysInRange]);

  // Определяем, какой план показывать
  // Логика: Если выбранный диапазон начинается в определенном месяце, показываем план этого месяца.
  const effectivePlanData = useMemo(() => {
    if (!dateRange?.from) return planData;

    if (plansMap) {
      const monthKey = format(startOfMonth(dateRange.from), 'yyyy-MM-dd');
      return plansMap[monthKey] || null;
    }
    
    return planData;
  }, [plansMap, dateRange, planData]);

  // Calculated metrics
  const customerCost = totals.sales > 0 ? Math.round(totals.spend / totals.sales) : null;
  const diagnosticCost = totals.diagnostics > 0 ? Math.round(totals.spend / totals.diagnostics) : null;
  const leadCost = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : null;
  const impressionToLeadConv = totals.impressions > 0 ? (totals.leads / totals.impressions) * 100 : null;
  const leadToDiagnosticConv = totals.leads > 0 ? (totals.diagnostics / totals.leads) * 100 : null;
  const diagnosticToSaleConv = totals.diagnostics > 0 ? (totals.sales / totals.diagnostics) * 100 : null;
  
  // Average revenue for heatmap
  const averageRevenue = useMemo(() => {
    const rangeDays = daysInRange.map(d => format(d, 'yyyy-MM-dd'));
    const rangeData = rangeDays.map(date => dailyData[date]).filter(Boolean);
    if (rangeData.length === 0) return 0;
    const totalRevenue = rangeData.reduce((sum, day) => sum + (day.revenue || 0), 0);
    return totalRevenue / rangeData.length;
  }, [dailyData, daysInRange]);

  const exportToCSV = () => {
    const headers = ['Дата', 'День', 'Расходы', 'Показы', 'Клики', 'CTR%', 'Лиды', 'Подписчики', 'Стоимость лида', 'Диагностики', 'Продажи', 'Выручка'];
    const rows = daysInRange.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const data = dailyData[dateKey];
      const dayClicks = data?.clicks || 0;
      const dayImpressions = data?.impressions || 0;
      const dayCtr = dayImpressions > 0 ? Math.round(dayClicks / dayImpressions * 100) : 0;
      const dayLeads = data?.leads || 0;
      const dayFollowers = data?.followers || 0;
      const daySpend = data?.spend || 0;
      const dayCpl = dayLeads > 0 ? Math.round(daySpend / dayLeads) : 0;
      return [
        format(day, 'dd.MM.yyyy'), 
        WEEKDAYS[getWeekDay(day)], 
        data?.spend || 0, 
        data?.impressions || 0, 
        dayClicks, 
        dayCtr, 
        dayLeads, 
        dayFollowers, 
        dayCpl, 
        data?.diagnostics || 0, 
        data?.sales || 0, 
        data?.revenue || 0,
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'export'}.csv`;
    link.click();
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Calculated Metrics Bar */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          title="Стоимость клиента"
          icon={ShoppingCart}
          value={customerCost !== null ? formatCurrency(customerCost) : <span className="text-muted-foreground">—</span>}
          subtitle={customerCost !== null ? 'Расходы / продажи' : 'Нет данных'}
        />
        <SummaryCard
          title="Стоимость диагностики"
          icon={Target}
          value={diagnosticCost !== null ? formatCurrency(diagnosticCost) : <span className="text-muted-foreground">—</span>}
          subtitle={diagnosticCost !== null ? 'Расходы / диагностики' : 'Нет данных'}
        />
        <SummaryCard
          title="Стоимость лида"
          icon={Users}
          value={leadCost !== null ? formatCurrency(leadCost) : <span className="text-muted-foreground">—</span>}
          subtitle={leadCost !== null ? 'Расходы / лиды' : 'Нет данных'}
        />
        <SummaryCard
          title="CR (Показы→Лид)"
          icon={TrendingUp}
          value={impressionToLeadConv !== null ? (
            <>
              {formatCR(impressionToLeadConv).replace('%', '')}
              <span className="text-muted-foreground">%</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          subtitle={impressionToLeadConv !== null ? 'Лиды / показы' : 'Нет данных'}
        />
        <SummaryCard
          title="CR (Лид→Диагностика)"
          icon={Target}
          value={leadToDiagnosticConv !== null ? (
            <>
              {formatCR(leadToDiagnosticConv).replace('%', '')}
              <span className="text-muted-foreground">%</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          subtitle={leadToDiagnosticConv !== null ? 'Диагностики / лиды' : 'Нет данных'}
        />
        <SummaryCard
          title="CR (Диагностика→Продажа)"
          icon={ShoppingCart}
          value={diagnosticToSaleConv !== null ? (
            <>
              {formatCR(diagnosticToSaleConv).replace('%', '')}
              <span className="text-muted-foreground">%</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          subtitle={diagnosticToSaleConv !== null ? 'Продажи / диагностики' : 'Нет данных'}
        />
      </div>

      <div className="bg-card border rounded-xl">
        {/* Header with Date Range Selection */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 md:p-4 border-b gap-3 lg:gap-2">
          
          {/* Controls Container */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
            {/* Presets */}
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset.key)}
                  className={cn(
                    "px-2 py-1.5 text-xs font-medium rounded-md transition-colors",
                    activePreset === preset.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          
          <button onClick={exportToCSV} className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs md:text-sm whitespace-nowrap self-end lg:self-auto">
            <Download className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Экспорт CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[75vh] data-table scrollbar-thin -mx-px relative">
          <table className="w-full text-xs md:text-sm border-collapse">
            <thead className="sticky top-0 z-50 shadow-md bg-background">
              <tr className="border-b bg-secondary/95 backdrop-blur-sm">
                <th className="text-left p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 sticky left-0 bg-secondary/95 backdrop-blur-sm min-w-[90px] md:min-w-[120px] z-40 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Дата</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[90px] md:min-w-[110px]">Расходы</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[70px] md:min-w-[100px]">Показы</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[60px] md:min-w-[80px]">Клики</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[60px] md:min-w-[80px]">Лиды</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[80px] md:min-w-[100px]">Подписчики</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[80px] md:min-w-[100px]">Диагностики</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[70px] md:min-w-[80px]">Продажи</th>
                <th className="text-right p-2 md:p-3 font-semibold text-foreground/90 dark:text-foreground/95 min-w-[90px] md:min-w-[120px]">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {/* Plan Row - editable at top */}
              {effectivePlanData && (
                <tr className="bg-primary/10 font-semibold border-b border-primary/20 backdrop-blur-sm">
                  <td className="p-2 md:p-4 sticky left-0 bg-primary/10 backdrop-blur-sm z-30 flex items-center gap-1 md:gap-2 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">
                    <Target className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <div className="flex flex-col">
                      <span>ПЛАН</span>
                      {dateRange?.from && (
                        <span className="text-[10px] text-primary/70 font-normal">
                          {format(dateRange.from, 'LLLL', { locale: ru })}
                        </span>
                      )}
                    </div>
                  </td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'diagnostics', 'sales', 'revenue'] as const).map(field => (
                    <td key={field} className="p-1 md:p-2">
                      {onPlanChange ? (
                        <EditableCell
                          value={effectivePlanData[field]}
                          onSave={(val) => {
                             // Pass the specific month key for the update
                             const monthKey = dateRange?.from ? format(startOfMonth(dateRange.from), 'yyyy-MM-dd') : undefined;
                             onPlanChange(field, val, monthKey);
                          }}
                          className="w-full text-right bg-primary/5 border border-primary/20 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2 transition-all text-xs md:text-sm font-semibold"
                        />
                      ) : (
                        <span className="block text-right px-1.5 md:px-3 py-1.5 md:py-2">
                          {field === 'spend' || field === 'revenue' ? formatCurrency(effectivePlanData[field]) : formatNumber(effectivePlanData[field])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Fact Totals Row - second */}
              <tr className="bg-secondary/95 backdrop-blur-sm font-semibold border-b border-border/50">
                <td className="p-2 md:p-4 sticky left-0 bg-secondary/95 backdrop-blur-sm z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">ФАКТ</td>
                <td className="p-2 md:p-4 text-right">{formatCurrency(totals.spend)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.impressions)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.clicks)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.leads)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.followers)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.diagnostics)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.sales)}</td>
                <td className="p-2 md:p-4 text-right text-success">{formatCurrency(totals.revenue)}</td>
              </tr>

              {/* Percentage Row - third */}
              {effectivePlanData && (
                <tr className="bg-muted/90 backdrop-blur-sm border-b border-border shadow-sm">
                  <td className="p-2 md:p-4 sticky left-0 bg-muted/90 backdrop-blur-sm z-30 text-foreground/80 dark:text-foreground/90 text-sm md:text-base font-semibold shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">% выполн.</td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'diagnostics', 'sales', 'revenue'] as const).map(field => {
                    const fact = totals[field];
                    const plan = effectivePlanData[field];
                    
                    const percent = plan > 0 ? fact / plan * 100 : 0;
                    // Heatmap colors: >= 100% - bright green, 80-99% - yellow, < 80% - soft red
                    let colorClass = '';
                    if (field === 'spend') {
                      // For spend, <= 100% is good
                      colorClass = percent <= 100 ? 'text-emerald-600 dark:text-emerald-400' : percent <= 120 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500/80 dark:text-red-400/80';
                    } else {
                      // For other metrics, >= 100% is good
                      colorClass = percent >= 100 ? 'text-emerald-600 dark:text-emerald-400' : percent >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500/80 dark:text-red-400/80';
                    }
                    return (
                      <td key={field} className={`p-2 md:p-4 text-right font-medium ${colorClass}`}>
                        {percent.toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              )}
              {/* Daily data rows */}
              {daysInRange.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const weekDay = getWeekDay(day);
                const isWeekend = weekDay >= 5;
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const dayData = dailyData[dateKey];
                const dayRevenue = dayData?.revenue || 0;
                const isRevenueAboveAverage = dayRevenue > averageRevenue && averageRevenue > 0;
                
                return (
                  <tr 
                    key={dateKey} 
                    className={`border-b hover:bg-foreground/[0.05] transition-colors ${isWeekend ? 'bg-secondary/20' : ''} ${isToday ? 'ring-1 ring-primary/30' : ''}`}
                  >
                    <td className={`p-2 md:p-3 sticky left-0 backdrop-blur-sm z-10 ${isWeekend ? 'bg-secondary/20' : 'bg-card'} ${isToday ? 'ring-1 ring-primary/30' : ''}`}>
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className={`text-xs md:text-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded font-semibold ${isWeekend ? 'bg-muted text-foreground/70 dark:text-foreground/80' : 'bg-primary/10 text-primary'}`}>
                          {WEEKDAYS[weekDay]}
                        </span>
                        <span className={`font-semibold text-sm md:text-base ${isToday ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</span>
                        {isToday && <span className="text-xs md:text-sm text-primary font-medium hidden sm:inline">(сегодня)</span>}
                      </div>
                    </td>
                    {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'diagnostics', 'sales', 'revenue'] as const).map(field => {
                      const isRevenueCell = field === 'revenue';
                      return (
                        <td 
                          key={field} 
                          className={`p-1 md:p-2 ${isRevenueCell && isRevenueAboveAverage ? 'bg-blue-500/10 dark:bg-blue-500/10' : ''}`}
                        >
                          <EditableCell
                            value={dayData?.[field] as number | undefined}
                            onSave={(val) => onDataChange(dateKey, field, val)}
                            className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2 transition-all text-xs md:text-sm"
                          />
                      </td>
                    );
                  })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-secondary shadow-[0_-1px_0_0_rgba(0,0,0,0.1)]">
              <tr className="font-bold text-foreground">
                <td className="p-2 md:p-4 sticky left-0 bg-secondary backdrop-blur-sm z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">ИТОГО</td>
                <td className="p-2 md:p-4 text-right">{formatCurrency(totals.spend)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.impressions)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.clicks)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.leads)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.followers)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.diagnostics)}</td>
                <td className="p-2 md:p-4 text-right">{formatNumber(totals.sales)}</td>
                <td className="p-2 md:p-4 text-right text-success">{formatCurrency(totals.revenue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
});