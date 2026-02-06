import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface GoalDashboardProps {
  plan: {
    revenue: number;
    sales: number;
    leads: number;
    visits: number;
    spend: number;
  };
  fact: {
    revenue: number;
    sales: number;
    leads: number;
    visits: number;
    expenses: number;
  };
}

export const GoalDashboard = ({ plan, fact }: GoalDashboardProps) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

  const metrics = [
    { 
      label: 'Выручка', 
      plan: plan.revenue, 
      fact: fact.revenue, 
      format: formatCurrency,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600'
    },
    { 
      label: 'Продажи', 
      plan: plan.sales, 
      fact: fact.sales, 
      format: formatNumber,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Лиды', 
      plan: plan.leads, 
      fact: fact.leads, 
      format: formatNumber,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    { 
      label: 'Визиты', 
      plan: plan.visits, 
      fact: fact.visits, 
      format: formatNumber,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
  ];

  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Прогресс по целям
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid gap-6">
        {metrics.map((m) => {
          const percent = m.plan > 0 ? Math.round((m.fact / m.plan) * 100) : 0;
          const delta = m.fact - m.plan;
          const isPositive = delta >= 0;

          return (
            <div key={m.label} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{m.label}</div>
                  <div className="text-2xl font-bold font-mono mt-0.5">{m.format(m.fact)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">
                    Цель: <span className="font-mono">{m.format(m.plan)}</span>
                  </div>
                  <div className={`text-sm font-bold flex items-center justify-end gap-1 ${
                    percent >= 100 ? 'text-emerald-600' : percent >= 80 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {percent}%
                    {percent >= 100 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  </div>
                </div>
              </div>
              
              <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full ${m.color} transition-all duration-500`} 
                  style={{ width: `${Math.min(percent, 100)}%` }} 
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={isPositive ? 'text-emerald-600' : 'text-red-500'}>
                  {isPositive ? '+' : ''}{m.format(delta)} от плана
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
