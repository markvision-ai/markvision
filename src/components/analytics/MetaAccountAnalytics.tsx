import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfMonth } from 'date-fns';
import { Loader2, PlugZap, RefreshCcw } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useMetaAccountAnalytics } from '@/hooks/useMetaAccountAnalytics';

interface MetaAccountAnalyticsProps {
  projectId: string;
}

const formatCurrency = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatPercent = (value: number | null, decimals = 1) => {
  if (value === null || Number.isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
};

const formatNumber = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

export const MetaAccountAnalytics = ({ projectId }: MetaAccountAnalyticsProps) => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const { rows, totals, hasAccounts, loading, error, refetch } = useMetaAccountAnalytics(projectId, dateRange);

  const totalAccounts = rows.length;
  const romiTone = (value: number | null) => {
    if (value === null) return 'text-muted-foreground';
    if (value >= 100) {
      return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.55)]';
    }
    return 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]';
  };

  const headerBadges = useMemo(() => [
    { label: `${totalAccounts} кабинетов`, variant: 'outline' as const },
    hasAccounts ? { label: 'Meta подключен', variant: 'default' as const } : { label: 'Нет подключения', variant: 'secondary' as const },
  ], [totalAccounts, hasAccounts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Сквозная аналитика Meta</h2>
          <p className="text-sm text-muted-foreground mt-1">Рекламные кабинеты, лиды и выручка в одном окне</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button variant="outline" size="icon" onClick={refetch} title="Обновить">
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          {!hasAccounts && (
            <Button variant="default" onClick={() => navigate('/settings')}>
              <PlugZap className="w-4 h-4 mr-2" />
              Подключить Meta
            </Button>
          )}
        </div>
      </div>

      <div className="interstellar-glass border border-white/5 rounded-3xl overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 border-b border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 flex items-center justify-center border border-blue-500/20">
              <PlugZap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Рекламные кабинеты Meta</h3>
              <p className="text-sm text-white/50">Данные из Meta Ads + CRM по выбранному проекту</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerBadges.map((badge) => (
              <Badge key={badge.label} variant={badge.variant} className="bg-white/5 border-white/10 text-white/70">
                {badge.label}
              </Badge>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin mr-3" />
            Загружаем аналитику Meta...
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-white/60">
            <p className="text-base font-medium mb-2">Нет данных по кабинетам</p>
            <p className="text-sm text-white/40 mb-6">Подключите Meta Ads в настройках проекта или синхронизируйте данные.</p>
            <Button variant="secondary" onClick={() => navigate('/settings')}>
              Перейти в настройки
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-white/60">Кабинет</TableHead>
                  <TableHead className="text-right text-white/60">Расходы</TableHead>
                  <TableHead className="text-right text-white/60">Лиды</TableHead>
                  <TableHead className="text-right text-white/60">CPL</TableHead>
                  <TableHead className="text-right text-white/60">LQR</TableHead>
                  <TableHead className="text-right text-white/60">CPQL</TableHead>
                  <TableHead className="text-right text-white/60">Визиты</TableHead>
                  <TableHead className="text-right text-white/60">CPV</TableHead>
                  <TableHead className="text-right text-white/60">CAC</TableHead>
                  <TableHead className="text-right text-white/60">Выручка</TableHead>
                  <TableHead className="text-right text-white/60">ROMI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.accountId} className="border-white/5 hover:bg-white/5">
                    <TableCell className="font-medium text-white">
                      <div className="flex flex-col">
                        <span>{row.accountName}</span>
                        <span className="text-xs text-white/40">{row.accountId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-white/80">{formatCurrency(row.spend)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatNumber(row.leads)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatCurrency(row.leads ? row.spend / row.leads : null)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatPercent(row.lqr)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatCurrency(row.cpql)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatNumber(row.visits)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatCurrency(row.cpv)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatCurrency(row.cac)}</TableCell>
                    <TableCell className="text-right text-white/80">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className={cn("text-right font-semibold", romiTone(row.romi))}>
                      {formatPercent(row.romi)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="border-white/5 bg-white/5">
                  <TableCell className="text-white font-semibold">Итого</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatCurrency(totals.spend)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatNumber(totals.leads)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatCurrency(totals.leads ? totals.spend / totals.leads : null)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatPercent(totals.lqr)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatCurrency(totals.cpql)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatNumber(totals.visits)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatCurrency(totals.cpv)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatCurrency(totals.cac)}</TableCell>
                  <TableCell className="text-right text-white font-semibold">{formatCurrency(totals.revenue)}</TableCell>
                  <TableCell className={cn("text-right font-semibold", romiTone(totals.romi))}>
                    {formatPercent(totals.romi)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}

        {error && (
          <div className="px-6 py-4 border-t border-white/10 text-rose-300 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
