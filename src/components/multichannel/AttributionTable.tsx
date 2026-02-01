import { useState } from 'react';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AttributionModel, getModelDisplayName } from '@/lib/attribution';

interface AttributionData {
  channelName: string;
  sourceType: string;
  visits: number;
  leads: number;
  sales: number;
  revenue: number;
  attributedRevenue: number;
  attributedProfit: number;
  cpl: number;
  cac: number;
  roi: number;
  assistedConversions: number;
}

interface AttributionTableProps {
  data: AttributionData[];
  compareData: AttributionData[] | null;
  selectedModel: AttributionModel;
  compareModel: AttributionModel | null;
  groupBy: 'channel' | 'campaign';
}

type SortField = 'channelName' | 'visits' | 'leads' | 'sales' | 'attributedRevenue' | 'roi' | 'assistedConversions';
type SortDirection = 'asc' | 'desc';

const formatCurrency = (value: number): string => {
  const rounded = Math.round(value);
  if (rounded >= 1000000) return (rounded / 1000000).toFixed(1) + 'M ₸';
  if (rounded >= 1000) return Math.round(rounded / 1000) + 'K ₸';
  return new Intl.NumberFormat('ru-RU').format(rounded) + ' ₸';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const sourceTypeLabels: Record<string, string> = {
  direct: 'Прямой',
  organic: 'Органика',
  paid_search: 'Платный поиск',
  paid_social: 'Платные соцсети',
  email: 'Email',
  referral: 'Реферал',
  retargeting: 'Ретаргетинг',
  display: 'Медийная',
  video: 'Видео',
  affiliate: 'Партнёрка',
  sms: 'SMS',
  other: 'Другое',
};

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
  other: 'bg-slate-600',
};

export const AttributionTable = ({
  data,
  compareData,
  selectedModel,
  compareModel,
  groupBy,
}: AttributionTableProps) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('attributedRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredData = data
    .filter(item => 
      item.channelName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

  const getComparisonValue = (channelName: string, field: keyof AttributionData): number | null => {
    if (!compareData) return null;
    const compareItem = compareData.find(d => d.channelName === channelName);
    return compareItem ? (compareItem[field] as number) : null;
  };

  const renderComparison = (current: number, compare: number | null) => {
    if (compare === null) return null;
    const diff = current - compare;
    const percentDiff = compare !== 0 ? (diff / compare) * 100 : 0;
    
    return (
      <span className={`ml-2 text-xs ${diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
        {diff > 0 ? '+' : ''}{percentDiff.toFixed(0)}%
      </span>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-primary" />
      : <ArrowDown className="w-4 h-4 text-primary" />;
  };

  // Calculate totals
  const totals = filteredData.reduce((acc, item) => ({
    visits: acc.visits + item.visits,
    leads: acc.leads + item.leads,
    sales: acc.sales + item.sales,
    attributedRevenue: acc.attributedRevenue + item.attributedRevenue,
    assistedConversions: acc.assistedConversions + item.assistedConversions,
  }), { visits: 0, leads: 0, sales: 0, attributedRevenue: 0, assistedConversions: 0 });

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по каналу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {getModelDisplayName(selectedModel)}
          </Badge>
          {compareModel && (
            <>
              <span className="text-muted-foreground">vs</span>
              <Badge variant="outline">
                {getModelDisplayName(compareModel)}
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('channelName')}
              >
                <div className="flex items-center gap-2">
                  Канал <SortIcon field="channelName" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort('visits')}
              >
                <div className="flex items-center justify-end gap-2">
                  Визиты <SortIcon field="visits" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort('leads')}
              >
                <div className="flex items-center justify-end gap-2">
                  Лиды <SortIcon field="leads" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort('sales')}
              >
                <div className="flex items-center justify-end gap-2">
                  Продажи <SortIcon field="sales" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort('attributedRevenue')}
              >
                <div className="flex items-center justify-end gap-2">
                  Атриб. выручка <SortIcon field="attributedRevenue" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort('roi')}
              >
                <div className="flex items-center justify-end gap-2">
                  ROI <SortIcon field="roi" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => handleSort('assistedConversions')}
              >
                <div className="flex items-center justify-end gap-2">
                  Ассоц. конв. <SortIcon field="assistedConversions" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.channelName}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${sourceTypeColors[item.sourceType] || 'bg-slate-600'}`} />
                    <div>
                      <p className="font-medium">{item.channelName}</p>
                      <p className="text-xs text-muted-foreground">
                        {sourceTypeLabels[item.sourceType] || item.sourceType}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(item.visits)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(item.leads)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(item.sales)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <span className="font-semibold text-success">
                      {formatCurrency(item.attributedRevenue)}
                    </span>
                    {renderComparison(
                      item.attributedRevenue,
                      getComparisonValue(item.channelName, 'attributedRevenue')
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge 
                    variant="outline" 
                    className={
                      item.roi > 100 
                        ? 'bg-success/10 text-success border-success/30' 
                        : item.roi > 0 
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : 'bg-destructive/10 text-destructive border-destructive/30'
                    }
                  >
                    {item.roi > 0 ? '+' : ''}{item.roi.toFixed(0)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>{item.assistedConversions}</span>
                    {item.assistedConversions > 0 && (
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            <TableRow className="bg-secondary/50 font-semibold">
              <TableCell>Итого</TableCell>
              <TableCell className="text-right">{formatNumber(totals.visits)}</TableCell>
              <TableCell className="text-right">{formatNumber(totals.leads)}</TableCell>
              <TableCell className="text-right">{formatNumber(totals.sales)}</TableCell>
              <TableCell className="text-right text-success">{formatCurrency(totals.attributedRevenue)}</TableCell>
              <TableCell className="text-right">—</TableCell>
              <TableCell className="text-right">{totals.assistedConversions}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
