import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startOfMonth, endOfMonth, startOfDay, endOfDay,
  startOfYesterday, endOfYesterday, subDays
} from 'date-fns';
import {
  Loader2, PlugZap, RefreshCcw, HelpCircle,
  TrendingUp, DollarSign, Users, Wallet, BarChart3
} from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader,
  TableRow, TableFooter
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMetaAccountAnalytics } from '@/hooks/useMetaAccountAnalytics';

interface MetaAccountAnalyticsProps {
  projectId: string;
}

const formatCurrency = (value: number | null) => {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatPercent = (value: number | null, decimals = 1) => {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
};

const formatNumber = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

type DatePreset = 'today' | 'yesterday' | '7days' | 'month';

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: 'yesterday', label: 'Вчера' },
  { key: '7days', label: '7 дней' },
  { key: 'month', label: 'Месяц' },
];

const getPresetRange = (preset: DatePreset) => {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday':
      return { from: startOfYesterday(), to: endOfYesterday() };
    case '7days':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
};

const COLUMN_HINTS: Record<string, string> = {
  CPL: 'Cost Per Lead — расход ÷ кол-во лидов',
  LQR: 'Lead Quality Rate — доля квалифицированных лидов (%)',
  CPQL: 'Cost Per Qualified Lead — расход ÷ квалифицированные лиды',
  CPV: 'Cost Per Visit — расход ÷ визиты (дошедшие до кресла)',
  CAC: 'Customer Acquisition Cost — расход ÷ оплатившие пациенты',
  ROMI: 'Return on Marketing Investment = (Выручка − Расходы) ÷ Расходы × 100%',
};

const ColHead = ({
  label, hint, align = 'right'
}: { label: string; hint?: string; align?: 'left' | 'right' }) => (
  <TableHead className={cn('text-slate-600 whitespace-nowrap', align === 'right' && 'text-right')}>
    <div className={cn('flex items-center gap-1', align === 'right' && 'justify-end')}>
      <span>{label}</span>
      {hint && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3 h-3 text-white/30 cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs text-center">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  </TableHead>
);

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  glow?: 'green' | 'red' | 'default';
}

const KpiCard = ({ label, value, icon, glow }: KpiCardProps) => {
  const glowClass =
    glow === 'green'
      ? 'border-blue-500/30 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
      : glow === 'red'
        ? 'border-rose-500/30 shadow-[0_0_18px_rgba(244,63,94,0.15)]'
        : 'border-white/5';

  const textClass =
    glow === 'green'
      ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.55)]'
      : glow === 'red'
        ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
        : 'text-white';

  return (
    <div className={cn(
      'bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl rounded-2xl p-4 border transition-all duration-300',
      glowClass
    )}>
      <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
        <span className="text-slate-500">{icon}</span>
        {label}
      </div>
      <div className={cn('text-xl font-bold tracking-tight', textClass)}>{value}</div>
    </div>
  );
};

