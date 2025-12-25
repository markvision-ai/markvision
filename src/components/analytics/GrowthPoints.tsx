import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Users,
  Percent,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface GrowthPointsProps {
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    diagnostics: number;
    sales: number;
    revenue: number;
  };
  planData: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    diagnostics: number;
    sales: number;
    revenue: number;
  };
}

const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + 'M ₸';
  if (rounded >= 1000) return Math.round(rounded / 1000) + 'K ₸';
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

export const GrowthPoints = ({ totals, planData }: GrowthPointsProps) => {
  // Calculate metrics
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const leadConv = totals.clicks > 0 ? (totals.leads / totals.clicks) * 100 : 0;
  const diagConv = totals.leads > 0 ? (totals.diagnostics / totals.leads) * 100 : 0;
  const saleConv = totals.diagnostics > 0 ? (totals.sales / totals.diagnostics) * 100 : 0;
  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const cac = totals.sales > 0 ? totals.spend / totals.sales : 0;
  const romi = totals.spend > 0 ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
  const aov = totals.sales > 0 ? totals.revenue / totals.sales : 0;

  // Benchmark values (industry averages)
  const benchmarks = {
    ctr: 2.5,
    leadConv: 3.0,
    diagConv: 40,
    saleConv: 25,
    cpl: 3000,
    romi: 100,
  };

  // Generate growth opportunities
  const opportunities = [
    {
      id: 'ctr',
      title: 'Повысить CTR объявлений',
      current: ctr,
      benchmark: benchmarks.ctr,
      unit: '%',
      status: ctr >= benchmarks.ctr ? 'good' : ctr >= benchmarks.ctr * 0.7 ? 'warning' : 'critical',
      impact: 'high',
      description: 'Улучшите креативы и таргетинг для повышения кликабельности',
      actions: ['Тестировать новые креативы', 'Уточнить аудиторию', 'Добавить призыв к действию'],
      potentialGain: Math.round(totals.leads * ((benchmarks.ctr - ctr) / ctr) * 0.5),
    },
    {
      id: 'lead_conv',
      title: 'Улучшить конверсию в лиды',
      current: leadConv,
      benchmark: benchmarks.leadConv,
      unit: '%',
      status: leadConv >= benchmarks.leadConv ? 'good' : leadConv >= benchmarks.leadConv * 0.7 ? 'warning' : 'critical',
      impact: 'high',
      description: 'Оптимизируйте лендинг для увеличения конверсии посетителей в лиды',
      actions: ['Упростить форму заявки', 'Добавить социальные доказательства', 'Ускорить загрузку'],
      potentialGain: Math.round(totals.leads * ((benchmarks.leadConv - leadConv) / leadConv) * 0.3),
    },
    {
      id: 'diag_conv',
      title: 'Повысить явку на диагностику',
      current: diagConv,
      benchmark: benchmarks.diagConv,
      unit: '%',
      status: diagConv >= benchmarks.diagConv ? 'good' : diagConv >= benchmarks.diagConv * 0.7 ? 'warning' : 'critical',
      impact: 'medium',
      description: 'Увеличьте долю лидов, которые приходят на диагностику',
      actions: ['Внедрить напоминания', 'Улучшить скрипты звонков', 'Предложить бонус за визит'],
      potentialGain: Math.round((benchmarks.diagConv - diagConv) / 100 * totals.leads * 0.2 * aov),
    },
    {
      id: 'sale_conv',
      title: 'Увеличить конверсию в продажу',
      current: saleConv,
      benchmark: benchmarks.saleConv,
      unit: '%',
      status: saleConv >= benchmarks.saleConv ? 'good' : saleConv >= benchmarks.saleConv * 0.7 ? 'warning' : 'critical',
      impact: 'high',
      description: 'Повысьте эффективность работы с клиентами на этапе продажи',
      actions: ['Обучить менеджеров', 'Улучшить презентацию услуг', 'Внедрить CRM-систему'],
      potentialGain: Math.round((benchmarks.saleConv - saleConv) / 100 * totals.diagnostics * aov),
    },
  ].filter(o => o.status !== 'good').sort((a, b) => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    return impactOrder[a.impact as keyof typeof impactOrder] - impactOrder[b.impact as keyof typeof impactOrder];
  });

  const achievements = [
    ctr >= benchmarks.ctr && { label: 'CTR выше нормы', value: `${ctr.toFixed(1)}%` },
    leadConv >= benchmarks.leadConv && { label: 'Отличная конверсия лидов', value: `${leadConv.toFixed(1)}%` },
    diagConv >= benchmarks.diagConv && { label: 'Высокая явка', value: `${diagConv.toFixed(0)}%` },
    saleConv >= benchmarks.saleConv && { label: 'Сильные продажи', value: `${saleConv.toFixed(0)}%` },
    romi >= benchmarks.romi && { label: 'ROMI в норме', value: `${romi.toFixed(0)}%` },
  ].filter(Boolean);

  const totalPotentialGain = opportunities.reduce((sum, o) => sum + (o.potentialGain || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-background border rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Точки роста</h2>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Найдите узкие места в воронке и получите персональные рекомендации для увеличения прибыли
            </p>
          </div>
          {totalPotentialGain > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Потенциал роста</p>
              <p className="text-2xl font-bold text-success">+{formatCurrency(totalPotentialGain)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-success">Ваши достижения</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a, i) => a && (
              <Badge key={i} variant="outline" className="bg-success/10 border-success/30 text-success">
                {a.label}: {a.value}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Рекомендации по улучшению
          {opportunities.length > 0 && (
            <Badge variant="secondary">{opportunities.length}</Badge>
          )}
        </h3>

        {opportunities.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
            <h4 className="font-semibold mb-1">Отличная работа!</h4>
            <p className="text-muted-foreground">Все показатели в норме или выше среднего</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {opportunities.map((opp) => (
              <div 
                key={opp.id}
                className={`bg-card border rounded-xl p-5 ${
                  opp.status === 'critical' ? 'border-destructive/30' : 'border-warning/30'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      opp.status === 'critical' ? 'bg-destructive/10' : 'bg-warning/10'
                    }`}>
                      {opp.status === 'critical' ? (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{opp.title}</h4>
                      <p className="text-sm text-muted-foreground">{opp.description}</p>
                    </div>
                  </div>
                  <Badge variant={opp.impact === 'high' ? 'default' : 'secondary'}>
                    {opp.impact === 'high' ? 'Высокий приоритет' : 'Средний приоритет'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Сейчас</p>
                    <p className="text-lg font-bold">{opp.current.toFixed(1)}{opp.unit}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Цель</p>
                    <p className="text-lg font-bold text-primary">{opp.benchmark}{opp.unit}</p>
                  </div>
                  <div className="bg-success/10 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Потенциал</p>
                    <p className="text-lg font-bold text-success">
                      {opp.potentialGain > 1000 
                        ? `+${formatCurrency(opp.potentialGain)}`
                        : `+${opp.potentialGain} лидов`}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Прогресс до цели</span>
                    <span>{Math.min(100, (opp.current / opp.benchmark) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.min(100, (opp.current / opp.benchmark) * 100)} className="h-2" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {opp.actions.map((action, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">CPL</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(cpl)}</p>
          <p className="text-xs text-muted-foreground">Норма: {formatCurrency(benchmarks.cpl)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">CAC</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(cac)}</p>
          <p className="text-xs text-muted-foreground">Стоимость клиента</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">ROMI</span>
          </div>
          <p className={`text-xl font-bold ${romi >= 100 ? 'text-success' : 'text-warning'}`}>
            {romi.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">Цель: 100%+</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Средний чек</span>
          </div>
          <p className="text-xl font-bold">{formatCurrency(aov)}</p>
          <p className="text-xs text-muted-foreground">AOV</p>
        </div>
      </div>
    </div>
  );
};
