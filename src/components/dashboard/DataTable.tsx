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
    <div className="relative group/cell w-full h-full flex items-center justify-end">
      <input
        type="number"
        placeholder="0"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full text-right bg-black/5 dark:bg-black/20 border border-white/5 focus:border-primary/50 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 rounded-lg px-3 py-2 transition-all font-mono font-medium",
          className
        )}
        disabled={isSaving}
      />
      {isSaving && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          <Loader2 className="w-2.5 h-2.5 animate-spin text-primary/50" />
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

      <div className="glass-card border rounded-xl stripe-blue">
        {/* Header with Date Range Selection */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-3 md:p-4 border-b gap-3 lg:gap-2">

          {/* Controls Container */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-sm font-medium capitalize min-w-[120px] text-center">
              {dateRange?.from ? format(dateRange.from, 'LLLL yyyy', { locale: ru }) : ''}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={exportToCSV} variant="glow" size="sm" className="gap-2 self-end lg:self-auto">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Экспорт CSV</span>
          </Button>
        </div>

        {/* Table Container */}
        <div className="overflow-auto max-h-[75vh] data-table scrollbar-thin -mx-px relative rounded-b-xl">
          <table className="w-full text-xs md:text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-50">
              <tr className="bg-card/95 backdrop-blur-md">
                <th className="text-left p-3 md:p-4 font-semibold text-muted-foreground sticky left-0 bg-card/95 backdrop-blur-md min-w-[100px] md:min-w-[140px] z-40 border-b border-border/10 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">Дата</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[90px] md:min-w-[120px] border-b border-border/10">Расходы</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[80px] md:min-w-[110px] border-b border-border/10">Показы</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[70px] md:min-w-[90px] border-b border-border/10">Клики</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[70px] md:min-w-[90px] border-b border-border/10">Лиды</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[90px] md:min-w-[110px] border-b border-border/10">Подписчики</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[90px] md:min-w-[110px] border-b border-border/10">Диагностика</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[80px] md:min-w-[100px] border-b border-border/10">Продажи</th>
                <th className="text-right p-3 md:p-4 font-semibold text-muted-foreground min-w-[100px] md:min-w-[140px] border-b border-border/10">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {/* Plan Row - Premium dark-teal/emerald styling as per reference */}
              {effectivePlanData && (
                <tr className="bg-emerald-950/20 dark:bg-emerald-500/10 font-bold border-b border-emerald-500/20">
                  <td className="p-0 sticky left-0 z-30 shadow-[1px_0_0_0_rgba(16,185,129,0.1)]">
                    <div className="bg-emerald-600 dark:bg-emerald-800/80 p-4 h-full flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                        <Target className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white tracking-widest text-[11px] font-black uppercase">ПЛАН</span>
                        {dateRange?.from && (
                          <span className="text-[10px] text-emerald-100/70 font-medium">
                            {format(dateRange.from, 'LLLL', { locale: ru })}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'visits', 'sales', 'revenue'] as const).map(field => (
                    <td key={field} className="p-1 md:p-2 align-middle">
                      {onPlanChange ? (
                        <EditableCell
                          value={effectivePlanData[field]}
                          onSave={(val) => {
                            const monthKey = dateRange?.from ? format(startOfMonth(dateRange.from), 'yyyy-MM-dd') : undefined;
                            onPlanChange(field, val, monthKey);
                          }}
                          className="text-emerald-500 dark:text-emerald-400 font-bold"
                        />
                      ) : (
                        <span className="block text-right px-3 py-2 font-mono text-emerald-500 dark:text-emerald-400 font-bold text-sm">
                          {field === 'spend' || field === 'revenue' ? formatCurrency(effectivePlanData[field]) : formatNumber(effectivePlanData[field])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Fact Totals Row - Matching reference spacing and bold look */}
              <tr className="bg-card dark:bg-slate-900/40 font-bold border-b border-border/10 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <td className="p-4 md:p-5 sticky left-0 bg-card dark:bg-slate-900/60 backdrop-blur-sm z-30 shadow-[1px_0_0_0_rgba(255,255,255,0.02)] border-b border-border/10 text-xs md:text-sm tracking-widest">ФАКТИТОГО</td>
                <td className="p-4 md:p-5 text-right text-foreground font-mono text-sm border-b border-border/10">{formatCurrency(totals.spend)}</td>
                <td className="p-4 md:p-5 text-right text-foreground font-mono text-sm border-b border-border/10">{formatNumber(totals.impressions)}</td>
                <td className="p-4 md:p-5 text-right text-foreground font-mono text-sm border-b border-border/10">{formatNumber(totals.clicks)}</td>
                <td className="p-4 md:p-5 text-right text-foreground font-mono text-sm border-b border-border/10">{formatNumber(totals.leads)}</td>
                <td className="p-4 md:p-5 text-right text-foreground font-mono text-sm border-b border-border/10">{formatNumber(totals.followers)}</td>
                <td className="p-4 md:p-5 text-right text-foreground font-mono text-sm border-b border-border/10">{formatNumber(totals.visits)}</td>
                <td className="p-4 md:p-5 text-right text-foreground font-mono text-sm border-b border-border/10">{formatNumber(totals.sales)}</td>
                <td className="p-4 md:p-5 text-right text-emerald-500 font-mono border-b border-border/10 text-base md:text-lg">{formatCurrency(totals.revenue)}</td>
              </tr>

              {/* Percentage Execution Row - Premium progress bars */}
              {effectivePlanData && (
                <tr className="bg-card/50 dark:bg-slate-800/20 border-b border-border/5">
                  <td className="p-4 md:p-5 sticky left-0 bg-card/60 dark:bg-slate-800/40 backdrop-blur-sm z-30 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-b border-border/5">% выполн.</td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'visits', 'sales', 'revenue'] as const).map(field => {
                    const fact = totals[field];
                    const plan = effectivePlanData[field];
                    const percent = plan > 0 ? fact / plan * 100 : 0;

                    let colorClass = '';
                    if (field === 'spend') {
                      colorClass = percent <= 100 ? 'text-emerald-500' : percent <= 120 ? 'text-amber-500' : 'text-rose-500'
                    } else {
                      colorClass = percent >= 100 ? 'text-emerald-500' : percent >= 80 ? 'text-amber-500' : 'text-rose-500'
                    }
                    return (
                      <td key={field} className="p-4 md:p-5 border-b border-border/5">
                        <div className={`text-right font-mono font-black text-sm ${colorClass}`}>{percent.toFixed(0)}%</div>
                        <div className="mt-2.5 h-1.5 w-full bg-slate-200 dark:bg-slate-800/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.min(percent, 100)}%`,
                              background: field === 'spend'
                                ? (percent <= 100 ? 'hsl(142, 76%, 45%)' : percent <= 120 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)')
                                : (percent >= 100 ? 'hsl(142, 76%, 45%)' : percent >= 80 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)'),
                              boxShadow: `0 0 10px ${field === 'spend' && percent > 120 ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)'}`,
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
                    className={cn(
                      "group/row transition-colors",
                      isToday ? "bg-primary/[0.04]" : isWeekend ? "bg-muted/[0.08]" : "odd:bg-card/20 even:bg-transparent"
                    )}
                  >
                    <td className={cn(
                      "p-3 md:p-4 sticky left-0 z-20 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.02)] border-b border-border/10",
                      isToday ? "bg-primary/[0.04]" : isWeekend ? "bg-muted/[0.08]" : "bg-card/40"
                    )}>
                      <div className="flex flex-col">
                        <span className={cn(
                          "font-bold text-sm",
                          isToday && "text-primary"
                        )}>
                          {format(day, 'dd')}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase font-medium tracking-tighter">
                          {WEEKDAYS[weekDay]}
                        </span>
                      </div>
                    </td>
                    <td className="p-1 md:p-2 text-right border-b border-border/30">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.spend}
                          onSave={(val) => onDataChange(dateKey, 'spend', val)}
                          className="group-hover/row:bg-muted/20"
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono">{formatCurrency(dayData?.spend || 0)}</span>
                      )}
                    </td>
                    <td className="p-1 md:p-2 text-right border-b border-border/30">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.impressions}
                          onSave={(val) => onDataChange(dateKey, 'impressions', val)}
                          className="group-hover/row:bg-muted/20"
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono">{formatNumber(dayData?.impressions || 0)}</span>
                      )}
                    </td>
                    <td className="p-1 md:p-2 text-right border-b border-border/30">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.clicks}
                          onSave={(val) => onDataChange(dateKey, 'clicks', val)}
                          className="group-hover/row:bg-muted/20"
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono">{formatNumber(dayData?.clicks || 0)}</span>
                      )}
                    </td>
                    <td className="p-1 md:p-2 text-right border-b border-border/30">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.leads}
                          onSave={(val) => onDataChange(dateKey, 'leads', val)}
                          className="group-hover/row:bg-muted/20 font-bold"
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono font-bold">{formatNumber(dayData?.leads || 0)}</span>
                      )}
                    </td>
                    <td className="p-1 md:p-2 text-right border-b border-border/30">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.followers}
                          onSave={(val) => onDataChange(dateKey, 'followers', val)}
                          className="group-hover/row:bg-muted/20"
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono">{formatNumber(dayData?.followers || 0)}</span>
                      )}
                    </td>
                    <td className="p-1 md:p-2 text-right border-b border-border/30">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.visits}
                          onSave={(val) => onDataChange(dateKey, 'visits', val)}
                          className="group-hover/row:bg-muted/20"
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono">{formatNumber(dayData?.visits || 0)}</span>
                      )}
                    </td>
                    <td className="p-1 md:p-2 text-right border-b border-border/30">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.sales}
                          onSave={(val) => onDataChange(dateKey, 'sales', val)}
                          className="group-hover/row:bg-muted/20 font-bold"
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono font-bold">{formatNumber(dayData?.sales || 0)}</span>
                      )}
                    </td>
                    <td className={cn(
                      "p-1 md:p-2 text-right border-b border-border/30",
                      isRevenueAboveAverage ? "text-emerald-500/90" : ""
                    )}>
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.revenue}
                          onSave={(val) => onDataChange(dateKey, 'revenue', val)}
                          className={cn(
                            "group-hover/row:bg-muted/20 font-bold",
                            isRevenueAboveAverage ? "text-emerald-500 font-bold" : ""
                          )}
                        />
                      ) : (
                        <span className="px-3 py-2 font-mono font-bold">{formatCurrency(dayData?.revenue || 0)}</span>
                      )}
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
