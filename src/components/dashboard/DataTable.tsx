import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  subMonths, addMonths
} from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Download, Target, Loader2,
  ShoppingCart, Users, TrendingUp,
  ChevronLeft, ChevronRight
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
  visits: number;
  sales: number;
  revenue: number;
}

interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  followers: number;
  visits: number;
  sales: number;
  revenue: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const formatPercent = (value: number): string => {
  return Math.round(value) + '%';
};

// Умное форматирование для CR (проценты)
const formatCR = (value: number | null): string => {
  if (value === null || isNaN(value) || !isFinite(value)) return '—';
  return Math.round(value) + '%';
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


  const handlePrevMonth = () => {
    if (!dateRange?.from) return;
    const prevMonth = subMonths(dateRange.from, 1);
    setDateRange({ from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) });
  };

  const handleNextMonth = () => {
    if (!dateRange?.from) return;
    const nextMonth = addMonths(dateRange.from, 1);
    setDateRange({ from: startOfMonth(nextMonth), to: endOfMonth(nextMonth) });
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
      visits: rangeData.reduce((sum, day) => sum + (day.visits || 0), 0),
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
  const visitCost = totals.visits > 0 ? Math.round(totals.spend / totals.visits) : null;
  const leadCost = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : null;
  const impressionToLeadConv = totals.impressions > 0 ? (totals.leads / totals.impressions) * 100 : null;
  const leadToVisitConv = totals.leads > 0 ? (totals.visits / totals.leads) * 100 : null;
  const visitToSaleConv = totals.visits > 0 ? (totals.sales / totals.visits) * 100 : null;

  // Average revenue for heatmap
  const averageRevenue = useMemo(() => {
    const rangeDays = daysInRange.map(d => format(d, 'yyyy-MM-dd'));
    const rangeData = rangeDays.map(date => dailyData[date]).filter(Boolean);
    if (rangeData.length === 0) return 0;
    const totalRevenue = rangeData.reduce((sum, day) => sum + (day.revenue || 0), 0);
    return totalRevenue / rangeData.length;
  }, [dailyData, daysInRange]);

  const exportToCSV = () => {
    const headers = ['Дата', 'День', 'Расходы', 'Показы', 'Клики', 'CTR%', 'Лиды', 'Подписчики', 'Стоимость лида', 'Диагностика', 'Продажи', 'Выручка'];
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
        data?.visits || 0,
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
          title="Стоимость визита"
          icon={Target}
          value={visitCost !== null ? formatCurrency(visitCost) : <span className="text-muted-foreground">—</span>}
          subtitle={visitCost !== null ? 'Расходы / визиты' : 'Нет данных'}
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
          value={leadToVisitConv !== null ? (
            <>
              {formatCR(leadToVisitConv).replace('%', '')}
              <span className="text-muted-foreground">%</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          subtitle={leadToVisitConv !== null ? 'Диагностика / лиды' : 'Нет данных'}
        />
        <SummaryCard
          title="CR (Диагностика→Продажа)"
          icon={ShoppingCart}
          value={visitToSaleConv !== null ? (
            <>
              {formatCR(visitToSaleConv).replace('%', '')}
              <span className="text-muted-foreground">%</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          subtitle={visitToSaleConv !== null ? 'Продажи / диагностика' : 'Нет данных'}
        />
      </div>

      <div className="rounded-[2.5rem] border border-white/5 bg-[#020617]/40 backdrop-blur-3xl shadow-interstellar relative overflow-hidden group mb-6 transition-all duration-500 hover:bg-[#020617]/60">
        {/* Header with Date Range Selection */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 md:p-8 border-b border-white/5 bg-white/[0.02] backdrop-blur-md gap-4 relative z-10">

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#020617]/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="text-sm font-black uppercase tracking-[0.2em] min-w-[140px] text-center text-white">
                {dateRange?.from ? format(dateRange.from, 'LLLL yyyy', { locale: ru }) : ''}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-10 w-10 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Button onClick={exportToCSV} className="gap-3 h-14 px-8 bg-primary hover:bg-primary/90 text-white shadow-interstellar rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] border-0">
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Экспорт Системы</span>
          </Button>
        </div>

        {/* Table */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-all duration-700 pointer-events-none" />
        <div className="overflow-auto max-h-[75vh] data-table scrollbar-thin -mx-px relative z-10 custom-scrollbar">
          <table className="w-full text-xs md:text-sm border-collapse">
            <thead className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl">
              <tr className="border-b border-white/5">
                <th className="text-left p-5 font-black text-white/30 sticky left-0 bg-[#020617]/90 backdrop-blur-3xl min-w-[90px] md:min-w-[120px] z-40 shadow-[1px_0_0_0_rgba(255,255,255,0.05)] uppercase text-[10px] tracking-[0.2em]">Временная Метка</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[90px] md:min-w-[110px]">Ресурс</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[70px] md:min-w-[100px]">Охват</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[60px] md:min-w-[80px]">Интеракции</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[60px] md:min-w-[80px]">Лидогенерация</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[80px] md:min-w-[100px]">Аудитория</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[80px] md:min-w-[100px]">Диагностика</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[70px] md:min-w-[80px]">Транзакции</th>
                <th className="text-right p-5 font-black text-white/30 uppercase text-[10px] tracking-[0.2em] min-w-[90px] md:min-w-[120px]">Капитал</th>
              </tr>
            </thead>
            <tbody>
              {/* Plan Row - editable at top */}
              {effectivePlanData && (
                <tr className="bg-blue-500/5 font-bold border-b border-blue-500/10 backdrop-blur-md">
                  <td className="p-4 sticky left-0 bg-blue-500/5 backdrop-blur-md z-30 flex items-center gap-2 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] text-blue-700">
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
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'visits', 'sales', 'revenue'] as const).map(field => (
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
              <tr className="bg-white/90 backdrop-blur-xl font-bold border-b border-slate-200/60 shadow-sm">
                <td className="p-4 sticky left-0 bg-white/90 backdrop-blur-xl z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] text-slate-900">ФАКТ</td>
                <td className="p-2 md:p-4 text-right text-slate-900 font-mono font-bold">{formatCurrency(totals.spend)}</td>
                <td className="p-2 md:p-4 text-right text-slate-900 font-mono font-bold">{formatNumber(totals.impressions)}</td>
                <td className="p-2 md:p-4 text-right text-slate-900 font-mono font-bold">{formatNumber(totals.clicks)}</td>
                <td className="p-2 md:p-4 text-right text-slate-900 font-mono font-bold">{formatNumber(totals.leads)}</td>
                <td className="p-2 md:p-4 text-right text-slate-900 font-mono font-bold">{formatNumber(totals.followers)}</td>
                <td className="p-2 md:p-4 text-right text-slate-900 font-mono font-bold">{formatNumber(totals.visits)}</td>
                <td className="p-2 md:p-4 text-right text-slate-900 font-mono font-bold">{formatNumber(totals.sales)}</td>
                <td className="p-2 md:p-4 text-right font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{formatCurrency(totals.revenue)}</td>
              </tr>

              {/* Percentage Row - third */}
              {effectivePlanData && (
                <tr className="bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm font-bold">
                  <td className="p-4 sticky left-0 bg-slate-50/90 backdrop-blur-xl z-30 text-slate-700 text-sm font-bold shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">% выполн.</td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'visits', 'sales', 'revenue'] as const).map(field => {
                    const fact = totals[field];
                    const plan = effectivePlanData[field];

                    const percent = plan > 0 ? fact / plan * 100 : 0;
                    // Heatmap colors: >= 100% - bright green, 80-99% - yellow, < 80% - soft red
                    let colorClass = '';
                    if (field === 'spend') {
                      // For spend, <= 100% is good
                      colorClass = percent <= 100 ? 'text-blue-600' : percent <= 120 ? 'text-yellow-600' : 'text-red-500/80'
                    } else {
                      // For other metrics, >= 100% is good
                      colorClass = percent >= 100 ? 'text-blue-600' : percent >= 80 ? 'text-yellow-600' : 'text-red-500/80'
                    }
                    return (
                      <td key={field} className="p-2 md:p-4">
                        <div className={`text-right font-medium ${colorClass}`}>{percent.toFixed(0)}%</div>
                        <div className="mt-1 h-1.5 w-full bg-background/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(percent, 100)}%`,
                              background: field === 'spend'
                                ? (percent <= 100
                                  ? 'linear-gradient(90deg,#10b981,#34d399)'
                                  : percent <= 120
                                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                    : 'linear-gradient(90deg,#ef4444,#f87171)')
                                : (percent >= 100
                                  ? 'linear-gradient(90deg,#10b981,#34d399)'
                                  : percent >= 80
                                    ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                                    : 'linear-gradient(90deg,#ef4444,#f87171)'),
                              boxShadow: '0 0 12px rgba(16,185,129,0.25)',
                            }}
                          />
                        </div>
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
                    className={cn("border-b border-slate-100 hover:bg-white/80 transition-all hover:shadow-sm group", isToday && "bg-blue-50/50", isWeekend && "bg-slate-50/50")}
                  >
                    <td className={cn("p-2 md:p-4 sticky left-0 z-20 backdrop-blur-md shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-all", isToday ? "bg-blue-50/80" : isWeekend ? "bg-slate-50/80" : "bg-white/60 group-hover:bg-white/90")}>
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-medium",
                          isToday && "text-primary"
                        )}>
                          {format(day, 'dd')}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {WEEKDAYS[weekDay]}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.spend}
                          onSave={(val) => onDataChange(dateKey, 'spend', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatCurrency(dayData?.spend || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.impressions}
                          onSave={(val) => onDataChange(dateKey, 'impressions', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.impressions || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.clicks}
                          onSave={(val) => onDataChange(dateKey, 'clicks', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.clicks || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground font-medium">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.leads}
                          onSave={(val) => onDataChange(dateKey, 'leads', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground font-medium"
                        />
                      ) : formatNumber(dayData?.leads || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.followers}
                          onSave={(val) => onDataChange(dateKey, 'followers', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.followers || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.visits}
                          onSave={(val) => onDataChange(dateKey, 'visits', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.visits || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground font-medium">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.sales}
                          onSave={(val) => onDataChange(dateKey, 'sales', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground font-medium"
                        />
                      ) : formatNumber(dayData?.sales || 0)}
                    </td>
                    <td className={cn(
                      "p-2 md:p-3 text-right font-semibold",
                      isRevenueAboveAverage ? "text-blue-600" : "text-foreground"
                    )}>
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.revenue}
                          onSave={(val) => onDataChange(dateKey, 'revenue', val)}
                          className={cn(
                            "w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-slate-50 focus:ring-1 focus:ring-primary/20 rounded px-1 font-semibold",
                            isRevenueAboveAverage ? "text-blue-600" : "text-foreground"
                          )}
                        />
                      ) : formatCurrency(dayData?.revenue || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

DataTable.displayName = "DataTable";
