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

      <div className="bg-card border rounded-xl">
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
          
          <button onClick={exportToCSV} className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg border border-[#00D1FF] text-[#00D1FF] bg-transparent hover:bg-[#00D1FF]/10 transition-colors text-xs md:text-sm whitespace-nowrap self-end lg:self-auto">
            <Download className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Экспорт CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[75vh] data-table scrollbar-thin -mx-px relative">
          <table className="w-full text-xs md:text-sm border-collapse">
            <thead className="sticky top-0 z-50 bg-[#161B22]/80 backdrop-blur-md">
              <tr className="border-b border-[#1F2937]">
                <th className="text-left p-2 md:p-3 font-semibold text-slate-400 sticky left-0 bg-[#161B22]/80 backdrop-blur-md min-w-[90px] md:min-w-[120px] z-40 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Дата</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[90px] md:min-w-[110px]">Расходы</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[70px] md:min-w-[100px]">Показы</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[60px] md:min-w-[80px]">Клики</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[60px] md:min-w-[80px]">Лиды</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[80px] md:min-w-[100px]">Подписчики</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[80px] md:min-w-[100px]">Диагностика</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[70px] md:min-w-[80px]">Продажи</th>
                <th className="text-right p-2 md:p-3 font-semibold text-slate-400 min-w-[90px] md:min-w-[120px]">Выручка</th>
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
              <tr className="bg-[#161B22]/60 backdrop-blur-sm font-semibold border-b border-[#1F2937]">
                <td className="p-2 md:p-4 sticky left-0 bg-[#161B22]/60 backdrop-blur-sm z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">ФАКТ</td>
                <td className="p-2 md:p-4 text-right text-foreground font-mono">{formatCurrency(totals.spend)}</td>
                <td className="p-2 md:p-4 text-right text-foreground font-mono">{formatNumber(totals.impressions)}</td>
                <td className="p-2 md:p-4 text-right text-foreground font-mono">{formatNumber(totals.clicks)}</td>
                <td className="p-2 md:p-4 text-right text-foreground font-mono">{formatNumber(totals.leads)}</td>
                <td className="p-2 md:p-4 text-right text-foreground font-mono">{formatNumber(totals.followers)}</td>
                <td className="p-2 md:p-4 text-right text-foreground font-mono">{formatNumber(totals.visits)}</td>
                <td className="p-2 md:p-4 text-right text-foreground font-mono">{formatNumber(totals.sales)}</td>
                <td className="p-2 md:p-4 text-right text-emerald-500 font-mono">{formatCurrency(totals.revenue)}</td>
              </tr>

              {/* Percentage Row - third */}
              {effectivePlanData && (
                <tr className="bg-muted/90 backdrop-blur-sm border-b border-border shadow-sm">
                  <td className="p-2 md:p-4 sticky left-0 bg-muted/90 backdrop-blur-sm z-30 text-foreground/80  text-sm md:text-base font-semibold shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">% выполн.</td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'visits', 'sales', 'revenue'] as const).map(field => {
                    const fact = totals[field];
                    const plan = effectivePlanData[field];
                    
                    const percent = plan > 0 ? fact / plan * 100 : 0;
                    // Heatmap colors: >= 100% - bright green, 80-99% - yellow, < 80% - soft red
                    let colorClass = '';
                    if (field === 'spend') {
                      // For spend, <= 100% is good
                      colorClass = percent <= 100 ? 'text-emerald-600' : percent <= 120 ? 'text-yellow-600' : 'text-red-500/80'
                    } else {
                      // For other metrics, >= 100% is good
                      colorClass = percent >= 100 ? 'text-emerald-600' : percent >= 80 ? 'text-yellow-600' : 'text-red-500/80'
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
                    className={cn(
                      "border-b border-border/40 hover:bg-muted/30 transition-colors",
                      isToday && "bg-primary/5",
                      isWeekend && "bg-muted/10"
                    )}
                  >
                    <td className={cn(
                      "p-2 md:p-3 sticky left-0 z-20 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.1)]",
                      isToday ? "bg-primary/5" : isWeekend ? "bg-muted/10" : "bg-card"
                    )}>
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
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatCurrency(dayData?.spend || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.impressions}
                          onSave={(val) => onDataChange(dateKey, 'impressions', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.impressions || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.clicks}
                          onSave={(val) => onDataChange(dateKey, 'clicks', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.clicks || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground font-medium">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.leads}
                          onSave={(val) => onDataChange(dateKey, 'leads', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground font-medium"
                        />
                      ) : formatNumber(dayData?.leads || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.followers}
                          onSave={(val) => onDataChange(dateKey, 'followers', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.followers || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.visits}
                          onSave={(val) => onDataChange(dateKey, 'visits', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground"
                        />
                      ) : formatNumber(dayData?.visits || 0)}
                    </td>
                    <td className="p-2 md:p-3 text-right text-foreground font-medium">
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.sales}
                          onSave={(val) => onDataChange(dateKey, 'sales', val)}
                          className="w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 text-foreground font-medium"
                        />
                      ) : formatNumber(dayData?.sales || 0)}
                    </td>
                    <td className={cn(
                      "p-2 md:p-3 text-right font-semibold",
                      isRevenueAboveAverage ? "text-emerald-600" : "text-foreground"
                    )}>
                      {onDataChange ? (
                        <EditableCell
                          value={dayData?.revenue}
                          onSave={(val) => onDataChange(dateKey, 'revenue', val)}
                          className={cn(
                            "w-full text-right bg-transparent border-none hover:bg-muted/50 focus:bg-background focus:ring-1 focus:ring-primary/20 rounded px-1 font-semibold",
                            isRevenueAboveAverage ? "text-emerald-600" : "text-foreground"
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
