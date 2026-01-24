import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download, Target, Loader2 } from 'lucide-react';

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

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getWeekDay = (date: Date): number => {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
};

interface DataTableProps {
  dailyData: Record<string, DailyData>;
  onDataChange: (date: string, field: keyof DailyData, value: number) => void;
  planData?: PlanData;
  onPlanChange?: (field: keyof PlanData, value: number) => void;
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

export const DataTable = ({
  dailyData,
  onDataChange,
  planData,
  onPlanChange
}: DataTableProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  const totals = useMemo(() => {
    const monthDays = daysInMonth.map(d => format(d, 'yyyy-MM-dd'));
    const monthData = monthDays.map(date => dailyData[date]).filter(Boolean);
    return monthData.reduce((acc, day) => ({
      spend: acc.spend + (day.spend || 0),
      impressions: acc.impressions + (day.impressions || 0),
      clicks: acc.clicks + (day.clicks || 0),
      leads: acc.leads + (day.leads || 0),
      followers: acc.followers + (day.followers || 0),
      diagnostics: acc.diagnostics + (day.diagnostics || 0),
      sales: acc.sales + (day.sales || 0),
      revenue: acc.revenue + (day.revenue || 0)
    }), {
      spend: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      followers: 0,
      diagnostics: 0,
      sales: 0,
      revenue: 0
    });
  }, [dailyData, daysInMonth]);

  // Calculated metrics (БЕЗ КОПЕЕК!)
  const cpl = totals.leads > 0 ? Math.round(totals.spend / totals.leads) : 0;
  const cpc = totals.clicks > 0 ? Math.round(totals.spend / totals.clicks) : 0;
  const ctr = totals.impressions > 0 ? Math.round(totals.clicks / totals.impressions * 100) : 0; // Округлено до целого
  const cpm = totals.impressions > 0 ? Math.round(totals.spend / totals.impressions * 1000) : 0;

  const exportToCSV = () => {
    const headers = ['Дата', 'День', 'Расходы', 'Показы', 'Клики', 'CTR%', 'Лиды', 'Подписчики', 'CPL', 'Диагностики', 'Продажи', 'Выручка'];
    const rows = daysInMonth.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const data = dailyData[dateKey];
      const dayClicks = data?.clicks || 0;
      const dayImpressions = data?.impressions || 0;
      const dayCtr = dayImpressions > 0 ? Math.round(dayClicks / dayImpressions * 100) : 0;
      const dayLeads = data?.leads || 0;
      const dayFollowers = data?.followers || 0;
      const daySpend = data?.spend || 0;
      const dayCpl = dayLeads > 0 ? Math.round(daySpend / dayLeads) : 0;
      return [format(day, 'dd.MM.yyyy'), WEEKDAYS[getWeekDay(day)], data?.spend || 0, data?.impressions || 0, dayClicks, dayCtr, dayLeads, dayFollowers, dayCpl, data?.diagnostics || 0, data?.sales || 0, data?.revenue || 0].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${format(currentMonth, 'yyyy-MM')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Calculated Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-card border rounded-xl p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">CPL (Цена лида)</div>
          <div className="text-base md:text-xl font-bold text-primary">{formatCurrency(cpl)}</div>
        </div>
        <div className="bg-card border rounded-xl p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">CPC (Цена клика)</div>
          <div className="text-base md:text-xl font-bold">{formatCurrency(cpc)}</div>
        </div>
        <div className="bg-card border rounded-xl p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">CTR</div>
          <div className="text-base md:text-xl font-bold">{formatPercent(ctr)}</div>
        </div>
        <div className="bg-card border rounded-xl p-3 md:p-4">
          <div className="text-xs md:text-sm text-muted-foreground">CPM</div>
          <div className="text-base md:text-xl font-bold">{formatCurrency(cpm)}</div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b gap-2">
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <h2 className="text-sm md:text-lg font-semibold capitalize min-w-[120px] md:min-w-[180px] text-center">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </h2>
            <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          
          <button onClick={exportToCSV} className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs md:text-sm">
            <Download className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Экспорт CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto data-table scrollbar-thin -mx-px">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-2 md:p-3 font-medium text-muted-foreground sticky left-0 bg-secondary/50 min-w-[90px] md:min-w-[120px]">Дата</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[90px] md:min-w-[110px]">Расходы</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[70px] md:min-w-[100px]">Показы</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[60px] md:min-w-[80px]">Клики</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[60px] md:min-w-[80px]">Лиды</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[80px] md:min-w-[100px]">Подписчики</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[80px] md:min-w-[100px]">Диагностики</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[70px] md:min-w-[80px]">Продажи</th>
                <th className="text-right p-2 md:p-3 font-medium text-muted-foreground min-w-[90px] md:min-w-[120px]">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {/* Plan Row - editable at top */}
              {planData && (
                <tr className="bg-primary/10 font-semibold border-b-2 border-primary/20">
                  <td className="p-2 md:p-4 sticky left-0 bg-primary/10 flex items-center gap-1 md:gap-2">
                    <Target className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                    <span>ПЛАН</span>
                  </td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'diagnostics', 'sales', 'revenue'] as const).map(field => (
                    <td key={field} className="p-1 md:p-2">
                      {onPlanChange ? (
                        <EditableCell
                          value={planData[field]}
                          onSave={(val) => onPlanChange(field, val)}
                          className="w-full text-right bg-primary/5 border border-primary/20 hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2 transition-all text-xs md:text-sm font-semibold"
                        />
                      ) : (
                        <span className="block text-right px-1.5 md:px-3 py-1.5 md:py-2">
                          {field === 'spend' || field === 'revenue' ? formatCurrency(planData[field]) : formatNumber(planData[field])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              )}

              {/* Fact Totals Row - second */}
              <tr className="bg-secondary font-semibold">
                <td className="p-2 md:p-4 sticky left-0 bg-secondary">ФАКТ</td>
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
              {planData && (
                <tr className="bg-muted/50 border-b-2 border-border">
                  <td className="p-2 md:p-4 sticky left-0 bg-muted/50 text-muted-foreground text-xs md:text-sm">% выполн.</td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'diagnostics', 'sales', 'revenue'] as const).map(field => {
                    const fact = totals[field];
                    const plan = planData[field];
                    const percent = plan > 0 ? fact / plan * 100 : 0;
                    const isGood = field === 'spend' ? percent <= 100 : percent >= 100;
                    return (
                      <td key={field} className={`p-2 md:p-4 text-right font-medium ${isGood ? 'text-success' : 'text-destructive'}`}>
                        {percent.toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              )}

              {/* Daily data rows */}
              {daysInMonth.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const weekDay = getWeekDay(day);
                const isWeekend = weekDay >= 5;
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const dayData = dailyData[dateKey];
                
                return (
                  <tr key={dateKey} className={`border-b hover:bg-secondary/30 transition-colors ${isWeekend ? 'bg-secondary/20' : ''} ${isToday ? 'bg-primary/5' : ''}`}>
                    <td className={`p-2 md:p-3 sticky left-0 ${isWeekend ? 'bg-secondary/20' : 'bg-card'} ${isToday ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-1 md:gap-2">
                        <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded font-medium ${isWeekend ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                          {WEEKDAYS[weekDay]}
                        </span>
                        <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                        {isToday && <span className="text-[10px] md:text-xs text-primary hidden sm:inline">(сегодня)</span>}
                      </div>
                    </td>
                    {(['spend', 'impressions', 'clicks', 'leads', 'followers', 'diagnostics', 'sales', 'revenue'] as const).map(field => (
                      <td key={field} className="p-1 md:p-2">
                        <EditableCell
                          value={dayData?.[field] as number | undefined}
                          onSave={(val) => onDataChange(dateKey, field, val)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg px-1.5 md:px-3 py-1.5 md:py-2 transition-all text-xs md:text-sm"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
