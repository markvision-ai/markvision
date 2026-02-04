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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { KZT_RATE } from '@/constants/ads';

import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ActiveAdsManagerProps {
  projectId: string | null;
  dateRange: DateRange | undefined;
  refreshTrigger?: number;
}

interface MetaInsight {
  spend: string;
  actions?: { action_type: string; value: string }[];
  clicks?: string;
}

interface AdInsightRecord {
    entity_id: string;
    name?: string;
    spend: number;
    leads: number;
    clicks: number;
    impressions: number;
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
  spendKZT: number;
  leadsMeta: number;
  clicks?: number;
  impressions?: number;
  cpl: number;
  visits: number;
  visitCost: number;
  sales: number;
  revenue: number;
  roi: number;
  ctr: string;
  cpc: number;
  children?: RowData[];
  thumbnail?: string; // For ads
}

type SortConfig = {
  key: keyof RowData | null;
  direction: 'asc' | 'desc';
};

export const ActiveAdsManager = ({ projectId, dateRange, refreshTrigger = 0 }: ActiveAdsManagerProps) => {
  const { leads } = useLeads(projectId);
  const [hierarchy, setHierarchy] = useState<Campaign[]>([]);
  const [adInsights, setAdInsights] = useState<Record<string, AdInsightRecord>>({});
  const [adAccountId, setAdAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    status: true,
    spend: true,
    leads: true,
    cpl: true,
    visits: true,
    visitCost: true,
    sales: true,
    revenue: true,
    roi: true,
  });

  // Filter leads by date range for accurate CRM metrics
  const filteredLeads = useMemo(() => {
    if (!dateRange?.from) return leads;
    
    const fromStr = format(dateRange.from, 'yyyy-MM-dd');
    const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;

    return leads.filter(l => {
        if (!l.created_at) return false;
        const leadDate = format(new Date(l.created_at), 'yyyy-MM-dd');
        return leadDate >= fromStr && leadDate <= toStr;
    });
  }, [leads, dateRange]);

  // Normalization Helper for Loose Matching
  const normalize = (str: string | undefined | null) => {
      if (!str) return '';
      // Remove emojis, special chars, keep only alphanumeric and cyrillic
      return decodeURIComponent(str).toLowerCase().replace(/[^a-z0-9а-яё]/g, '');
  };

  // Merge Hierarchy with Derived Campaigns from CRM AND Ad Performance Logs
  const fullHierarchy = useMemo(() => {
    if (!hierarchy) return [];
    
    const existingIds = new Set(hierarchy.map(c => c.id));
    const derived: Campaign[] = [];
    const processedUtms = new Set<string>();

    // 1. Derive from Leads (CRM)
    filteredLeads.forEach(lead => {
        const utm = lead.utm_campaign;
        if (!utm) return;
        
        // Skip if this UTM is already processed
        if (processedUtms.has(utm)) return;

        // Check if this UTM matches any existing campaign ID or Name (Loose Match)
        const normUtm = normalize(utm);
        
        const matchFound = hierarchy.some(c => {
            const normName = normalize(c.name);
            const normId = normalize(c.id);
            
            // Direct Match
            if (c.id === utm || normName === normUtm) return true;
            
            // Inclusion Match (if strictly long enough to avoid false positives)
            // e.g. "implants" matches "implants_january"
            if (normUtm.length > 3 && normName.length > 3) {
                if (normUtm.includes(normName) || normName.includes(normUtm)) return true;
            }
            
            return false;
        });
        
        if (!matchFound) {
            processedUtms.add(utm);
            derived.push({
                id: utm, // Use UTM as ID
                name: utm, // Use UTM as Name
                status: 'ACTIVE', // Show as Active to ensure visibility
                daily_budget: '0',
                insights: { data: [] },
                adsets: { data: [] }
            });
        }
    });

    // 2. Derive from Ad Insights (Logs)
    Object.values(adInsights).forEach(insight => {
        const campaignId = insight.entity_id;
        
        // Skip if already in hierarchy
        if (existingIds.has(campaignId)) return;
        
        // Skip if already processed via leads
        if (processedUtms.has(campaignId)) return;
        
        // Check loose match by Name
        if (insight.name) {
             const normName = normalize(insight.name);
             const matchFound = hierarchy.some(c => normalize(c.name) === normName);
             if (matchFound) return;
        }

        processedUtms.add(campaignId);
        derived.push({
            id: campaignId,
            name: insight.name || campaignId,
            status: 'ACTIVE',
            daily_budget: '0',
            insights: { data: [] },
            adsets: { data: [] }
        });
    });

    return [...hierarchy, ...derived];
  }, [hierarchy, filteredLeads, adInsights]);


  const fetchAdInsights = async () => {
      if (!projectId) return;
      
      const since = format(dateRange.from, 'yyyy-MM-dd');
      const until = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : since;
      
      try {
          const { data, error } = await (supabase as any)
              .from('ad_performance_logs')
              .select('*')
              .eq('project_id', projectId)
              .gte('date_start', since)
              .lte('date_start', until);

          if (error) throw error;

          const insightsMap: Record<string, AdInsightRecord> = {};
          
          // Deduplicate logs: keep only the latest entry per (entity_id, date_start)
          // We assume the entry with higher spend is more recent/complete for that day
          const uniqueLogs: Record<string, any> = {};
          data?.forEach((item: any) => {
              const key = `${item.entity_id}_${item.date_start}`;
              const currentSpend = Number(item.spend) || 0;
              const existingSpend = uniqueLogs[key] ? (Number(uniqueLogs[key].spend) || 0) : -1;
              
              if (!uniqueLogs[key] || currentSpend >= existingSpend) {
                  uniqueLogs[key] = item;
              }
          });

          Object.values(uniqueLogs).forEach((item: any) => {
              if (!insightsMap[item.entity_id]) {
                  insightsMap[item.entity_id] = {
                      entity_id: item.entity_id,
                      name: item.entity_name,
                      spend: 0,
                      leads: 0,
                      clicks: 0,
                      impressions: 0
                  };
              }
              const record = insightsMap[item.entity_id];
              record.spend += Number(item.spend);
              record.leads += Number(item.leads);
              record.clicks += Number(item.clicks);
              record.impressions += Number(item.impressions);
          });
          setAdInsights(insightsMap);

      } catch (e) {
          console.error('Failed to fetch insights from DB', e);
      }
  };

  // Circuit Breaker for Rate Limits
  const [rateLimitUntil, setRateLimitUntil] = useState<number>(0);

  // Stable key for dateRange to prevent unnecessary refetches
  const dateRangeKey = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return '';
    return `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`;
  }, [dateRange]);

  useEffect(() => {
    if (projectId && dateRangeKey && dateRange?.from) {
      // Check circuit breaker
      if (Date.now() < rateLimitUntil) {
          console.warn('Meta API requests paused due to Rate Limit.');
          return;
      }
      
      // 1. Load Local Data Immediately (History + cached Today)
      fetchHierarchy(false);
      fetchAdInsights();

      // 2. Smart Sync Logic
      // We sync if we haven't synced this specific range recently to ensure data consistency
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;

      // Use a unique key for this specific date range
      const lastSyncKey = `ads_sync_${projectId}_${fromStr}_${toStr}`;
      const lastSyncTime = sessionStorage.getItem(lastSyncKey);
      const now = Date.now();

      // Check if we should sync:
      // 1. Not synced recently (5 mins cooldown)
      // 2. Rate limit not active
      if (!lastSyncTime || (now - parseInt(lastSyncTime)) > 300000) {
          console.log(`Auto-syncing range: ${fromStr} to ${toStr}`);
          sessionStorage.setItem(lastSyncKey, now.toString()); // Mark as syncing immediately

          toast.info('Синхронизация данных с Meta Ads...');

          supabase.functions.invoke('ads-manager', {
              body: { 
                  action: 'sync_metrics', 
                  payload: { 
                      projectId,
                      date_range: { since: fromStr, until: toStr } 
                  } 
              }
          }).then(({ data, error }) => {
              if (data?.error?.includes('#80004')) {
                   console.warn('Rate Limit hit during auto-sync');
                   setRateLimitUntil(Date.now() + 60000 * 5); // 5 min pause
                   sessionStorage.removeItem(lastSyncKey); // Retry later if failed
                   toast.warning('Meta API: Лимит запросов. Пауза 5 мин.');
              } else if (!error && !data?.error) {
                   console.log('Range synced successfully, refreshing insights...');
                   toast.success('Данные Meta Ads обновлены');
                   fetchAdInsights(); // Refresh to show new data
                   fetchHierarchy(true); // Refresh hierarchy too in case of new campaigns
              } else {
                   console.error('Sync error response:', data);
                   sessionStorage.removeItem(lastSyncKey); // Retry if other error
              }
          }).catch(err => {
              console.error('Auto-sync failed', err);
              sessionStorage.removeItem(lastSyncKey);
          });
      }
    }
  }, [projectId, dateRangeKey, rateLimitUntil]);

  useEffect(() => {
    if (projectId && refreshTrigger > 0) {
      if (Date.now() < rateLimitUntil) {
          console.warn('Meta API sync skipped due to Rate Limit.');
          return;
      }
      // ONLY fetch from DB to avoid hitting Meta API limits
      fetchAdInsights();
      // fetchHierarchy(); // Disable hierarchy fetch on auto-refresh too
    }
  }, [refreshTrigger, rateLimitUntil]);

    // Export to CSV
    const handleExportCSV = () => {
        if (!processedData.length) return;
        
        const headers = ['Name', 'Status', 'Spend (KZT)', 'Leads (Meta)', 'Visits (CRM)', 'Clicks', 'Impressions', 'CTR', 'CPC', 'CPL', 'Visit Cost'];
        const rows = processedData.map(row => [
            row.name,
            row.status,
            row.spendKZT.toFixed(2),
            row.leadsMeta,
            row.visits,
            row.clicks,
            row.impressions,
            row.ctr,
            row.cpc,
            row.cpl,
            row.visitCost.toFixed(2)
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ads_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  const handleForceSync = async () => {
    setLoading(true);
    try {
        // 1. Call sync_metrics
        const { data: syncData, error: syncError } = await supabase.functions.invoke('ads-manager', {
            body: { 
                action: 'sync_metrics', 
                payload: { 
                    projectId,
                    date_range: dateRange?.from ? { 
                        since: format(dateRange.from, 'yyyy-MM-dd'), 
                        until: format(dateRange.to || dateRange.from, 'yyyy-MM-dd') 
                    } : undefined
                } 
            }
        });

        if (syncError) throw syncError;
        if (syncData?.type === 'error') throw new Error(syncData.message);

        // 2. Refresh local insights from DB
        await fetchAdInsights();
        await fetchHierarchy(true);

        if (syncData.message) {
            toast.success(syncData.message);
        } else {
            toast.success('Данные Meta Ads обновлены');
        }
    } catch (e: any) {
        console.error('Sync failed', e);
        if (e.message?.includes('(#80004)')) {
            toast.warning('Meta API: Превышен лимит запросов. Синхронизация пропущена.');
        } else {
            toast.error(`Ошибка синхронизации: ${e.message}`);
        }
    } finally {
        setLoading(false);
    }
  };

  const fetchHierarchy = async (forceApi = false) => {
    setLoading(true);
    try {
      // 0. Try Local DB First (if not forced) to save API calls
      if (!forceApi) {
          // 0.1 Try 'campaigns' table
          const { data: localCampaigns } = await (supabase as any)
            .from('campaigns')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

          if (localCampaigns && localCampaigns.length > 0) {
              const localHierarchy = localCampaigns.map((c: any) => ({
                  id: c.external_id || c.id,
                  name: c.name,
                  status: c.status ? 'ACTIVE' : 'PAUSED',
                  daily_budget: c.budget ? c.budget.toString() : '0',
                  insights: { data: [] },
                  adsets: { data: [] }
              }));
              setHierarchy(localHierarchy);
              setLoading(false);
              return; // Exit early if we have local data
          }

          // 0.2 Try 'ad_performance_logs' table (if campaigns is empty)
          // This prevents API calls even if structure table is empty, as long as we have logs
          const { data: logs } = await (supabase as any)
             .from('ad_performance_logs')
             .select('entity_id, entity_name, spend')
             .eq('project_id', projectId)
             .eq('entity_type', 'campaign')
             .order('date_start', { ascending: false });
             
          if (logs && logs.length > 0) {
             const uniqueMap = new Map();
             logs.forEach((log: any) => {
                 if (!uniqueMap.has(log.entity_id)) {
                     uniqueMap.set(log.entity_id, {
                         id: log.entity_id,
                         name: log.entity_name || `Campaign ${log.entity_id}`,
                         status: 'ACTIVE', 
                         daily_budget: '0',
                         insights: { data: [] },
                         adsets: { data: [] }
                     });
                 }
             });
             const fallbackHierarchy = Array.from(uniqueMap.values()) as Campaign[];
             setHierarchy(fallbackHierarchy);
             setLoading(false);
             return; // Exit early!
          }
      }

      const payload: any = { projectId };
      
      if (dateRange?.from && dateRange?.to) {
          payload.date_range = {
              since: format(dateRange.from, 'yyyy-MM-dd'),
              until: format(dateRange.to, 'yyyy-MM-dd')
          };
      }

      // 1. Try to fetch from Meta API via Edge Function
      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { action: 'get_hierarchy', payload }
      });

      // 2. Fallback Logic for Rate Limits or Errors
      if (error || !data || data.error) {
        console.error('Edge Function/Meta API Error:', error || data?.error);
        
        const isRateLimit = data?.error?.includes('(#80004)') || data?.error?.includes('rate-limiting');
        
        if (isRateLimit) {
            toast.warning('Meta API: Превышен лимит запросов. Используем локальные данные.');
        } else if (data?.error?.includes('No active Ad Account')) {
            toast.error('Рекламный аккаунт не найден.');
            return;
        } else {
            // Only show toast for non-rate-limit errors to reduce noise
            console.warn('Using local fallback due to API error');
        }

        // FETCH FALLBACK FROM DB (campaigns table)
        // This ensures the user sees something even if Meta is down
        let fallbackHierarchy: Campaign[] = [];

        // 1. Try 'campaigns' table (structure source)
        const { data: localCampaigns } = await (supabase as any)
          .from('campaigns')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (localCampaigns && localCampaigns.length > 0) {
            // Map DB structure to Hierarchy structure
            fallbackHierarchy = localCampaigns.map((c: any) => ({
                id: c.external_id || c.id, // Prefer external_id (Meta ID) if available
                name: c.name,
                status: c.status ? 'ACTIVE' : 'PAUSED',
                daily_budget: c.budget ? c.budget.toString() : '0',
                insights: { data: [] }, // No insights in hierarchy structure, handled by adInsights map
                adsets: { data: [] } // We don't have adsets structure in DB, flat list only
            }));
        } else {
             // 2. Try 'ad_performance_logs' (data source)
             // If we have no structure, try to reconstruct from performance logs
             const { data: logs } = await (supabase as any)
                 .from('ad_performance_logs')
                 .select('entity_id, entity_name, spend')
                 .eq('project_id', projectId)
                 .eq('entity_type', 'campaign')
                 .order('date_start', { ascending: false }); // Get most recent first
                 
             if (logs && logs.length > 0) {
                 const uniqueMap = new Map();
                 logs.forEach((log: any) => {
                     if (!uniqueMap.has(log.entity_id)) {
                         uniqueMap.set(log.entity_id, {
                             id: log.entity_id,
                             name: log.entity_name || `Campaign ${log.entity_id}`,
                             status: 'ACTIVE', // Default to ACTIVE to ensure visibility in fallback mode
                             daily_budget: '0',
                             insights: { data: [] },
                             adsets: { data: [] }
                         });
                     }
                 });
                 fallbackHierarchy = Array.from(uniqueMap.values()) as Campaign[];
             }
        }

        if (fallbackHierarchy.length > 0) {
            setHierarchy(fallbackHierarchy);
            // Don't return yet, allow finally block to run
        } else {
             // If local DB is also empty, we truly have no data
             // Only then we might leave hierarchy empty
        }
        return;
      }

      // Success Path
      setHierarchy(data.data || []);
      if (data.adAccountId) {
          setAdAccountId(data.adAccountId);
      }
    } catch (e: any) {
      console.error('Failed to fetch ads hierarchy', e);
      toast.error(`Ошибка загрузки структуры рекламы: ${e.message || 'Неизвестная ошибка'}`);
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

  // Process data into tree structure
  const processedData = useMemo(() => {
    const getMetrics = (id: string, node?: any) => {
        const record = adInsights[id];
        const spend = record?.spend || 0;
        const leadsMeta = record?.leads || 0;
        const clicks = record?.clicks || 0;
        const impressions = record?.impressions || 0;

        // Fallback removed to prevent mixing Lifetime (API) and Daily (DB) data.
        // We rely strictly on DB logs for consistent aggregation.

        const spendKZT = spend * KZT_RATE;
        return { spend, leadsMeta, clicks, impressions, spendKZT };
    };

    const shouldShow = (status: string, id: string, metrics: { spend: number, leadsMeta: number, visits: number }) => {
       if (status === 'DELETED' || status === 'ARCHIVED') return false;
       
       // ALWAYS show items that have performance data in the selected period,
       // regardless of their current status or the "Active Only" toggle.
       // This ensures historical data (e.g. from Feb 1st) is visible even if the campaign is now paused.
       if (metrics.spend > 0 || metrics.leadsMeta > 0 || metrics.visits > 0) {
           return true;
       }

       if (showActiveOnly && status !== 'ACTIVE') return false;
       return true;
    };

    // Helper to process nodes recursively with bottom-up aggregation
    const processNode = (node: any, type: 'campaign' | 'adset' | 'ad'): RowData => {
        const ownMetrics = getMetrics(node.id, node);
        
        let children: RowData[] = [];
        let childrenSum = { spend: 0, leadsMeta: 0, clicks: 0, impressions: 0, spendKZT: 0, visits: 0 };

        // Process children if they exist
        const rawChildren = type === 'campaign' ? node.adsets?.data : (type === 'adset' ? node.ads?.data : []);
        
        if (rawChildren && rawChildren.length > 0) {
            const childType = type === 'campaign' ? 'adset' : 'ad';
            // Map ALL children first (without filtering) to correctly calculate parent sums
            const allProcessedChildren = rawChildren.map((child: any) => processNode(child, childType));
            
            // Sum up metrics from all children
            childrenSum = allProcessedChildren.reduce((acc: any, child: RowData) => ({
                spend: acc.spend + child.spend,
                leadsMeta: acc.leadsMeta + child.leadsMeta,
                clicks: (acc.clicks || 0) + (child.clicks || 0),
                impressions: (acc.impressions || 0) + (child.impressions || 0),
                spendKZT: acc.spendKZT + child.spendKZT,
                visits: (acc.visits || 0) + child.visits
            }), { spend: 0, leadsMeta: 0, clicks: 0, impressions: 0, spendKZT: 0, visits: 0 });

            // Filter for display based on Status AND Metrics
            children = allProcessedChildren.filter((child: RowData) => 
                shouldShow(child.status, child.id, { 
                    spend: child.spend, 
                    leadsMeta: child.leadsMeta, 
                    visits: child.visits 
                })
            );
        }

        // Final Metrics: Max(Own, SumChildren) to ensure consistency (Pyramid Rule)
        const finalSpend = Math.max(ownMetrics.spend, childrenSum.spend);
        const finalSpendKZT = Math.max(ownMetrics.spendKZT, childrenSum.spendKZT);
        
        const rawLeadsMeta = Math.max(ownMetrics.leadsMeta, childrenSum.leadsMeta);
        const finalClicks = Math.max(ownMetrics.clicks, childrenSum.clicks);
        const finalImpressions = Math.max(ownMetrics.impressions, childrenSum.impressions);
        
        // CRM Metrics Logic
        // Filter leads relevant to this node based on UTM parameters
        const nodeLeads = filteredLeads.filter(l => {
            const normId = normalize(node.id);
            const normName = normalize(node.name);

            if (type === 'campaign') {
                const utm = l.utm_campaign;
                if (!utm) return false;
                const normUtm = normalize(utm);
                
                // 1. Exact Match (ID or Name)
                if (utm === node.id || normUtm === normName) return true;
                
                // 2. Loose Match (Inclusion)
                if (normUtm.length > 3 && normName.length > 3) {
                     if (normUtm.includes(normName) || normName.includes(normUtm)) return true;
                }
                return false;

            } else if (type === 'adset') {
                const utm = l.utm_term; // Standard UTM for AdSet
                if (!utm) return false;
                const normUtm = normalize(utm);
                
                if (utm === node.id || normUtm === normName) return true;
                if (normUtm.length > 3 && normName.length > 3) {
                     if (normUtm.includes(normName) || normName.includes(normUtm)) return true;
                }
                return false;

            } else if (type === 'ad') {
                const utm = l.utm_content; // Standard UTM for Ad
                if (!utm) return false;
                const normUtm = normalize(utm);

                if (utm === node.id || normUtm === normName) return true;
                if (normUtm.length > 3 && normName.length > 3) {
                     if (normUtm.includes(normName) || normName.includes(normUtm)) return true;
                }
                return false;
            }
            return false;
        });

        // Leads CRM (now Visits): For campaigns, if direct matching fails (0), try using children sum
        // This handles cases where leads match AdSets (via utm_term) but not Campaign (via utm_campaign)
        let visits = nodeLeads.length;
        if (visits === 0 && type === 'campaign' && childrenSum.visits > 0) {
             visits = childrenSum.visits;
        }

        // Smart Leads Logic: Use Max(Meta, CRM)
        const finalLeadsMeta = Math.max(rawLeadsMeta, visits);

        // Calculate derivatives (using Smart Leads count)
        const cpl = finalLeadsMeta > 0 ? finalSpendKZT / finalLeadsMeta : 0;

        const paidLeads = nodeLeads.filter(l => l.status === 'paid');
        const sales = paidLeads.length;
        const revenue = paidLeads.reduce((sum, l) => sum + (l.deal_amount || 0), 0);

        const visitCost = visits > 0 ? finalSpendKZT / visits : 0;
        const roi = finalSpendKZT > 0 ? (revenue - finalSpendKZT) / finalSpendKZT * 100 : 0;
        
        const ctr = finalImpressions > 0 ? ((finalClicks / finalImpressions) * 100).toFixed(2) + '%' : '0%';
        const cpc = finalClicks > 0 ? finalSpendKZT / finalClicks : 0;

        // Push Down Logic: If there is exactly one child (1:1 relationship),
        // ensure the child inherits the parent's final metrics to prevent data gaps.
        // This addresses the "1 Campaign = 1 Group = 1 Ad" consistency requirement.
        if (children.length === 1) {
             const applyMetricsRecursively = (target: RowData, sourceMetrics: any) => {
                 target.spend = sourceMetrics.spend;
                 target.spendKZT = sourceMetrics.spendKZT;
                 target.leadsMeta = sourceMetrics.leadsMeta;
                 target.clicks = sourceMetrics.clicks;
                 target.impressions = sourceMetrics.impressions;
                 target.cpl = sourceMetrics.cpl;
                 target.visits = sourceMetrics.visits;
                 target.visitCost = sourceMetrics.visitCost;
                 target.sales = sourceMetrics.sales;
                 target.revenue = sourceMetrics.revenue;
                 target.roi = sourceMetrics.roi;
                 target.ctr = sourceMetrics.ctr;
                 target.cpc = sourceMetrics.cpc;

                 // Continue propagating down if the target also has exactly one child
                 if (target.children && target.children.length === 1) {
                     applyMetricsRecursively(target.children[0], sourceMetrics);
                 }
             };

             const metricsToPush = {
                 spend: finalSpend,
                 spendKZT: finalSpendKZT,
                 leadsMeta: finalLeadsMeta,
                 clicks: finalClicks,
                 impressions: finalImpressions,
                 cpl: cpl,
                 visits: visits,
                 visitCost: visitCost,
                 sales: sales,
                 revenue: revenue,
                 roi: roi,
                 ctr: ctr,
                 cpc: cpc
             };

             applyMetricsRecursively(children[0], metricsToPush);
        }

        return {
            id: node.id,
            type,
            name: node.name,
            status: node.status,
            spend: finalSpend,
            spendKZT: finalSpendKZT,
            leadsMeta: finalLeadsMeta,
            clicks: finalClicks,
            impressions: finalImpressions,
            cpl,
            visits,
            visitCost,
            sales,
            revenue,
            roi,
            ctr,
            cpc,
            thumbnail: type === 'ad' ? node.creative?.thumbnail_url : undefined,
            children
        };
    };

    return fullHierarchy
        .map(campaign => processNode(campaign, 'campaign'))
        .filter(campaign => shouldShow(campaign.status, campaign.id, {
            spend: campaign.spend,
            leadsMeta: campaign.leadsMeta,
            visits: campaign.visits
        }));

    }, [fullHierarchy, filteredLeads, adInsights, showActiveOnly]);

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

  // Footer Totals Calculation
  const totalSpendKZT = processedData.reduce((sum, row) => sum + row.spendKZT, 0);
  const totalLeadsMeta = processedData.reduce((sum, row) => sum + row.leadsMeta, 0);
  const totalVisits = processedData.reduce((sum, row) => sum + row.visits, 0);
  const totalSales = processedData.reduce((sum, row) => sum + row.sales, 0);
  const totalRevenue = processedData.reduce((sum, row) => sum + row.revenue, 0);
  
  const totalCpl = totalLeadsMeta > 0 ? totalSpendKZT / totalLeadsMeta : 0;
  const totalVisitCost = totalVisits > 0 ? totalSpendKZT / totalVisits : 0;
  const totalRoi = totalSpendKZT > 0 ? (totalRevenue - totalSpendKZT) / totalSpendKZT * 100 : 0;
  
  // Unattributed Logic (Leads that exist in CRM date range but didn't match any campaign)
  // const allCrmLeadsCount = filteredLeads.length;
  // const unattributedLeads = Math.max(0, allCrmLeadsCount - totalVisits);

  const getSortIcon = (key: keyof RowData) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground/50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUpDown className="w-3 h-3 ml-1 text-primary" />
      : <ArrowUpDown className="w-3 h-3 ml-1 text-primary rotate-180" />;
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

          <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={handleForceSync} disabled={loading} className="hidden md:flex">
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Синхронизация
             </Button>

             <div className="flex items-center space-x-2 bg-muted/50 p-1.5 rounded-lg border border-border/50">
                <Switch
                    id="active-mode"
                    checked={showActiveOnly}
                    onCheckedChange={setShowActiveOnly}
                />
                <Label htmlFor="active-mode" className="text-xs font-medium cursor-pointer">
                    {showActiveOnly ? 'Только активные' : 'Все кампании'}
                </Label>
             </div>


          
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || visibleRows.length === 0}>
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
                   key === 'visits' ? 'Визиты' :
                   key === 'visitCost' ? 'Стоимость визита' :
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
                  Кампания
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
              {columnVisibility.visits && (
                <TableHead className="text-right min-w-[100px]">
                <Button variant="ghost" size="sm" onClick={() => handleSort('visits')} className="h-8 px-0 hover:bg-transparent font-bold text-blue-400">
                  Виз. (CRM)
                  {getSortIcon('visits')}
                </Button>
              </TableHead>
              )}
              {columnVisibility.visitCost && (
                <TableHead className="text-right text-blue-400">
                   <Button variant="ghost" size="sm" onClick={() => handleSort('visitCost')} className="h-8 px-0 hover:bg-transparent font-bold text-blue-400">
                    Стоимость визита
                    {getSortIcon('visitCost')}
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
                      {formatCurrency(row.spendKZT)}
                    </TableCell>
                  )}

                  {columnVisibility.leads && (
                    <TableCell className={cn(
                        "text-right tabular-nums font-mono text-sm",
                        row.status === 'ACTIVE' && row.leadsMeta === 0 && row.spendKZT > 2000 && "bg-red-500/20 text-red-500 font-bold"
                    )}>
                       {formatNumber(row.leadsMeta)}
                    </TableCell>
                  )}

                  {columnVisibility.cpl && (
                    <TableCell className="text-right tabular-nums font-mono text-sm text-muted-foreground">
                       {row.leadsMeta === 0 ? '0 ₸' : formatCurrency(row.cpl)}
                    </TableCell>
                  )}

                  {columnVisibility.visits && (
                    <TableCell className="text-right tabular-nums font-mono text-sm font-medium text-blue-400">
                       {row.visits > 0 ? formatNumber(row.visits) : '-'}
                    </TableCell>
                  )}

                  {columnVisibility.visitCost && (
                    <TableCell className="text-right tabular-nums font-mono text-sm text-blue-400/80">
                       {row.visitCost > 0 ? formatCurrency(row.visitCost) : '-'}
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

            {/* Totals Row */}
            {!loading && processedData.length > 0 && (
                <TableRow className="bg-muted/50 font-bold hover:bg-muted/50 border-t-2 border-border">
                    <TableCell>ИТОГО</TableCell>
                    {columnVisibility.status && <TableCell />}
                    {columnVisibility.spend && <TableCell className="text-right">{formatCurrency(totalSpendKZT)}</TableCell>}
                    {columnVisibility.leads && <TableCell className="text-right">{formatNumber(totalLeadsMeta)}</TableCell>}
                    {columnVisibility.cpl && <TableCell className="text-right">{formatCurrency(totalCpl)}</TableCell>}
                    {columnVisibility.visits && <TableCell className="text-right text-blue-400">{formatNumber(totalVisits)}</TableCell>}
                    {columnVisibility.visitCost && <TableCell className="text-right text-blue-400/80">{formatCurrency(totalVisitCost)}</TableCell>}
                    {columnVisibility.sales && <TableCell className="text-right text-emerald-400">{formatNumber(totalSales)}</TableCell>}
                    {columnVisibility.revenue && <TableCell className="text-right text-emerald-400">{formatCurrency(totalRevenue)}</TableCell>}
                    {columnVisibility.roi && <TableCell className="text-right">
                       <span className={cn(
                         totalRoi > 0 ? "text-emerald-500" : totalRoi < 0 ? "text-red-500" : "text-muted-foreground"
                       )}>
                         {totalRoi !== 0 ? formatPercent(totalRoi) : '-'}
                       </span>
                    </TableCell>}
                </TableRow>
            )}
            
            {/* Unattributed Row Removed per user request */}
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
