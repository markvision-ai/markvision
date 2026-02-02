import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/externalSupabase';
import { useLeads } from '@/hooks/useLeads';
import { 
  Loader2, 
  ChevronRight, 
  RefreshCw,
  ArrowUpDown,
  Settings2,
  LayoutDashboard,
  Download,
  Pencil
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActiveAdsManagerProps {
  projectId: string | null;
}

interface MetaInsight {
  spend: string;
  actions?: { action_type: string; value: string }[];
  clicks?: string;
}

interface Ad {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  insights?: { data: MetaInsight[] };
  creative?: { thumbnail_url?: string };
}

interface AdSet {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  insights?: { data: MetaInsight[] };
  ads?: { data: Ad[] };
}

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  daily_budget?: string;
  insights?: { data: MetaInsight[] };
  adsets?: { data: AdSet[] };
}

interface RowData {
  id: string;
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  status: string;
  spend: number;
  leadsMeta: number;
  cpl: number;
  leadsCRM: number; // Diagnostics
  diagCost: number;
  sales: number;
  revenue: number;
  roi: number;
  children?: RowData[];
  thumbnail?: string; // For ads
}

type SortConfig = {
  key: keyof RowData | null;
  direction: 'asc' | 'desc';
};

export const ActiveAdsManager = ({ projectId }: ActiveAdsManagerProps) => {
  const { leads } = useLeads(projectId);
  const [hierarchy, setHierarchy] = useState<Campaign[]>([]);
  const [adAccountId, setAdAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    status: true,
    spend: true,
    leads: true,
    cpl: true,
    diagnostics: true,
    diagCost: true,
    sales: true,
    revenue: true,
    roi: true,
  });

  useEffect(() => {
    if (!projectId) return;
    fetchHierarchy();
  }, [projectId]);

  const handleForceSync = async () => {
    setLoading(true);
    try {
        toast.info('Синхронизация с Meta Ads...');
        await supabase.functions.invoke('sync-meta-ads', {
            body: { projectId, syncType: 'ads' }
        });
        await fetchHierarchy();
        toast.success('Данные обновлены');
    } catch (e) {
        console.error('Sync failed', e);
        toast.error('Ошибка синхронизации');
        setLoading(false);
    }
  };

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { action: 'get_hierarchy', payload: { projectId } }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setHierarchy(data.data || []);
      if (data.adAccountId) {
          setAdAccountId(data.adAccountId);
      }
    } catch (e) {
      console.error('Failed to fetch ads hierarchy', e);
      toast.error('Ошибка загрузки структуры рекламы');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToggling(id);
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    try {
      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { 
            action: 'update_status', 
            payload: { projectId, entityId: id, status: newStatus } 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      updateLocalStatus(id, newStatus);
      toast.success(`Статус обновлен: ${newStatus}`);
    } catch (e) {
      console.error('Failed to update status', e);
      toast.error('Не удалось обновить статус');
    } finally {
      setToggling(null);
    }
  };

  const updateLocalStatus = (id: string, status: 'ACTIVE' | 'PAUSED') => {
      const updateNode = (nodes: any[]): any[] => {
          return nodes.map(node => {
              if (node.id === id) return { ...node, status };
              if (node.adsets) return { ...node, adsets: { data: updateNode(node.adsets.data) } };
              if (node.ads) return { ...node, ads: { data: updateNode(node.ads.data) } };
              return node;
          });
      };
      setHierarchy(prev => updateNode(prev));
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getLeadsCount = (insights?: { data: MetaInsight[] }) => {
    if (!insights?.data?.[0]?.actions) return 0;
    const action = insights.data[0].actions.find((a: any) => 
      a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead'
    );
    return action ? parseInt(action.value) : 0;
  };

  const getSpend = (insights?: { data: MetaInsight[] }) => {
      return parseFloat(insights?.data?.[0]?.spend || "0");
  };

  // Process data into tree structure
  const processedData = useMemo(() => {
    return hierarchy.map(campaign => {
      const spend = getSpend(campaign.insights);
      const leadsMeta = getLeadsCount(campaign.insights);
      const cpl = leadsMeta > 0 ? spend / leadsMeta : 0;
      
      const campaignLeads = leads.filter(l => l.utm_campaign === campaign.id || l.utm_campaign === campaign.name); 
      const leadsCRM = campaignLeads.length;
      const diagCost = leadsCRM > 0 ? spend / leadsCRM : 0;
      
      const paidLeads = campaignLeads.filter(l => l.status === 'paid');
      const sales = paidLeads.length;
      const revenue = paidLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
      const roi = spend > 0 ? (revenue - spend) / spend * 100 : 0; // ROI as percentage

      const adsets = (campaign.adsets?.data || []).map(adset => {
        const adsetSpend = getSpend(adset.insights);
        const adsetLeadsMeta = getLeadsCount(adset.insights);
        const adsetCpl = adsetLeadsMeta > 0 ? adsetSpend / adsetLeadsMeta : 0;
        
        const ads = (adset.ads?.data || []).map(ad => {
             const adSpend = getSpend(ad.insights);
             const adLeadsMeta = getLeadsCount(ad.insights);
             const adCpl = adLeadsMeta > 0 ? adSpend / adLeadsMeta : 0;
             return {
                 id: ad.id,
                 type: 'ad' as const,
                 name: ad.name,
                 status: ad.status,
                 spend: adSpend,
                 leadsMeta: adLeadsMeta,
                 cpl: adCpl,
                 leadsCRM: 0, 
                 diagCost: 0,
                 sales: 0,
                 revenue: 0,
                 roi: 0,
                 thumbnail: ad.creative?.thumbnail_url
             };
        });

        return {
            id: adset.id,
            type: 'adset' as const,
            name: adset.name,
            status: adset.status,
            spend: adsetSpend,
            leadsMeta: adsetLeadsMeta,
            cpl: adsetCpl,
            leadsCRM: 0,
            diagCost: 0,
            sales: 0,
            revenue: 0,
            roi: 0,
            children: ads
        };
      });

      return {
        id: campaign.id,
        type: 'campaign' as const,
        name: campaign.name,
        status: campaign.status,
        spend,
        leadsMeta,
        cpl,
        leadsCRM,
        diagCost,
        sales,
        revenue,
        roi,
        children: adsets
      };
    });
  }, [hierarchy, leads]);

  // Sort Logic
  const sortedData = useMemo(() => {
    const sortNodes = (nodes: RowData[]): RowData[] => {
      if (!sortConfig.key) return nodes;

      const sorted = [...nodes].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === bValue) return 0;
        
        const comparison = aValue > bValue ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });

      return sorted.map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined
      }));
    };

    return sortNodes(processedData);
  }, [processedData, sortConfig]);

  // Flatten for rendering
  const flattenRows = (nodes: RowData[], level = 0): (RowData & { level: number })[] => {
    let result: (RowData & { level: number })[] = [];
    nodes.forEach(node => {
      result.push({ ...node, level });
      if (expandedRows.has(node.id) && node.children) {
        result = result.concat(flattenRows(node.children, level + 1));
      }
    });
    return result;
  };

  const visibleRows = useMemo(() => flattenRows(sortedData), [sortedData, expandedRows]);

  const handleSort = (key: keyof RowData) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('ru-RU').format(val);
  const formatPercent = (val: number) => new Intl.NumberFormat('ru-RU', { style: 'percent', maximumFractionDigits: 1 }).format(val / 100);

  const getSortIcon = (key: keyof RowData) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUpDown className="w-3 h-3 ml-1 text-primary" />
      : <ArrowUpDown className="w-3 h-3 ml-1 text-primary rotate-180" />;
  };

  // Export
  const handleExport = () => {
    const headers = [
      'ID', 'Type', 'Name', 'Status', 'Spend', 'Leads (Meta)', 'CPL', 'Leads (CRM)', 'Diag Cost', 'Sales', 'Revenue', 'ROI'
    ];
    
    const rows = visibleRows.map(row => [
      row.id,
      row.type,
      `"${row.name.replace(/"/g, '""')}"`,
      row.status,
      row.spend.toFixed(2),
      row.leadsMeta,
      row.cpl.toFixed(2),
      row.leadsCRM,
      row.diagCost.toFixed(2),
      row.sales,
      row.revenue.toFixed(2),
      (row.roi).toFixed(2) + '%'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Editing Logic
  const [editingEntity, setEditingEntity] = useState<RowData | null>(null);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [saving, setSaving] = useState(false);

  const openEditDialog = (row: RowData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEntity(row);
    setEditName(row.name);
    if (row.type === 'campaign') {
        const campaign = hierarchy.find(c => c.id === row.id);
        setEditBudget(campaign?.daily_budget || '');
    } else {
        setEditBudget('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntity) return;
    setSaving(true);
    try {
        const payload: any = { 
            projectId, 
            entityId: editingEntity.id, 
            name: editName 
        };
        
        if (editingEntity.type === 'campaign' && editBudget) {
            payload.daily_budget = editBudget;
        }

        const { data, error } = await supabase.functions.invoke('ads-manager', {
            body: { 
                action: 'update_entity', 
                payload 
            }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        const updateNode = (nodes: any[]): any[] => {
            return nodes.map(node => {
                if (node.id === editingEntity.id) {
                    return { 
                        ...node, 
                        name: editName,
                        daily_budget: editingEntity.type === 'campaign' ? editBudget : node.daily_budget
                    };
                }
                if (node.adsets) return { ...node, adsets: { data: updateNode(node.adsets.data) } };
                if (node.ads) return { ...node, ads: { data: updateNode(node.ads.data) } };
                return node;
            });
        };
        setHierarchy(prev => updateNode(prev));
        
        toast.success('Изменения сохранены');
        setEditingEntity(null);
    } catch (e) {
        console.error('Failed to update', e);
        toast.error('Ошибка сохранения');
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl crm-card-glass border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
             <LayoutDashboard className="w-5 h-5 text-blue-500" />
          </div>
          <div>
             <h2 className="text-lg font-bold">Active Ads Manager</h2>
             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   Live Sync
                </span>
                {adAccountId && (
                  <span className="px-2 py-0.5 rounded bg-muted font-mono">
                    ID: {adAccountId}
                  </span>
                )}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={handleForceSync} disabled={loading}>
             <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
             Обновить
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading || visibleRows.length === 0}>
             <Download className="w-4 h-4 mr-2" />
             Экспорт
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="w-4 h-4 mr-2" />
                Столбцы
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Видимость столбцов</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.keys(columnVisibility).map(key => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={columnVisibility[key]}
                  onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [key]: checked }))}
                >
                  {key === 'status' ? 'Статус' :
                   key === 'spend' ? 'Расходы' :
                   key === 'leads' ? 'Лиды (Meta)' :
                   key === 'cpl' ? 'CPL' :
                   key === 'diagnostics' ? 'Диагностики' :
                   key === 'diagCost' ? 'Стоимость диаг.' :
                   key === 'sales' ? 'Продажи' :
                   key === 'revenue' ? 'Выручка' :
                   key === 'roi' ? 'ROI' : key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-[350px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 -ml-3 hover:bg-transparent font-bold">
                  Кампания / Группа / Объявление
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              {columnVisibility.status && (
                <TableHead className="w-[100px] text-center">Статус</TableHead>
              )}
              {columnVisibility.spend && (
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('spend')} className="h-8 px-0 hover:bg-transparent font-bold">
                    Расходы
                    {getSortIcon('spend')}
                  </Button>
                </TableHead>
              )}
              {columnVisibility.leads && (
                <TableHead className="text-right">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('leadsMeta')} className="h-8 px-0 hover:bg-transparent font-bold">
                    Лиды
                    {getSortIcon('leadsMeta')}
                  </Button>
                </TableHead>
              )}
              {columnVisibility.cpl && (
                <TableHead className="text-right">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('cpl')} className="h-8 px-0 hover:bg-transparent font-bold">
                    CPL
                    {getSortIcon('cpl')}
                  </Button>
                </TableHead>
              )}
              {columnVisibility.diagnostics && (
                <TableHead className="text-right text-blue-400">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('leadsCRM')} className="h-8 px-0 hover:bg-transparent font-bold text-blue-400">
                    Диаг. (CRM)
                    {getSortIcon('leadsCRM')}
                  </Button>
                </TableHead>
              )}
              {columnVisibility.diagCost && (
                <TableHead className="text-right text-blue-400">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('diagCost')} className="h-8 px-0 hover:bg-transparent font-bold text-blue-400">
                    Цена диаг.
                    {getSortIcon('diagCost')}
                  </Button>
                </TableHead>
              )}
              {columnVisibility.sales && (
                <TableHead className="text-right text-emerald-400">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('sales')} className="h-8 px-0 hover:bg-transparent font-bold text-emerald-400">
                    Продажи
                    {getSortIcon('sales')}
                  </Button>
                </TableHead>
              )}
              {columnVisibility.revenue && (
                <TableHead className="text-right text-emerald-400">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('revenue')} className="h-8 px-0 hover:bg-transparent font-bold text-emerald-400">
                    Выручка
                    {getSortIcon('revenue')}
                  </Button>
                </TableHead>
              )}
              {columnVisibility.roi && (
                <TableHead className="text-right">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('roi')} className="h-8 px-0 hover:bg-transparent font-bold">
                    ROI
                    {getSortIcon('roi')}
                  </Button>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow>
                 <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                       <Loader2 className="w-6 h-6 animate-spin" />
                       <span>Загрузка данных...</span>
                    </div>
                 </TableCell>
               </TableRow>
            ) : visibleRows.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    Нет активных рекламных кампаний
                 </TableCell>
               </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow 
                  key={row.id} 
                  className={cn(
                    "group transition-colors hover:bg-muted/30",
                    row.type === 'campaign' && "bg-muted/5 font-medium",
                    row.level > 0 && "border-none"
                  )}
                >
                  <TableCell className="py-3">
                    <div 
                      className="flex items-center gap-2 cursor-pointer select-none"
                      style={{ paddingLeft: `${row.level * 24}px` }}
                      onClick={() => row.children && row.children.length > 0 && toggleRow(row.id)}
                    >
                      {row.children && row.children.length > 0 ? (
                        <ChevronRight className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform duration-200",
                          expandedRows.has(row.id) && "rotate-90"
                        )} />
                      ) : (
                        <div className="w-4 h-4" /> // Spacer
                      )}
                      
                      <div className="relative shrink-0">
                         {row.type === 'ad' && row.thumbnail ? (
                             <img src={row.thumbnail} alt="" className="w-8 h-8 rounded object-cover border border-border" />
                         ) : (
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               row.status === 'ACTIVE' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground"
                             )} />
                         )}
                      </div>

                      <div className="flex flex-col min-w-0 group/name">
                        <div className="flex items-center gap-2">
                           <span className="truncate max-w-[200px] md:max-w-[300px] text-sm font-medium" title={row.name}>
                             {row.name}
                           </span>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-opacity"
                             onClick={(e) => openEditDialog(row, e)}
                           >
                             <Pencil className="w-3 h-3 text-muted-foreground" />
                           </Button>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                           {row.type} 
                           <span className="opacity-50">•</span> 
                           ID: {row.id}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {columnVisibility.status && (
                    <TableCell className="text-center">
                      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        {toggling === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                            <Switch 
                                checked={row.status === 'ACTIVE'}
                                onCheckedChange={(checked) => handleToggleStatus(row.id, row.status, { stopPropagation: () => {} } as any)}
                                className={cn(
                                  "data-[state=checked]:bg-emerald-500",
                                  row.status !== 'ACTIVE' && "opacity-50"
                                )}
                            />
                        )}
                      </div>
                    </TableCell>
                  )}

                  {columnVisibility.spend && (
                    <TableCell className="text-right tabular-nums font-mono text-sm">
                      {formatCurrency(row.spend)}
                    </TableCell>
                  )}

                  {columnVisibility.leads && (
                    <TableCell className="text-right tabular-nums font-mono text-sm">
                       {formatNumber(row.leadsMeta)}
                    </TableCell>
                  )}

                  {columnVisibility.cpl && (
                    <TableCell className="text-right tabular-nums font-mono text-sm text-muted-foreground">
                       {row.cpl > 0 ? formatCurrency(row.cpl) : '-'}
                    </TableCell>
                  )}

                  {columnVisibility.diagnostics && (
                    <TableCell className="text-right tabular-nums font-mono text-sm font-medium text-blue-400">
                       {row.leadsCRM > 0 ? formatNumber(row.leadsCRM) : '-'}
                    </TableCell>
                  )}

                  {columnVisibility.diagCost && (
                    <TableCell className="text-right tabular-nums font-mono text-sm text-blue-400/80">
                       {row.diagCost > 0 ? formatCurrency(row.diagCost) : '-'}
                    </TableCell>
                  )}

                  {columnVisibility.sales && (
                    <TableCell className="text-right tabular-nums font-mono text-sm font-medium text-emerald-400">
                       {row.sales > 0 ? formatNumber(row.sales) : '-'}
                    </TableCell>
                  )}

                  {columnVisibility.revenue && (
                    <TableCell className="text-right tabular-nums font-mono text-sm text-emerald-400">
                       {row.revenue > 0 ? formatCurrency(row.revenue) : '-'}
                    </TableCell>
                  )}

                  {columnVisibility.roi && (
                    <TableCell className="text-right tabular-nums font-mono text-sm">
                       <span className={cn(
                         row.roi > 0 ? "text-emerald-500" : row.roi < 0 ? "text-red-500" : "text-muted-foreground"
                       )}>
                         {row.roi !== 0 ? formatPercent(row.roi) : '-'}
                       </span>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingEntity} onOpenChange={(open) => !open && setEditingEntity(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Редактирование {editingEntity?.type}</DialogTitle>
                <DialogDescription>
                    ID: {editingEntity?.id}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Название</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                {editingEntity?.type === 'campaign' && (
                    <div className="space-y-2">
                        <Label>Дневной бюджет</Label>
                        <Input value={editBudget} onChange={(e) => setEditBudget(e.target.value)} placeholder="Например: 1000" />
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingEntity(null)}>Отмена</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Сохранить
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
