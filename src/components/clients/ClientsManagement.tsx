import { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  deal_amount: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  created_at: string;
  extra_data: any;
}

interface ClientsManagementProps {
  projectId: string | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новый', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
  { value: 'contacted', label: 'Связались', color: 'bg-purple-500/20 text-purple-500 border-purple-500/30' },
  { value: 'diagnostic', label: 'На диагностике', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  { value: 'qualified', label: 'Квалифицирован', color: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30' },
  { value: 'proposal', label: 'Предложение', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  { value: 'purchased', label: 'Купил', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
  { value: 'rejected', label: 'Отказ', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
];

export const ClientsManagement = ({ projectId }: ClientsManagementProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchLeads = async () => {
    if (!projectId) {
      setLeads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Ошибка загрузки клиентов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [projectId]);

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(prev => 
        prev.map(lead => 
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
      toast.success('Статус обновлён');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Ошибка обновления статуса');
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge className={statusOption.color}>
        {statusOption.label}
      </Badge>
    );
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  };

  if (!projectId) {
    return (
      <div className="bg-card border rounded-xl p-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Выберите проект</h3>
        <p className="text-muted-foreground">Для просмотра клиентов выберите проект в боковом меню</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Клиенты</h2>
          <p className="text-sm text-muted-foreground">
            {leads.length} клиентов из вебхуков
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLeads}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по имени, телефону, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Клиент</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Телефон</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Статус</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">UTM Source</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Сумма</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Дата</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Клиенты не найдены по заданным фильтрам'
                    : 'Клиенты появятся здесь после получения данных через вебхук'
                  }
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {(lead.name || 'К').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{lead.name || 'Без имени'}</p>
                        {lead.email && (
                          <p className="text-sm text-muted-foreground">{lead.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {lead.phone ? (
                      <a 
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Select 
                      value={lead.status || 'new'} 
                      onValueChange={(value) => updateLeadStatus(lead.id, value)}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue>
                          {getStatusBadge(lead.status)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            <Badge className={status.color}>{status.label}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    {lead.utm_source ? (
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {lead.utm_source}
                        </Badge>
                        {lead.utm_medium && (
                          <p className="text-xs text-muted-foreground">{lead.utm_medium}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 font-medium">
                    {formatCurrency(lead.deal_amount)}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {format(new Date(lead.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedLead(lead);
                          setIsDetailOpen(true);
                        }}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Подробнее
                        </DropdownMenuItem>
                        {lead.phone && (
                          <DropdownMenuItem asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="w-4 h-4 mr-2" />
                              Позвонить
                            </a>
                          </DropdownMenuItem>
                        )}
                        {lead.email && (
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="w-4 h-4 mr-2" />
                              Написать
                            </a>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {STATUS_OPTIONS.map(status => {
          const count = leads.filter(l => l.status === status.value).length;
          return (
            <div key={status.value} className="bg-card border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <Badge className={`${status.color} mt-1`}>{status.label}</Badge>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Карточка клиента</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Контакты</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Имя</p>
                    <p className="font-medium">{selectedLead.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Телефон</p>
                    <p className="font-medium">{selectedLead.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedLead.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Сумма сделки</p>
                    <p className="font-medium">{formatCurrency(selectedLead.deal_amount)}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Статус</h4>
                <Select 
                  value={selectedLead.status || 'new'} 
                  onValueChange={(value) => {
                    updateLeadStatus(selectedLead.id, value);
                    setSelectedLead({ ...selectedLead, status: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge className={status.color}>{status.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* UTM Tags */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">UTM-метки</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-secondary rounded">
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="font-mono">{selectedLead.utm_source || '—'}</p>
                  </div>
                  <div className="p-2 bg-secondary rounded">
                    <p className="text-xs text-muted-foreground">Medium</p>
                    <p className="font-mono">{selectedLead.utm_medium || '—'}</p>
                  </div>
                  <div className="p-2 bg-secondary rounded">
                    <p className="text-xs text-muted-foreground">Campaign</p>
                    <p className="font-mono">{selectedLead.utm_campaign || '—'}</p>
                  </div>
                  <div className="p-2 bg-secondary rounded">
                    <p className="text-xs text-muted-foreground">Content</p>
                    <p className="font-mono">{selectedLead.utm_content || '—'}</p>
                  </div>
                  <div className="p-2 bg-secondary rounded col-span-2">
                    <p className="text-xs text-muted-foreground">Term</p>
                    <p className="font-mono">{selectedLead.utm_term || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Добавлен: {format(new Date(selectedLead.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
