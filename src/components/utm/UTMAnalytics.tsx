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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">UTM-аналитика</h2>
          <p className="text-muted-foreground">
            Входящие заявки с UTM-метками ({leads.length} заявок)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, email, телефону..."
              className="pl-9 w-64"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Сбросить
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-card border rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">UTM Source</label>
              <Select
                value={filters.utm_source || 'all'}
                onValueChange={(value) => handleFilterChange('utm_source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все источники" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все источники</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">UTM Medium</label>
              <Select
                value={filters.utm_medium || 'all'}
                onValueChange={(value) => handleFilterChange('utm_medium', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все каналы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все каналы</SelectItem>
                  {mediums.map(medium => (
                    <SelectItem key={medium} value={medium}>{medium}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">UTM Campaign</label>
              <Select
                value={filters.utm_campaign || 'all'}
                onValueChange={(value) => handleFilterChange('utm_campaign', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все кампании" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все кампании</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Статус</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
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
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Воронка
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <TableIcon className="w-4 h-4" />
            Таблица
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="funnel" className="mt-6">
          <UTMFunnelChart leads={leads} />
        </TabsContent>
        
        <TabsContent value="table" className="mt-6">
          {/* Leads Table */}
          <div className="bg-card border rounded-xl overflow-hidden">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Дата/Время</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>UTM Source</TableHead>
              <TableHead>UTM Medium</TableHead>
              <TableHead>UTM Campaign</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  Заявки не найдены
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    {lead.external_lead_id || lead.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.name && <div className="font-medium">{lead.name}</div>}
                      {lead.email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.utm_source ? (
                      <Badge variant="outline">{lead.utm_source}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.utm_medium ? (
                      <Badge variant="secondary">{lead.utm_medium}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.utm_campaign ? (
                      <span className="text-sm">{lead.utm_campaign}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.status || 'new']}>
                      {statusLabels[lead.status || 'new'] || lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {lead.deal_amount ? formatCurrency(lead.deal_amount) : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye className="w-4 h-4" />
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
