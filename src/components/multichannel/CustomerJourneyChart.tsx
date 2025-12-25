import { useState } from 'react';
import { 
  ChevronRight, 
  TrendingUp,
  DollarSign,
  Filter,
  BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Journey {
  id: string;
  dealId: string;
  revenue: number;
  touchpoints: {
    channel: string;
    source: string;
    position: number;
  }[];
}

interface CustomerJourneyChartProps {
  journeys: Journey[];
}

const sourceTypeColors: Record<string, string> = {
  direct: 'bg-slate-500',
  organic: 'bg-green-500',
  paid_search: 'bg-blue-500',
  paid_social: 'bg-pink-500',
  email: 'bg-amber-500',
  referral: 'bg-purple-500',
  retargeting: 'bg-orange-500',
  display: 'bg-cyan-500',
  video: 'bg-red-500',
  affiliate: 'bg-emerald-500',
  sms: 'bg-indigo-500',
  other: 'bg-gray-500',
};

const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + 'M ₸';
  if (rounded >= 1000) return Math.round(rounded / 1000) + 'K ₸';
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

export const CustomerJourneyChart = ({ journeys }: CustomerJourneyChartProps) => {
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'revenue' | 'touchpoints'>('revenue');

  // Get unique sources
  const allSources = new Set<string>();
  journeys.forEach(j => j.touchpoints.forEach(tp => allSources.add(tp.source)));

  // Filter and sort journeys
  const filteredJourneys = journeys
    .filter(j => filterSource === 'all' || j.touchpoints.some(tp => tp.source === filterSource))
    .sort((a, b) => {
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      return b.touchpoints.length - a.touchpoints.length;
    });

  // Calculate common paths
  const pathCounts = new Map<string, { count: number; revenue: number }>();
  journeys.forEach(j => {
    const path = j.touchpoints.map(tp => tp.channel).join(' → ');
    const existing = pathCounts.get(path) || { count: 0, revenue: 0 };
    pathCounts.set(path, { 
      count: existing.count + 1, 
      revenue: existing.revenue + j.revenue 
    });
  });

  const topPaths = Array.from(pathCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const totalRevenue = journeys.reduce((sum, j) => sum + j.revenue, 0);
  const avgTouchpoints = journeys.reduce((sum, j) => sum + j.touchpoints.length, 0) / journeys.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Всего цепочек</span>
          </div>
          <p className="text-2xl font-bold">{journeys.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Среднее касаний</span>
          </div>
          <p className="text-2xl font-bold">{avgTouchpoints.toFixed(1)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Общая выручка</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Top Conversion Paths */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Популярные пути к конверсии
        </h3>
        <div className="space-y-3">
          {topPaths.map(([path, data], index) => (
            <div 
              key={path}
              className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{path}</p>
                <p className="text-xs text-muted-foreground">
                  {data.count} конверсий • {formatCurrency(data.revenue)}
                </p>
              </div>
              <Badge variant="outline">
                {((data.count / journeys.length) * 100).toFixed(0)}%
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Фильтр по источнику" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все источники</SelectItem>
              {Array.from(allSources).map(source => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'revenue' | 'touchpoints')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">По выручке</SelectItem>
            <SelectItem value="touchpoints">По касаниям</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Journey List */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Цепочки касаний ({filteredJourneys.length})</h3>
        </div>
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {filteredJourneys.map((journey) => (
            <div key={journey.id} className="p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {journey.dealId}
                  </Badge>
                  <Badge variant="secondary">
                    {journey.touchpoints.length} касаний
                  </Badge>
                </div>
                <span className="font-semibold text-success">
                  {formatCurrency(journey.revenue)}
                </span>
              </div>
              
              <div className="flex items-center gap-1 flex-wrap">
                {journey.touchpoints.map((tp, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${
                        sourceTypeColors[tp.source] || 'bg-gray-500'
                      }`}
                    >
                      {tp.channel}
                    </div>
                    {index < journey.touchpoints.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assisted Conversions Info */}
      <div className="bg-gradient-to-r from-purple-500/5 via-indigo-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-6">
        <h4 className="font-semibold mb-3">Что такое ассоциированные конверсии?</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Ассоциированные конверсии — это конверсии, в которых канал участвовал, но не был последним 
          в цепочке. Такие каналы важны для привлечения и «прогрева» клиентов, даже если они 
          редко закрывают сделки напрямую.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm">Первое касание</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-sm">Промежуточные</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm">Конверсия</span>
          </div>
        </div>
      </div>
    </div>
  );
};
