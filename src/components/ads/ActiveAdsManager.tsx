import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/externalSupabase';
import { useLeads } from '@/hooks/useLeads';
import { Loader2, ChevronRight, ChevronDown, AlertCircle, CheckCircle2, PauseCircle, PlayCircle, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  leadsCRM: number; // Diagnostics
  sales: number;
  revenue: number;
  roi: number;
  children?: RowData[];
  thumbnail?: string; // For ads
}

export const ActiveAdsManager = ({ projectId }: ActiveAdsManagerProps) => {
  const { leads } = useLeads(projectId);
  const [hierarchy, setHierarchy] = useState<Campaign[]>([]);
  const [adAccountId, setAdAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    fetchHierarchy();
  }, [projectId]);

  const handleForceSync = async () => {
    setLoading(true);
    try {
        toast.info('Синхронизация с Meta Ads...');
        // 1. Trigger backend sync for reports
        await supabase.functions.invoke('sync-meta-ads', {
            body: { projectId, syncType: 'ads' }
        });
        
        // 2. Refetch live hierarchy
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

      // Optimistic update
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

  // Process data into display tree
  const processedData = useMemo(() => {
    return hierarchy.map(campaign => {
      // Calculate Campaign Level Metrics
      const spend = getSpend(campaign.insights);
      const leadsMeta = getLeadsCount(campaign.insights);
      
      // CRM Metrics for Campaign (Matched by UTM)
      // Note: This is simplified matching. In production, we'd need robust attribution.
      const campaignLeads = leads.filter(l => l.utm_campaign === campaign.id || l.utm_campaign === campaign.name); 
      const leadsCRM = campaignLeads.length;
      const paidLeads = campaignLeads.filter(l => l.status === 'paid');
      const sales = paidLeads.length;
      const revenue = paidLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);
      const roi = spend > 0 ? revenue / spend : 0;

      const adsets = (campaign.adsets?.data || []).map(adset => {
        const adsetSpend = getSpend(adset.insights);
        const adsetLeadsMeta = getLeadsCount(adset.insights);
        
        // AdSet CRM attribution is harder without utm_term/content specific mapping, 
        // assuming leads might have utm_content or similar. 
        // For this task, we will just propagate 0 or implement if we had utm_term data in leads hook.
        // The user only specified "Diagnostics (Count from leads where utm_campaign matches ID)".
        // So for AdSets/Ads we might show 0 or proportional if not tracked.
        // Let's stick to campaign level CRM data for now, or just show '-' for deeper levels 
        // unless we want to filter leads by other UTMs if available.
        // Assuming we only have utm_campaign reliably for now based on prompt.
        
        const ads = (adset.ads?.data || []).map(ad => {
             const adSpend = getSpend(ad.insights);
             const adLeadsMeta = getLeadsCount(ad.insights);
             return {
                 id: ad.id,
                 type: 'ad' as const,
                 name: ad.name,
                 status: ad.status,
                 spend: adSpend,
                 leadsMeta: adLeadsMeta,
                 leadsCRM: 0, // Not tracking ad level CRM yet
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
            leadsCRM: 0,
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
        leadsCRM,
        sales,
        revenue,
        roi,
        children: adsets
      };
    });
  }, [hierarchy, leads]);

  const renderRow = (row: RowData, level: number = 0) => {
    const isExpanded = expandedRows.has(row.id);
    const hasChildren = row.children && row.children.length > 0;
    const isHighRoi = row.roi > 3;

    return (
      <div key={row.id} className="flex flex-col">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`
            flex items-center py-3 px-4 border-b border-border/50
            hover:bg-muted/50 transition-colors cursor-pointer group
            ${isHighRoi ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 16}px` }}
          onClick={() => hasChildren && toggleRow(row.id)}
        >
          {/* Name Column */}
          <div className="flex-1 flex items-center gap-3 min-w-[300px]">
            {hasChildren ? (
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            ) : <div className="w-4" />}
            
            <div className="relative">
                {row.type === 'ad' && row.thumbnail ? (
                    <img src={row.thumbnail} alt="" className="w-8 h-8 rounded object-cover border border-border" />
                ) : (
                    <div className={`w-2 h-2 rounded-full ${row.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`} />
                )}
            </div>

            <div className="flex flex-col">
                <span className={`text-sm font-medium ${isHighRoi ? 'text-emerald-500 drop-shadow-sm' : 'text-foreground'}`}>
                    {row.name}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.type} • ID: {row.id}</span>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="w-24 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
             {toggling === row.id ? (
                 <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
             ) : (
                <Switch 
                    checked={row.status === 'ACTIVE'}
                    onCheckedChange={(checked) => handleToggleStatus(row.id, row.status, { stopPropagation: () => {} } as any)}
                    className="data-[state=checked]:bg-emerald-500"
                />
             )}
          </div>

          {/* Metrics */}
          <div className="w-24 text-right text-sm text-muted-foreground">
             {row.spend > 0 ? `${Math.round(row.spend).toLocaleString()} ₸` : '-'}
          </div>
          <div className="w-20 text-right text-sm text-foreground">
             {row.leadsMeta}
          </div>
          <div className="w-24 text-right text-sm text-blue-500 font-medium">
             {row.leadsCRM > 0 ? row.leadsCRM : '-'}
          </div>
          <div className="w-20 text-right text-sm text-emerald-500">
             {row.sales > 0 ? row.sales : '-'}
          </div>
          <div className="w-28 text-right text-sm font-bold text-foreground">
             {row.revenue > 0 ? `${row.revenue.toLocaleString()} ₸` : '-'}
          </div>
          <div className="w-20 text-right">
             {row.roi > 0 ? (
                 <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isHighRoi ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'text-muted-foreground'}`}>
                     x{row.roi.toFixed(2)}
                 </span>
             ) : '-'}
          </div>
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && row.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-muted/20"
            >
              {row.children.map(child => renderRow(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            Active Ads Manager
            {adAccountId && <span className="text-xs font-mono text-muted-foreground ml-2 px-2 py-0.5 bg-muted rounded border border-border">ID: {adAccountId}</span>}
        </h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Button 
                variant="outline" 
                size="sm" 
                className="h-7 gap-2 bg-transparent border-border hover:bg-muted text-foreground" 
                onClick={handleForceSync} 
                disabled={loading}
            >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Обновить</span>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" /> Active</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-muted-foreground" /> Paused</span>
        </div>
      </div>

      <div className="min-w-full">
        {/* Header */}
        <div className="flex items-center py-2 px-4 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
            <div className="flex-1">Campaign / AdSet / Ad</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-24 text-right">Spent</div>
            <div className="w-20 text-right">Meta Leads</div>
            <div className="w-24 text-right text-blue-500">Diag (CRM)</div>
            <div className="w-20 text-right text-emerald-500">Sales</div>
            <div className="w-28 text-right">Revenue</div>
            <div className="w-20 text-right">ROI</div>
        </div>

        {/* Body */}
        {loading ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        ) : (
            <div className="divide-y divide-border/50">
                {processedData.length > 0 ? (
                    processedData.map(row => renderRow(row))
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        Нет активных кампаний или данных.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