export const MetaAccountAnalytics = ({ projectId }: MetaAccountAnalyticsProps) => {
  const navigate = useNavigate();

  const [activePreset, setActivePreset] = useState<DatePreset>('month');
  const [dateRange, setDateRange] = useState(getPresetRange('month'));

  const handlePreset = (preset: DatePreset) => {
    setActivePreset(preset);
    setDateRange(getPresetRange(preset));
  };

  const handleCustomDate = (range: { from: Date; to: Date }) => {
    setActivePreset(null as any);
    setDateRange(range);
  };

  const { rows, totals, hasAccounts, loading, error, refetch } =
    useMetaAccountAnalytics(projectId, dateRange);

  const totalAccounts = rows.length;

  const romiTone = (value: number | null): 'green' | 'red' | 'default' => {
    if (value === null) return 'default';
    return value >= 100 ? 'green' : 'red';
  };

  const romiClass = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    if (value >= 100)
      return 'text-blue-400 font-bold drop-shadow-[0_0_8px_rgba(16,185,129,0.55)]';
    return 'text-rose-400 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]';
  };

  const kpiCards = useMemo(() => [
    {
      label: 'Расходы',
      value: formatCurrency(totals.spend),
      icon: <DollarSign className="w-3.5 h-3.5" />,
      glow: 'default' as const,
    },
    {
      label: 'Лиды',
      value: formatNumber(totals.leads),
      icon: <Users className="w-3.5 h-3.5" />,
      glow: 'default' as const,
    },
    {
      label: 'Выручка',
      value: formatCurrency(totals.revenue),
      icon: <Wallet className="w-3.5 h-3.5" />,
      glow: 'default' as const,
    },
    {
      label: 'ROMI',
      value: formatPercent(totals.romi),
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      glow: romiTone(totals.romi),
    },
  ], [totals]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Сквозная аналитика Meta
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Рекламные кабинеты, лиды и выручка в одном окне
          </p>
        </div>

        {/* Date controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick presets */}
          <div className="flex items-center bg-white/5 border border-white/8 rounded-xl p-1 gap-0.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePreset(p.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
                  activePreset === p.key
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-slate-600 hover:text-white hover:bg-white/8'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <DateRangePicker dateRange={dateRange} onDateRangeChange={handleCustomDate} />

          <Button
            variant="outline"
            size="icon"
            onClick={refetch}
            title="Обновить"
            className="border-slate-200 hover:bg-white/5"
          >
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          {!hasAccounts && (
            <Button variant="default" onClick={() => navigate('/integrations')}>
              <PlugZap className="w-4 h-4 mr-2" />
              Подключить Meta
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-xl border border-white/5 rounded-3xl overflow-hidden">
        {/* Table Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 border-b border-white/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 flex items-center justify-center border border-blue-500/20 shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Рекламные кабинеты Meta</h3>
              <p className="text-xs text-white/50">
                Данные из Meta Ads + CRM по выбранному проекту
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-white/5 border-slate-200 text-slate-600 text-xs">
              {totalAccounts} кабинет{totalAccounts === 1 ? '' : totalAccounts < 5 ? 'а' : 'ов'}
            </Badge>
            <Badge
              variant={hasAccounts ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                hasAccounts
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-white/5 border-slate-200 text-white/50'
              )}
            >
              {hasAccounts ? '● Meta подключён' : '● Нет подключения'}
            </Badge>
          </div>
        </div>

        {/* States */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-600 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Загружаем аналитику Meta…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <PlugZap className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-base font-semibold text-white mb-2">Нет данных по кабинетам</p>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Подключите Meta Ads в настройках интеграций, чтобы начать получать данные о расходах и метриках.
            </p>
            <Button variant="default" onClick={() => navigate('/integrations')}>
              <PlugZap className="w-4 h-4 mr-2" />
              Подключить Meta
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1280px]">
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <ColHead label="Кабинет" align="left" />
                  <ColHead label="Расходы" />
                  <ColHead label="Лиды" />
                  <ColHead label="CPL" hint={COLUMN_HINTS.CPL} />
                  <ColHead label="LQR" hint={COLUMN_HINTS.LQR} />
                  <ColHead label="CPQL" hint={COLUMN_HINTS.CPQL} />
                  <ColHead label="Визиты" />
                  <ColHead label="CPV" hint={COLUMN_HINTS.CPV} />
                  <ColHead label="CAC" hint={COLUMN_HINTS.CAC} />
                  <ColHead label="Выручка" />
                  <ColHead label="ROMI" hint={COLUMN_HINTS.ROMI} />
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.accountId}
                    className="border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Account name + ID */}
                    <TableCell className="font-medium text-white min-w-[180px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate max-w-[200px]">{row.accountName}</span>
                        <span className="text-[10px] text-white/30 font-mono leading-none">
                          {row.accountId}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatCurrency(row.spend)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatNumber(row.leads)}
                    </TableCell>
                    {/* CPL — computed in row */}
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatCurrency(row.cpl ?? (row.leads > 0 ? row.spend / row.leads : null))}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatPercent(row.lqr)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatCurrency(row.cpql)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatNumber(row.visits)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatCurrency(row.cpv)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatCurrency(row.cac)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-mono text-sm">
                      {formatCurrency(row.revenue)}
                    </TableCell>
                    <TableCell className={cn('text-right font-mono text-sm', romiClass(row.romi))}>
                      {formatPercent(row.romi)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              {/* Totals Footer */}
              <TableFooter>
                <TableRow className="border-white/5 bg-white/[0.04] hover:bg-white/[0.06]">
                  <TableCell className="text-white font-semibold">Итого</TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatCurrency(totals.spend)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatNumber(totals.leads)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatCurrency(totals.leads ? totals.spend / totals.leads : null)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatPercent(totals.lqr)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatCurrency(totals.cpql)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatNumber(totals.visits)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatCurrency(totals.cpv)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatCurrency(totals.cac)}
                  </TableCell>
                  <TableCell className="text-right text-white font-semibold font-mono">
                    {formatCurrency(totals.revenue)}
                  </TableCell>
                  <TableCell
                    className={cn('text-right font-semibold font-mono', romiClass(totals.romi))}
                  >
                    {formatPercent(totals.romi)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}

        {error && (
          <div className="px-6 py-3 border-t border-slate-200 text-rose-300 text-sm flex items-center gap-2">
            <span className="text-rose-400">⚠</span> {error}
          </div>
        )}
      </div>
    </div>
  );
};
