import { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Download,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  Flame,
  ThermometerSun,
  Snowflake
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
import { supabase } from '@/lib/externalSupabase';
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
  ltv: number | null;
  lead_score: number | null;
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

// Определение источника по utm_source
const getSourceInfo = (source: string): { label: string; color: string; icon: string } => {
  const s = source.toLowerCase();
  
  if (s.includes('google') || s.includes('gclid')) {
    return { label: 'Google', color: 'bg-red-500/20 text-red-500 border-red-500/30', icon: '🔍' };
  }
  if (s.includes('facebook') || s.includes('fb') || s.includes('meta')) {
    return { label: 'Facebook', color: 'bg-blue-600/20 text-blue-600 border-blue-600/30', icon: '📘' };
  }
  if (s.includes('instagram') || s.includes('ig')) {
    return { label: 'Instagram', color: 'bg-pink-500/20 text-pink-500 border-pink-500/30', icon: '📷' };
  }
  if (s.includes('tiktok') || s.includes('tt')) {
    return { label: 'TikTok', color: 'bg-slate-800/20 text-foreground border-slate-500/30', icon: '🎵' };
  }
  if (s.includes('youtube') || s.includes('yt')) {
    return { label: 'YouTube', color: 'bg-red-600/20 text-red-600 border-red-600/30', icon: '▶️' };
  }
  if (s.includes('yandex') || s.includes('ya')) {
    return { label: 'Яндекс', color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30', icon: '🟡' };
  }
  if (s.includes('vk') || s.includes('vkontakte')) {
    return { label: 'VK', color: 'bg-blue-500/20 text-blue-500 border-blue-500/30', icon: '💬' };
  }
  if (s.includes('telegram') || s.includes('tg')) {
    return { label: 'Telegram', color: 'bg-sky-500/20 text-sky-500 border-sky-500/30', icon: '✈️' };
  }
  if (s.includes('email') || s.includes('mail')) {
    return { label: 'Email', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30', icon: '✉️' };
  }
  
  return { label: source, color: 'bg-muted text-muted-foreground border-border', icon: '🔗' };
};

const SourceBadge = ({ source }: { source: string }) => {
  const info = getSourceInfo(source);
  return (
    <Badge className={`${info.color} gap-1.5 font-medium`}>
      <span>{info.icon}</span>
      {info.label}
    </Badge>
  );
};

// Опции фильтра по источнику
const SOURCE_FILTER_OPTIONS = [
  { value: 'all', label: 'Все источники' },
  { value: 'google', label: '🔍 Google' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'instagram', label: '📷 Instagram' },
  { value: 'tiktok', label: '🎵 TikTok' },
  { value: 'youtube', label: '▶️ YouTube' },
  { value: 'yandex', label: '🟡 Яндекс' },
  { value: 'vk', label: '💬 VK' },
  { value: 'telegram', label: '✈️ Telegram' },
  { value: 'direct', label: '🔗 Прямой' },
];

const getSourceCategory = (utm_source: string | null): string => {
  if (!utm_source) return 'direct';
  const s = utm_source.toLowerCase();
  if (s.includes('google') || s.includes('gclid')) return 'google';
  if (s.includes('facebook') || s.includes('fb') || s.includes('meta')) return 'facebook';
  if (s.includes('instagram') || s.includes('ig')) return 'instagram';
  if (s.includes('tiktok') || s.includes('tt')) return 'tiktok';
  if (s.includes('youtube') || s.includes('yt')) return 'youtube';
  if (s.includes('yandex') || s.includes('ya')) return 'yandex';
  if (s.includes('vk') || s.includes('vkontakte')) return 'vk';
  if (s.includes('telegram') || s.includes('tg')) return 'telegram';
  return 'other';
};

type SortField = 'name' | 'phone' | 'created_at' | 'utm_source' | 'deal_amount' | 'status' | 'ltv' | 'lead_score';
type SortDirection = 'asc' | 'desc';

export const ClientsManagement = ({ projectId }: ClientsManagementProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  // Сортировка
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary" />;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    const leadSourceCategory = getSourceCategory(lead.utm_source);
    const matchesSource = sourceFilter === 'all' || leadSourceCategory === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  });

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'phone':
          aVal = a.phone || '';
          bVal = b.phone || '';
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'utm_source':
          aVal = a.utm_source?.toLowerCase() || '';
          bVal = b.utm_source?.toLowerCase() || '';
          break;
        case 'deal_amount':
          aVal = a.deal_amount || 0;
          bVal = b.deal_amount || 0;
          break;
        case 'status':
          const statusOrder = STATUS_OPTIONS.map(s => s.value);
          aVal = statusOrder.indexOf(a.status || 'new');
          bVal = statusOrder.indexOf(b.status || 'new');
          break;
        case 'ltv':
          aVal = a.ltv || 0;
          bVal = b.ltv || 0;
          break;
        case 'lead_score':
          aVal = a.lead_score || 0;
          bVal = b.lead_score || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortDirection]);
  const exportToCSV = () => {
    const headers = ['Имя', 'Телефон', 'Email', 'Дата заявки', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Статус', 'Сумма сделки'];
    const statusLabels: Record<string, string> = {
      new: 'Новый',
      contacted: 'Связались',
      diagnostic: 'На диагностике',
      qualified: 'Квалифицирован',
      proposal: 'Предложение',
      purchased: 'Купил',
      rejected: 'Отказ'
    };
    
    const rows = filteredLeads.map(lead => [
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm'),
      lead.utm_source || '',
      lead.utm_medium || '',
      lead.utm_campaign || '',
      statusLabels[lead.status || 'new'] || lead.status || '',
      lead.deal_amount ? lead.deal_amount.toString() : ''
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clients_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Экспортировано ${sortedLeads.length} клиентов`);
  };

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={sortedLeads.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по имени, телефону, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
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
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все источники" />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_FILTER_OPTIONS.map(source => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table - Glassmorphism */}
      <div className="backdrop-blur-sm bg-card/50 border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="backdrop-blur-sm bg-secondary/50 border-b border-border">
              <tr>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Имя
                    <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center">
                    Телефон
                    <SortIcon field="phone" />
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Дата заявки
                    <SortIcon field="created_at" />
                  </div>
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">UTM</th>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('utm_source')}
                >
                  <div className="flex items-center">
                    Источник
                    <SortIcon field="utm_source" />
                  </div>
                </th>
                <th 
                  className="text-right p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('deal_amount')}
                >
                  <div className="flex items-center justify-end">
                    Сумма
                    <SortIcon field="deal_amount" />
                  </div>
                </th>
                <th 
                  className="text-right p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('ltv')}
                >
                  <div className="flex items-center justify-end">
                    LTV
                    <SortIcon field="ltv" />
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('lead_score')}
                >
                  <div className="flex items-center">
                    Рейтинг
                    <SortIcon field="lead_score" />
                  </div>
                </th>
                <th 
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Статус
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all'
                      ? 'Клиенты не найдены по заданным фильтрам'
                      : 'Клиенты появятся здесь после получения данных через вебхук'
                    }
                  </td>
                </tr>
              ) : (
                sortedLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-foreground/[0.05] transition-colors border-b border-border">
                    {/* Имя */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {(lead.name || 'К').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lead.name || 'Без имени'}</p>
                          {lead.email && (
                            <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Телефон */}
                    <td className="p-4">
                      {lead.phone ? (
                        <a 
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-2 text-primary hover:underline whitespace-nowrap"
                        >
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Дата заявки */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{format(new Date(lead.created_at), 'dd.MM.yyyy')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(lead.created_at), 'HH:mm')}
                      </p>
                    </td>
                    {/* UTM - цветные теги */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.utm_source && (
                          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs px-2 py-0.5">
                            {lead.utm_source}
                          </Badge>
                        )}
                        {lead.utm_medium && (
                          <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30 text-xs px-2 py-0.5">
                            {lead.utm_medium}
                          </Badge>
                        )}
                        {lead.utm_campaign && (
                          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs px-2 py-0.5">
                            {lead.utm_campaign}
                          </Badge>
                        )}
                        {lead.utm_content && (
                          <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 text-xs px-2 py-0.5 truncate max-w-[100px]" title={lead.utm_content}>
                            {lead.utm_content}
                          </Badge>
                        )}
                        {!lead.utm_source && !lead.utm_medium && !lead.utm_campaign && !lead.utm_content && (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </td>
                    {/* Источник (Google, TikTok, Facebook и т.д.) */}
                    <td className="p-4">
                      {lead.utm_source ? (
                        <SourceBadge source={lead.utm_source} />
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Прямой
                        </Badge>
                      )}
                    </td>
                    {/* Сумма сделки */}
                    <td className="p-4 text-right">
                      {lead.deal_amount ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-green-500">
                            {formatCurrency(lead.deal_amount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* LTV */}
                    <td className="p-4 text-right">
                      {lead.ltv && lead.ltv > 0 ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold text-emerald-500">
                            {formatCurrency(lead.ltv)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Рейтинг (иконки огонька: Красный/Желтый/Голубой) */}
                    <td className="p-4">
                      {lead.lead_score !== null && lead.lead_score !== undefined ? (
                        <div className="flex items-center gap-2">
                          {lead.lead_score >= 80 ? (
                            <>
                              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                              <span className="text-xs font-semibold text-red-500 text-[14px]">{lead.lead_score}</span>
                              <span className="text-xs text-muted-foreground">Горячий</span>
                            </>
                          ) : lead.lead_score >= 50 ? (
                            <>
                              <ThermometerSun className="w-4 h-4 text-yellow-500" />
                              <span className="text-xs font-semibold text-yellow-500 text-[14px]">{lead.lead_score}</span>
                              <span className="text-xs text-muted-foreground">Теплый</span>
                            </>
                          ) : (
                            <>
                              <Snowflake className="w-4 h-4 text-blue-500" />
                              <span className="text-xs font-semibold text-blue-500 text-[14px]">{lead.lead_score}</span>
                              <span className="text-xs text-muted-foreground">Холодный</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Статус */}
                    <td className="p-4">
                      <Select 
                        value={lead.status || 'new'} 
                        onValueChange={(value) => updateLeadStatus(lead.id, value)}
                      >
                        <SelectTrigger className="w-36 h-8">
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
                    {/* Действия */}
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
      </div>

      {/* Stats - Glassmorphism */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {STATUS_OPTIONS.map(status => {
          const count = leads.filter(l => l.status === status.value).length;
          return (
            <div key={status.value} className="backdrop-blur-sm bg-card/50 border border-border rounded-lg p-4 text-center hover:bg-card/70 transition-all">
              <p className="text-2xl font-bold">{count}</p>
              <Badge className={`${status.color} mt-1`}>{status.label}</Badge>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog - Glassmorphism */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-lg backdrop-blur-sm bg-card/50 border border-border">
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
