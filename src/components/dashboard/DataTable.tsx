import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download, Target } from 'lucide-react';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks?: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
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
  return value.toFixed(2) + '%';
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface DataTableProps {
  dailyData: Record<string, DailyData>;
  onDataChange: (date: string, field: keyof DailyData, value: number) => void;
  planData?: PlanData;
  onPlanChange?: (field: keyof PlanData, value: number) => void;
}

export const DataTable = ({ dailyData, onDataChange, planData, onPlanChange }: DataTableProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const totals = useMemo(() => {
    const monthDays = daysInMonth.map(d => format(d, 'yyyy-MM-dd'));
    const monthData = monthDays.map(date => dailyData[date]).filter(Boolean);

    return monthData.reduce(
      (acc, day) => ({
        spend: acc.spend + (day.spend || 0),
        impressions: acc.impressions + (day.impressions || 0),
        clicks: acc.clicks + (day.clicks || 0),
        leads: acc.leads + (day.leads || 0),
        diagnostics: acc.diagnostics + (day.diagnostics || 0),
        sales: acc.sales + (day.sales || 0),
        revenue: acc.revenue + (day.revenue || 0),
      }),
      { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 }
    );
  }, [dailyData, daysInMonth]);

  // Calculated metrics
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;

  const handleInputChange = (date: string, field: keyof DailyData, value: string) => {
    const numValue = parseFloat(value) || 0;
    onDataChange(date, field, numValue);
  };

  const getInputValue = (date: string, field: keyof DailyData): string => {
    const value = dailyData[date]?.[field];
    return value ? String(value) : '';
  };

  const getWeekDay = (date: Date): number => {
    const day = getDay(date);
    return day === 0 ? 6 : day - 1;
  };

  const exportToCSV = () => {
    const headers = ['Дата', 'День', 'Расходы', 'Показы', 'Клики', 'CTR%', 'Лиды', 'CPL', 'Диагностики', 'Продажи', 'Выручка'];
    const rows = daysInMonth.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const data = dailyData[dateKey];
      const dayClicks = data?.clicks || 0;
      const dayImpressions = data?.impressions || 0;
      const dayCtr = dayImpressions > 0 ? (dayClicks / dayImpressions) * 100 : 0;
      const dayLeads = data?.leads || 0;
      const daySpend = data?.spend || 0;
      const dayCpl = dayLeads > 0 ? daySpend / dayLeads : 0;
      
      return [
        format(day, 'dd.MM.yyyy'),
        WEEKDAYS[getWeekDay(day)],
        data?.spend || 0,
        data?.impressions || 0,
        dayClicks,
        dayCtr.toFixed(2),
        dayLeads,
        dayCpl.toFixed(0),
        data?.diagnostics || 0,
        data?.sales || 0,
        data?.revenue || 0,
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${format(currentMonth, 'yyyy-MM')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Calculated Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">CPL (Цена лида)</div>
          <div className="text-xl font-bold text-primary">{formatCurrency(cpl)}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">CPC (Цена клика)</div>
          <div className="text-xl font-bold">{formatCurrency(cpc)}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">CTR</div>
          <div className="text-xl font-bold">{formatPercent(ctr)}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">CPM</div>
          <div className="text-xl font-bold">{formatCurrency(cpm)}</div>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold capitalize min-w-[180px] text-center">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </h2>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto data-table scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-secondary/50 min-w-[120px]">Дата</th>
                <th className="text-right p-3 font-medium text-muted-foreground min-w-[110px]">Расходы (₸)</th>
                <th className="text-right p-3 font-medium text-muted-foreground min-w-[100px]">Показы</th>
                <th className="text-right p-3 font-medium text-muted-foreground min-w-[80px]">Клики</th>
                <th className="text-right p-3 font-medium text-muted-foreground min-w-[80px]">Лиды</th>
                <th className="text-right p-3 font-medium text-muted-foreground min-w-[100px]">Диагностики</th>
                <th className="text-right p-3 font-medium text-muted-foreground min-w-[80px]">Продажи</th>
                <th className="text-right p-3 font-medium text-muted-foreground min-w-[120px]">Выручка (₸)</th>
              </tr>
            </thead>
            <tbody>
              {/* Plan Row */}
              {planData && onPlanChange && (
                <tr className="border-b bg-primary/5">
                  <td className="p-3 sticky left-0 bg-primary/5">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-primary">ПЛАН</span>
                    </div>
                  </td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'diagnostics', 'sales', 'revenue'] as const).map((field) => (
                    <td key={field} className="p-2">
                      <input
                        type="number"
                        placeholder="0"
                        value={planData[field] || ''}
                        onChange={(e) => onPlanChange(field, parseFloat(e.target.value) || 0)}
                        className="w-full text-right bg-primary/10 border border-primary/20 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg px-3 py-2 transition-all font-semibold text-primary"
                      />
                    </td>
                  ))}
                </tr>
              )}

              {daysInMonth.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const weekDay = getWeekDay(day);
                const isWeekend = weekDay >= 5;
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <tr 
                    key={dateKey} 
                    className={`border-b hover:bg-secondary/30 transition-colors ${isWeekend ? 'bg-secondary/20' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                  >
                    <td className={`p-3 sticky left-0 ${isWeekend ? 'bg-secondary/20' : 'bg-card'} ${isToday ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          isWeekend ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          {WEEKDAYS[weekDay]}
                        </span>
                        <span className={`font-medium ${isToday ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                        {isToday && <span className="text-xs text-primary">(сегодня)</span>}
                      </div>
                    </td>
                    {(['spend', 'impressions', 'clicks', 'leads', 'diagnostics', 'sales', 'revenue'] as const).map((field) => (
                      <td key={field} className="p-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={getInputValue(dateKey, field)}
                          onChange={(e) => handleInputChange(dateKey, field, e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 rounded-lg px-3 py-2 transition-all"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
              {/* Plan Totals Row */}
              {planData && (
                <tr className="bg-primary/10 font-semibold border-t-2 border-primary/30">
                  <td className="p-4 sticky left-0 bg-primary/10">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-primary">Итого ПЛАН</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-primary">{formatCurrency(planData.spend)}</td>
                  <td className="p-4 text-right text-primary">{formatNumber(planData.impressions)}</td>
                  <td className="p-4 text-right text-primary">{formatNumber(planData.clicks)}</td>
                  <td className="p-4 text-right text-primary">{formatNumber(planData.leads)}</td>
                  <td className="p-4 text-right text-primary">{formatNumber(planData.diagnostics)}</td>
                  <td className="p-4 text-right text-primary">{formatNumber(planData.sales)}</td>
                  <td className="p-4 text-right text-primary">{formatCurrency(planData.revenue)}</td>
                </tr>
              )}

              {/* Fact Totals Row */}
              <tr className="bg-secondary font-semibold">
                <td className="p-4 sticky left-0 bg-secondary">Итого ФАКТ</td>
                <td className="p-4 text-right">{formatCurrency(totals.spend)}</td>
                <td className="p-4 text-right">{formatNumber(totals.impressions)}</td>
                <td className="p-4 text-right">{formatNumber(totals.clicks)}</td>
                <td className="p-4 text-right">{formatNumber(totals.leads)}</td>
                <td className="p-4 text-right">{formatNumber(totals.diagnostics)}</td>
                <td className="p-4 text-right">{formatNumber(totals.sales)}</td>
                <td className="p-4 text-right text-success">{formatCurrency(totals.revenue)}</td>
              </tr>

              {/* Plan vs Fact Comparison */}
              {planData && (
                <tr className="bg-muted/50">
                  <td className="p-4 sticky left-0 bg-muted/50 text-muted-foreground">% выполнения</td>
                  {(['spend', 'impressions', 'clicks', 'leads', 'diagnostics', 'sales', 'revenue'] as const).map((field) => {
                    const fact = totals[field];
                    const plan = planData[field];
                    const percent = plan > 0 ? (fact / plan) * 100 : 0;
                    const isGood = field === 'spend' ? percent <= 100 : percent >= 100;
                    
                    return (
                      <td key={field} className={`p-4 text-right font-medium ${isGood ? 'text-success' : 'text-destructive'}`}>
                        {percent.toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
