import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Phone, 
  Mail, 
  Calendar,
  Tag,
  DollarSign,
  X,
  ChevronDown,
  Loader2,
  ExternalLink,
  BarChart3,
  TableIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLeads, Lead, LeadFilter } from '@/hooks/useLeads';
import { LeadDetailCard } from './LeadDetailCard';
import { UTMFunnelChart } from './UTMFunnelChart';

interface UTMAnalyticsProps {
  projectId: string | null;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const statusColors: Record<string, string> = {
  'new': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'processing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'qualified': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'closed': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const statusLabels: Record<string, string> = {
  'new': 'Новая',
  'processing': 'В работе',
  'qualified': 'Квалифицирована',
  'closed': 'Закрыта',
  'rejected': 'Отклонена',
};

export const UTMAnalytics = ({ projectId }: UTMAnalyticsProps) => {
  const { leads, loading, filters, setFilters, getUniqueValues } = useLeads(projectId);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const sources = getUniqueValues('utm_source');
  const mediums = getUniqueValues('utm_medium');
  const campaigns = getUniqueValues('utm_campaign');

  const handleFilterChange = (key: keyof LeadFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold">UTM-аналитика</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Входящие заявки ({leads.length})
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              className="pl-8 h-9 text-sm"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9"
            >
              <Filter className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Фильтры</span>
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
                <X className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Сбросить</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border rounded-xl p-3 sm:p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            <div>
              <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Source</label>
              <Select
                value={filters.utm_source || 'all'}
                onValueChange={(value) => handleFilterChange('utm_source', value)}
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Medium</label>
              <Select
                value={filters.utm_medium || 'all'}
                onValueChange={(value) => handleFilterChange('utm_medium', value)}
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {mediums.map(medium => (
                    <SelectItem key={medium} value={medium}>{medium}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Campaign</label>
              <Select
                value={filters.utm_campaign || 'all'}
                onValueChange={(value) => handleFilterChange('utm_campaign', value)}
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">Статус</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="funnel" className="w-full">
        <TabsList className="grid w-full max-w-xs sm:max-w-md grid-cols-2 h-9">
          <TabsTrigger value="funnel" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            Воронка
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <TableIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            Таблица
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="funnel" className="mt-4 sm:mt-6">
          <UTMFunnelChart leads={leads} />
        </TabsContent>
        
        <TabsContent value="table" className="mt-4 sm:mt-6">
          {/* Leads Table */}
          <div className="bg-card border rounded-xl overflow-x-auto">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-xs">ID</TableHead>
              <TableHead className="text-xs">Дата</TableHead>
              <TableHead className="text-xs">Контакт</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Source</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Medium</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Campaign</TableHead>
              <TableHead className="text-xs">Статус</TableHead>
              <TableHead className="text-right text-xs">Сумма</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                  Заявки не найдены
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-[10px] sm:text-xs py-2">
                    {lead.external_lead_id || lead.id.slice(0, 6)}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-muted-foreground hidden sm:block" />
                      <span className="text-[10px] sm:text-xs">
                        {format(new Date(lead.created_at), 'dd.MM.yy', { locale: ru })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="space-y-0.5">
                      {lead.name && <div className="font-medium text-xs truncate max-w-[100px] sm:max-w-none">{lead.name}</div>}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Phone className="w-2.5 h-2.5" />
                          <span className="truncate">{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2">
                    {lead.utm_source ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{lead.utm_source}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-2">
                    {lead.utm_medium ? (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{lead.utm_medium}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-2">
                    {lead.utm_campaign ? (
                      <span className="text-xs truncate max-w-[100px] block">{lead.utm_campaign}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge className={`${statusColors[lead.status || 'new']} text-[10px] px-1.5 py-0`}>
                      {statusLabels[lead.status || 'new'] || lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-xs py-2">
                    {lead.deal_amount ? formatCurrency(lead.deal_amount) : '—'}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Карточка заявки</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <LeadDetailCard 
              lead={selectedLead} 
              projectId={projectId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
