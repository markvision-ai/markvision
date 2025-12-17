import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

const MetricCard = ({ 
  label, 
  value, 
  subValue,
  variant = 'default' 
}: { 
  label: string; 
  value: string; 
  subValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const variantStyles = {
    default: 'border-border',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    danger: 'border-destructive/30 bg-destructive/5',
  };

  const valueStyles = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  };

  return (
    <div className={`bg-card border rounded-lg p-4 ${variantStyles[variant]}`}>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${valueStyles[variant]}`}>{value}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </div>
  );
};

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const AnalyticsDashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyData, setDailyData] = useState<Record<string, DailyData>>({});

  // Get days of current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate totals from daily data
  const totals = useMemo(() => {
    const monthDays = daysInMonth.map(d => format(d, 'yyyy-MM-dd'));
    const monthData = monthDays
      .map(date => dailyData[date])
      .filter(Boolean);

    return monthData.reduce(
      (acc, day) => ({
        spend: acc.spend + (day.spend || 0),
        impressions: acc.impressions + (day.impressions || 0),
        leads: acc.leads + (day.leads || 0),
        diagnostics: acc.diagnostics + (day.diagnostics || 0),
        sales: acc.sales + (day.sales || 0),
        revenue: acc.revenue + (day.revenue || 0),
      }),
      { spend: 0, impressions: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 }
    );
  }, [dailyData, daysInMonth]);

  // Computed metrics
  const aov = totals.sales > 0 ? totals.revenue / totals.sales : 0;
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const conversionRate = totals.leads > 0 ? (totals.sales / totals.leads) * 100 : 0;
  const roi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
  const roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

  const handleInputChange = (date: string, field: keyof DailyData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setDailyData(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        date,
        [field]: numValue,
      },
    }));
  };

  const getInputValue = (date: string, field: keyof DailyData): string => {
    const value = dailyData[date]?.[field];
    return value ? String(value) : '';
  };

  // Get day of week (0 = Monday, 6 = Sunday)
  const getWeekDay = (date: Date): number => {
    const day = getDay(date);
    return day === 0 ? 6 : day - 1;
  };

  return (
    <div className="min-h-screen bg-secondary/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Аналитика</h1>
          <p className="text-muted-foreground">Сводные показатели за {format(currentMonth, 'LLLL yyyy', { locale: ru })}</p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard label="Расходы" value={formatCurrency(totals.spend)} />
          <MetricCard label="Показы" value={formatNumber(totals.impressions)} />
          <MetricCard label="Лиды" value={formatNumber(totals.leads)} />
          <MetricCard label="Диагностики" value={formatNumber(totals.diagnostics)} />
          <MetricCard label="Продажи" value={formatNumber(totals.sales)} />
          <MetricCard label="Выручка" value={formatCurrency(totals.revenue)} variant={totals.revenue > 0 ? 'success' : 'default'} />
        </div>

        {/* Computed Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <MetricCard 
            label="Средний чек" 
            value={formatCurrency(aov)} 
            subValue="Выручка / Продажи"
          />
          <MetricCard 
            label="Цена лида (CPL)" 
            value={formatCurrency(cpl)} 
            subValue="Расходы / Лиды"
            variant={cpl > 1000 ? 'danger' : 'default'}
          />
          <MetricCard 
            label="Конверсия" 
            value={`${conversionRate.toFixed(1)}%`} 
            subValue="Лиды → Продажи"
          />
          <MetricCard 
            label="ROI" 
            value={`${roi.toFixed(1)}%`} 
            subValue="Окупаемость"
            variant={roi < 0 ? 'danger' : roi > 100 ? 'success' : 'default'}
          />
          <MetricCard 
            label="ROAS" 
            value={`${roas.toFixed(2)}x`} 
            subValue={`₽1 → ₽${roas.toFixed(2)}`}
            variant={roas < 1 ? 'danger' : roas > 2 ? 'success' : 'default'}
          />
        </div>

        {/* Calendar Table */}
        <div className="bg-card border rounded-lg overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="p-2 hover:bg-secondary rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium capitalize">
              {format(currentMonth, 'LLLL yyyy', { locale: ru })}
            </h2>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="p-2 hover:bg-secondary rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto data-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-secondary/50 min-w-[100px]">Дата</th>
                  <th className="text-right p-3 font-medium text-muted-foreground min-w-[120px]">Расходы</th>
                  <th className="text-right p-3 font-medium text-muted-foreground min-w-[100px]">Показы</th>
                  <th className="text-right p-3 font-medium text-muted-foreground min-w-[80px]">Лиды</th>
                  <th className="text-right p-3 font-medium text-muted-foreground min-w-[100px]">Диагностики</th>
                  <th className="text-right p-3 font-medium text-muted-foreground min-w-[80px]">Продажи</th>
                  <th className="text-right p-3 font-medium text-muted-foreground min-w-[120px]">Выручка</th>
                </tr>
              </thead>
              <tbody>
                {daysInMonth.map((day, index) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const weekDay = getWeekDay(day);
                  const isWeekend = weekDay >= 5;
                  
                  return (
                    <tr 
                      key={dateKey} 
                      className={`border-b hover:bg-secondary/30 transition-colors ${isWeekend ? 'bg-secondary/20' : ''}`}
                    >
                      <td className={`p-3 sticky left-0 ${isWeekend ? 'bg-secondary/20' : 'bg-card'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${isWeekend ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                            {WEEKDAYS[weekDay]}
                          </span>
                          <span className="font-medium">{format(day, 'd')}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={getInputValue(dateKey, 'spend')}
                          onChange={(e) => handleInputChange(dateKey, 'spend', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={getInputValue(dateKey, 'impressions')}
                          onChange={(e) => handleInputChange(dateKey, 'impressions', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={getInputValue(dateKey, 'leads')}
                          onChange={(e) => handleInputChange(dateKey, 'leads', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={getInputValue(dateKey, 'diagnostics')}
                          onChange={(e) => handleInputChange(dateKey, 'diagnostics', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={getInputValue(dateKey, 'sales')}
                          onChange={(e) => handleInputChange(dateKey, 'sales', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={getInputValue(dateKey, 'revenue')}
                          onChange={(e) => handleInputChange(dateKey, 'revenue', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-1"
                        />
                      </td>
                    </tr>
                  );
                })}
                {/* Totals Row */}
                <tr className="bg-secondary font-medium">
                  <td className="p-3 sticky left-0 bg-secondary">Итого</td>
                  <td className="p-3 text-right">{formatCurrency(totals.spend)}</td>
                  <td className="p-3 text-right">{formatNumber(totals.impressions)}</td>
                  <td className="p-3 text-right">{formatNumber(totals.leads)}</td>
                  <td className="p-3 text-right">{formatNumber(totals.diagnostics)}</td>
                  <td className="p-3 text-right">{formatNumber(totals.sales)}</td>
                  <td className="p-3 text-right text-success">{formatCurrency(totals.revenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
