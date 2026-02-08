import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  subMonths, addMonths
} from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Download, Target, Loader2,
  ShoppingCart, Users, TrendingUp,
  ChevronLeft, ChevronRight,
  TrendingDown
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
  className,
  isCurrency = false
}: {
  value: number | undefined;
  onSave: (value: number) => void;
  className?: string;
  isCurrency?: boolean;
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
          "w-full text-right bg-transparent border-transparent focus:border-primary/50 placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 rounded-md px-1 py-1 transition-all font-mono font-medium hover:bg-white/5 hover:border-white/10 text-sm",
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

  const effectivePlanData = useMemo(() => {
    if (!dateRange?.from) return planData;

    if (plansMap) {
      const monthKey = format(startOfMonth(dateRange.from), 'yyyy-MM-dd');
      return plansMap[monthKey] || null;
    }

    return planData;
  }, [plansMap, dateRange, planData]);

  const customerCost = totals.sales > 0 ? Math.round(totals.spend / totals.sales) : null;
  const visitCost = totals.visits > 0 ? Math.round(totals.spend / totals.visits) : null;
  const leadCost = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : null;
  const impressionToLeadConv = totals.impressions > 0 ? (totals.leads / totals.impressions) * 100 : null;
  const leadToVisitConv = totals.leads > 0 ? (totals.visits / totals.leads) * 100 : null;
  const visitToSaleConv = totals.visits > 0 ? (totals.sales / totals.visits) * 100 : null;

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
    <div className="space-y-6">
      {/* Calculated Metrics Grid - Premium Style */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6 mb-6">
        <SummaryCard
          title="Стоимость клиента"
          icon={ShoppingCart}
          value={customerCost !== null ? formatCurrency(customerCost) : '—'}
          subtitle="Расходы / продажи"
          variant="blue"
        />
        <SummaryCard
          title="Стоимость визита"
          icon={Target}
          value={visitCost !== null ? formatCurrency(visitCost) : '—'}
          subtitle="Расходы / визиты"
          variant="cyan"
        />
        <SummaryCard
          title="Стоимость лида"
          icon={Users}
          value={leadCost !== null ? formatCurrency(leadCost) : '—'}
          subtitle="Расходы / лиды"
          variant="emerald"
        />
        <SummaryCard
          title="CR (Показы→Лид)"
          icon={TrendingUp}
          value={formatCR(impressionToLeadConv)}
          subtitle="Лиды / показы"
          variant="purple"
        />
        <SummaryCard
          title="CR (Лид→Диагност)"
          icon={Target}
          value={formatCR(leadToVisitConv)}
          subtitle="Диагностика / лиды"
          variant="orange"
        />
        <SummaryCard
          title="CR (Диагн→Продажа)"
          icon={ShoppingCart}
          value={formatCR(visitToSaleConv)}
          subtitle="Продажи / диагностика"
          variant="pink"
        />
      </div>

      <div className="interstellar-card relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl">
        {/* Glow behind header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

        {/* Header toolbar */}
        <div className="relative p-4 md:p-5 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 z-10 bg-white/[0.02]">
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 hover:bg-white/10 hover:text-white rounded-lg transition-colors border border-transparent hover:border-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-sm font-semibold capitalize min-w-[140px] text-center text-white/90">
              {dateRange?.from ? format(dateRange.from, 'LLLL yyyy', { locale: ru }) : ''}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 hover:bg-white/10 hover:text-white rounded-lg transition-colors border border-transparent hover:border-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="gap-2 bg-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30 transition-all rounded-lg h-9"
          >
            <Download className="w-4 h-4" />
            Экспорт CSV
          </Button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="p-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground/60 sticky left-0 bg-[#0B0C15] z-20 min-w-[100px] border-b border-white/5 backdrop-blur-md">
                  Дата
                </th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[120px] border-b border-white/5">Расходы</th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[100px] border-b border-white/5">Показы</th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[80px] border-b border-white/5">Клики</th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[80px] border-b border-white/5">Лиды</th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[100px] border-b border-white/5">Подписчики</th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[100px] border-b border-white/5">Диагн.</th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[90px] border-b border-white/5">Продажи</th>
                <th className="p-4 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground/60 min-w-[130px] border-b border-white/5">Выручка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">

              {/* PLAN ROW - Special Highlighting */}
              {effectivePlanData && (
                <tr className="group relative bg-[#0B0C15]/50 hover:bg-[#0B0C15]/80 transition-colors">
                  <td className="p-4 sticky left-0 z-20 bg-[#0B0C15]/90 border-r border-emerald-500/10 backdrop-blur-md">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="font-bold text-emerald-400 tracking-wider text-[10px] uppercase">ПЛАН</span>
                    </div>
                  </td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'visits', 'sales', 'revenue'] as const).map(field => (
                    <td key={field} className="p-2 text-right">
                      {onPlanChange ? (
                        <div className="relative">
                          <EditableCell
                            value={effectivePlanData[field]}
                            onSave={(val) => {
                              const monthKey = dateRange?.from ? format(startOfMonth(dateRange.from), 'yyyy-MM-dd') : undefined;
                              onPlanChange(field, val, monthKey);
                            }}
                            className="text-emerald-400 font-bold bg-emerald-500/5 focus:bg-emerald-500/10 border border-transparent focus:border-emerald-500/30 rounded-lg py-1.5 px-3 shadow-none focus:shadow-[0_0_10px_rgba(16,185,129,0.1)] transition-all"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-400 px-3 tabular-nums">
                          {field === 'spend' || field === 'revenue'
                            ? formatCurrency(effectivePlanData[field])
                            : formatNumber(effectivePlanData[field])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* FACT TOTALS ROW */}
              <tr className="bg-white/[0.02] border-b-2 border-white/5">
                <td className="p-4 sticky left-0 bg-[#0B0C15] z-20 border-r border-white/5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold shadow-[4px_0_24px_rgba(0,0,0,0.5)]">Факт Итого</td>
                <td className="p-4 text-right font-mono text-white font-bold tabular-nums">{formatCurrency(totals.spend)}</td>
                <td className="p-4 text-right font-mono text-white/90 font-semibold tabular-nums">{formatNumber(totals.impressions)}</td>
                <td className="p-4 text-right font-mono text-white/90 font-semibold tabular-nums">{formatNumber(totals.clicks)}</td>
                <td className="p-4 text-right font-mono text-white/90 font-semibold tabular-nums">{formatNumber(totals.leads)}</td>
                <td className="p-4 text-right font-mono text-white/90 font-semibold tabular-nums">{formatNumber(totals.followers)}</td>
                <td className="p-4 text-right font-mono text-white/90 font-semibold tabular-nums">{formatNumber(totals.visits)}</td>
                <td className="p-4 text-right font-mono text-white/90 font-semibold tabular-nums">{formatNumber(totals.sales)}</td>
                <td className="p-4 text-right font-mono text-emerald-400 font-bold text-base shadow-[0_0_15px_rgba(16,185,129,0.1)] tabular-nums">{formatCurrency(totals.revenue)}</td>
              </tr>

              {/* EXECUTION % ROW */}
              {effectivePlanData && (
                <tr className="bg-white/[0.01] border-b border-white/5">
                  <td className="p-4 sticky left-0 bg-[#0B0C15] z-20 border-r border-white/5 text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">% Вып.</td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'visits', 'sales', 'revenue'] as const).map(field => {
                    const fact = totals[field];
                    const plan = effectivePlanData[field];
                    const percent = plan > 0 ? (fact / plan) * 100 : 0;

                    let colorClass = 'text-muted-foreground';
                    let barColor = 'bg-white/20';

                    if (field === 'spend') {
                      if (percent <= 100) { colorClass = 'text-emerald-400'; barColor = 'bg-emerald-500'; }
                      else if (percent <= 120) { colorClass = 'text-amber-400'; barColor = 'bg-amber-500'; }
                      else { colorClass = 'text-red-400'; barColor = 'bg-red-500'; }
                    } else {
                      if (percent >= 100) { colorClass = 'text-emerald-400'; barColor = 'bg-emerald-500'; }
                      else if (percent >= 80) { colorClass = 'text-amber-400'; barColor = 'bg-amber-500'; }
                      else { colorClass = 'text-red-400'; barColor = 'bg-red-500'; }
                    }

                    return (
                      <td key={field} className="p-4 pt-3 pb-5 align-top border-b border-white/5">
                        <div className="flex flex-col gap-1.5 justify-end h-full">
                          <div className={cn("text-right text-[11px] font-bold tabular-nums", colorClass)}>
                            {percent.toFixed(0)}%
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.2)]", barColor)}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* DAILY DATA ROWS */}
              {daysInRange.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const weekDay = getWeekDay(day);
                const isWeekend = weekDay >= 5;
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const dayData = dailyData[dateKey];
                const dayRevenue = dayData?.revenue || 0;
                const isHighRevenue = dayRevenue > averageRevenue * 1.5;

                return (
                  <tr
                    key={dateKey}
                    className={cn(
                      "group transition-all hover:bg-white/[0.04]",
                      isToday
                        ? "bg-blue-500/5 relative z-10"
                        : isWeekend
                          ? "bg-white/[0.01] hover:bg-white/[0.03]"
                          : "bg-transparent"
                    )}
                  >
                    <td className={cn(
                      "p-3 md:p-3 sticky left-0 z-10 border-r border-white/5 backdrop-blur-sm transition-colors",
                      isToday ? "bg-blue-950/40 border-l-2 border-l-blue-500" : "bg-[#0B0C15] group-hover:bg-[#121420]"
                    )}>
                      <div className="flex flex-col">
                        <span className={cn("font-bold text-sm font-mono tracking-tight", isToday ? "text-blue-400" : "text-white/80")}>
                          {format(day, 'dd', { locale: ru })}
                        </span>
                        <span className="text-[9px] uppercase text-muted-foreground/60">
                          {WEEKDAYS[weekDay]}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.spend}
                          onSave={(val) => onDataChange(dateKey, 'spend', val)}
                        />
                      ) : (
                        <span className="text-white/60 font-mono text-xs tabular-nums">{formatCurrency(dayData?.spend || 0)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.impressions}
                          onSave={(val) => onDataChange(dateKey, 'impressions', val)}
                        />
                      ) : (
                        <span className="text-white/60 font-mono text-xs tabular-nums">{formatNumber(dayData?.impressions || 0)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.clicks}
                          onSave={(val) => onDataChange(dateKey, 'clicks', val)}
                        />
                      ) : (
                        <span className="text-white/60 font-mono text-xs tabular-nums">{formatNumber(dayData?.clicks || 0)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.leads}
                          onSave={(val) => onDataChange(dateKey, 'leads', val)}
                          className="text-white/90 font-bold"
                        />
                      ) : (
                        <span className="text-white/90 font-mono text-xs font-bold tabular-nums">{formatNumber(dayData?.leads || 0)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.followers}
                          onSave={(val) => onDataChange(dateKey, 'followers', val)}
                        />
                      ) : (
                        <span className="text-white/60 font-mono text-xs tabular-nums">{formatNumber(dayData?.followers || 0)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.visits}
                          onSave={(val) => onDataChange(dateKey, 'visits', val)}
                        />
                      ) : (
                        <span className="text-white/60 font-mono text-xs tabular-nums">{formatNumber(dayData?.visits || 0)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.sales}
                          onSave={(val) => onDataChange(dateKey, 'sales', val)}
                          className="text-white/90 font-bold"
                        />
                      ) : (
                        <span className="text-white/90 font-mono text-xs font-bold tabular-nums">{formatNumber(dayData?.sales || 0)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.revenue}
                          onSave={(val) => onDataChange(dateKey, 'revenue', val)}
                          className={cn(
                            "font-bold",
                            isHighRevenue ? "text-emerald-400" : "text-white"
                          )}
                        />
                      ) : (
                        <span className={cn("font-mono text-xs font-bold tabular-nums", isHighRevenue ? "text-emerald-400" : "text-white")}>{formatCurrency(dayData?.revenue || 0)}</span>
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
