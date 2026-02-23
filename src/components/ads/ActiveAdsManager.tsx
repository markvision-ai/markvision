import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useLeads } from '@/hooks/useLeads';
import {
  Loader2,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
  Settings2,
  LayoutDashboard,
  Download,
  Pencil,
  AlertTriangle,
  XCircle,
  CreditCard,
  ShieldAlert
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
  effective_status?: string;
  insights?: { data: MetaInsight[] };
  creative?: { thumbnail_url?: string };
}

interface AdSet {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  effective_status?: string;
  insights?: { data: MetaInsight[] };
  ads?: { data: Ad[] };
}

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  effective_status?: string;
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

interface AccountStatus {
  account_status: number;
  disable_reason: number;
  name?: string;
  currency?: string;
  balance?: string;
  amount_spent?: string;
  funding_source?: string | null;
  funding_type?: number | null;
}

// Facebook account_status codes
const ACCOUNT_STATUS_MAP: Record<number, { label: string; severity: 'ok' | 'warning' | 'error' }> = {
  1: { label: 'Активен', severity: 'ok' },
  2: { label: 'Отключён', severity: 'error' },
  3: { label: 'Проблема с оплатой', severity: 'error' },
  7: { label: 'На проверке (риски)', severity: 'warning' },
  8: { label: 'Ожидание расчёта', severity: 'warning' },
  9: { label: 'Льготный период', severity: 'warning' },
  100: { label: 'Закрытие в процессе', severity: 'error' },
  101: { label: 'Закрыт', severity: 'error' },
};

const DISABLE_REASON_MAP: Record<number, string> = {
  0: '',
  1: 'Нарушение рекламной политики',
  2: 'Проверка IP рекламы',
  3: 'Проблема с оплатой (риск платежа)',
  4: 'Аккаунт заблокирован',
  5: 'Проверка AFC рекламы',
  6: 'Нарушение бизнес-целостности',
  7: 'Аккаунт закрыт навсегда',
  8: 'Неиспользуемый реселлерский аккаунт',
  9: 'Неиспользуемый аккаунт',
};

export const ActiveAdsManager = ({ projectId, dateRange, refreshTrigger = 0 }: ActiveAdsManagerProps) => {
  const pid = projectId ?? null;
  const { leads } = useLeads(pid);

  // Stable ref for dateRange to prevent callback re-creation
  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;

  const [hierarchy, setHierarchy] = useState<Campaign[]>([]);
  const [adInsights, setAdInsights] = useState<Record<string, AdInsightRecord>>({});
  const [adAccountId, setAdAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'adsets' | 'ads'>('campaigns');
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [selectedAdsets, setSelectedAdsets] = useState<Set<string>>(new Set());
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
          status: 'PAUSED', // Default to PAUSED for derived items
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
        status: 'PAUSED',
        daily_budget: '0',
        insights: { data: [] },
        adsets: { data: [] }
      });
    });

    return [...hierarchy, ...derived];
  }, [hierarchy, filteredLeads, adInsights]);


  const fetchAdInsights = useCallback(async () => {
    const dr = dateRangeRef.current;
    if (!pid || !dr?.from) return;

    const since = format(dr.from, 'yyyy-MM-dd');
    const until = dr.to ? format(dr.to, 'yyyy-MM-dd') : since;

    try {
      const { data, error } = await (supabase as any)
        .from('ad_performance_logs')
        .select('*')
        .eq('project_id', pid)
        .gte('date_start', since)
        .lte('date_start', until);

      if (error) throw error;

      const insightsMap: Record<string, AdInsightRecord> = {};

      // Deduplicate logs: keep only the latest entry per (entity_id, date_start)
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
  }, [pid]); // Only depends on pid, reads dateRange from ref

  // Circuit Breaker for Rate Limits
  const [rateLimitUntil, setRateLimitUntil] = useState<number>(0);

  const fetchHierarchy = useCallback(async (forceApi = false) => {
    setLoading(true);
    try {
      // Always fetch from Meta API to get real statuses.
      // Local DB is only used as a fallback when API fails.

      const payload: any = { projectId: pid };

      const dr = dateRangeRef.current;
      if (dr?.from && dr?.to) {
        payload.date_range = {
          since: format(dr.from, 'yyyy-MM-dd'),
          until: format(dr.to, 'yyyy-MM-dd')
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
          console.warn('Using local fallback due to API error');
        }

        // FETCH FALLBACK FROM DB (campaigns table)
        let fallbackHierarchy: Campaign[] = [];

        // 1. Try 'campaigns' table (structure source)
        const { data: localCampaigns } = await (supabase as any)
          .from('campaigns')
          .select('*')
          .eq('project_id', pid)
          .order('created_at', { ascending: false });

        if (localCampaigns && localCampaigns.length > 0) {
          fallbackHierarchy = localCampaigns.map((c: any) => ({
            id: c.external_id || c.id,
            name: c.name,
            status: (c.status === 'ACTIVE' || c.status === true || c.status === 1) ? 'ACTIVE' : (c.status === 'PAUSED' ? 'PAUSED' : (c.status ? String(c.status).toUpperCase() : 'ACTIVE')),
            daily_budget: c.budget ? c.budget.toString() : '0',
            insights: { data: [] },
            adsets: { data: [] }
          }));
        } else {
          // 2. Try 'ad_performance_logs' (data source)
          const { data: logs } = await (supabase as any)
            .from('ad_performance_logs')
            .select('entity_id, entity_name, spend')
            .eq('project_id', projectId) // Use projectId from scope or pid
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
            fallbackHierarchy = Array.from(uniqueMap.values()) as Campaign[];
          }
        }

        if (fallbackHierarchy.length > 0) {
          setHierarchy(fallbackHierarchy);
        }
        return;
      }

      // Success Path
      const apiData = data.data || [];
      setHierarchy(apiData);

      // Auto-expand ALL campaigns and adsets to show full hierarchy
      const allIds = new Set<string>();
      const collectIds = (nodes: any[]) => {
        nodes.forEach((n: any) => {
          allIds.add(n.id);
          if (n.adsets?.data) collectIds(n.adsets.data);
          if (n.ads?.data) collectIds(n.ads.data);
        });
      };
      collectIds(apiData);
      setExpandedRows(allIds);

      if (data.adAccountId) {
        setAdAccountId(data.adAccountId);
      }
      if (data.accountStatus) {
        setAccountStatus(data.accountStatus);
      }
    } catch (e: any) {
      console.error('Failed to fetch ads hierarchy', e);
      toast.error(`Ошибка загрузки структуры рекламы: ${e.message || 'Неизвестная ошибка'}`);
    } finally {
      setLoading(false);
    }
  }, [pid, projectId]); // Only depends on pid/projectId, reads dateRange from ref



  // Stable key for dateRange to prevent unnecessary refetches
  const dateRangeKey = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return '';
    return `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`;
  }, [dateRange]);

  useEffect(() => {
    if (pid && dateRangeKey && dateRange?.from) {
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
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;

      // Use a unique key for this specific date range
      const lastSyncKey = `ads_sync_${pid}_${fromStr}_${toStr}`;
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
              projectId: pid,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, dateRangeKey, rateLimitUntil]); // Stable deps only — callbacks use refs internally

  useEffect(() => {
    if (pid && refreshTrigger > 0) {
      if (Date.now() < rateLimitUntil) {
        console.warn('Meta API sync skipped due to Rate Limit.');
        return;
      }
      // ONLY fetch from DB to avoid hitting Meta API limits
      fetchAdInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, rateLimitUntil, pid]);

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
            projectId: pid,
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

  // Added projectId because it was used in fallback logging (line 621 in original)

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
        if (node.id === id) return { ...node, status, effective_status: status };
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

      // When "Только активные" is ON — show ONLY campaigns with ACTIVE status from Meta
      if (showActiveOnly && status !== 'ACTIVE') return false;

      // When "Все кампании" — show everything (including paused)
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

      // Use effective_status from Meta API if available, fallback to status
      const effectiveStatus = node.effective_status || node.status;

      return {
        id: node.id,
        type,
        name: node.name,
        status: effectiveStatus,
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

  // Flatten for rendering — respects activeTab
  const flattenRows = useCallback((nodes: RowData[], level = 0): (RowData & { level: number })[] => {
    let result: (RowData & { level: number })[] = [];
    nodes.forEach(node => {
      result.push({ ...node, level });
      if (expandedRows.has(node.id) && node.children) {
        result = result.concat(flattenRows(node.children, level + 1));
      }
    });
    return result;
  }, [expandedRows]);

  // Flatten ALL rows with parent tracking (for adsets/ads tabs)
  const flattenAllWithParent = useCallback((nodes: RowData[], parentCampaignId?: string, parentAdsetId?: string): (RowData & { level: number; parentCampaignId?: string; parentAdsetId?: string })[] => {
    let result: (RowData & { level: number; parentCampaignId?: string; parentAdsetId?: string })[] = [];
    nodes.forEach(node => {
      const campId = node.type === 'campaign' ? node.id : parentCampaignId;
      const adsetId = node.type === 'adset' ? node.id : parentAdsetId;
      result.push({ ...node, level: 0, parentCampaignId: campId, parentAdsetId: adsetId });
      if (node.children) {
        result = result.concat(flattenAllWithParent(node.children, campId, adsetId));
      }
    });
    return result;
  }, []);

  // Selection helpers
  const toggleCampaignSelection = useCallback((id: string) => {
    setSelectedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAdsetSelection = useCallback((id: string) => {
    setSelectedAdsets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleRowSelection = useCallback((row: RowData & { level: number; parentCampaignId?: string; parentAdsetId?: string }) => {
    if (activeTab === 'campaigns') {
      if (row.type === 'campaign') toggleCampaignSelection(row.id);
    } else if (activeTab === 'adsets') {
      toggleAdsetSelection(row.id);
    }
    // ads tab — no selection needed (it's the leaf level)
  }, [activeTab, toggleCampaignSelection, toggleAdsetSelection]);

  const isRowSelected = useCallback((row: RowData) => {
    if (activeTab === 'campaigns') return selectedCampaigns.has(row.id);
    if (activeTab === 'adsets') return selectedAdsets.has(row.id);
    return false;
  }, [activeTab, selectedCampaigns, selectedAdsets]);

  const visibleRows = useMemo(() => {
    const allRows = flattenAllWithParent(sortedData);

    if (activeTab === 'campaigns') {
      // FLAT list of campaigns only — no children
      return allRows.filter(r => r.type === 'campaign');
    } else if (activeTab === 'adsets') {
      // Show adsets belonging to selected campaigns (or all if none selected)
      const adsetRows = allRows.filter(r => r.type === 'adset');
      if (selectedCampaigns.size === 0) return adsetRows;
      return adsetRows.filter(r => r.parentCampaignId && selectedCampaigns.has(r.parentCampaignId));
    } else {
      // Show ads belonging to selected adsets (or selected campaigns if no adsets selected, or all)
      const adRows = allRows.filter(r => r.type === 'ad');
      if (selectedAdsets.size > 0) {
        return adRows.filter(r => r.parentAdsetId && selectedAdsets.has(r.parentAdsetId));
      }
      if (selectedCampaigns.size > 0) {
        return adRows.filter(r => r.parentCampaignId && selectedCampaigns.has(r.parentCampaignId));
      }
      return adRows;
    }
  }, [sortedData, flattenAllWithParent, activeTab, selectedCampaigns, selectedAdsets]);

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
        projectId: pid,
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

  if (!pid) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground">
        Выберите проект, чтобы открыть менеджер рекламы.
      </div>
    );
  }


  return (
    <div className="space-y-0">
      <div className="border border-[#dddfe2] bg-white rounded-lg overflow-hidden">
        {/* Meta-style Top Bar */}
        <div className="px-4 py-3 border-b border-[#dddfe2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-[#1c1e21]">Кампании</h2>
            <div className="flex items-center gap-2 text-xs">
              {accountStatus && accountStatus.account_status !== 1 ? (
                <span className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
                  accountStatus.account_status === 3
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                )}>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    accountStatus.account_status === 3 ? "bg-red-500" : "bg-amber-500"
                  )} />
                  {ACCOUNT_STATUS_MAP[accountStatus.account_status]?.label || 'Ошибка'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e7f3ef] text-[#1a7f37] text-xs font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#31a24c]" />
                  META ONLINE
                </span>
              )}
              {adAccountId && (
                <span className="px-2 py-1 rounded-md bg-[#f0f2f5] text-[#65676b] font-mono text-[11px]">
                  {adAccountId}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSync}
              disabled={loading}
              className="h-8 text-xs border-[#dddfe2] text-[#1c1e21] hover:bg-[#f0f2f5] bg-white rounded-md"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
              Обновить
            </Button>
          </div>
        </div>

        {/* Meta-style 3-Level Tab Navigation with selection badges */}
        <div className="border-b border-[#dddfe2] bg-[#f0f2f5]">
          <div className="flex">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-[14px] font-semibold border-b-[3px] transition-colors",
                activeTab === 'campaigns'
                  ? "border-[#1b74e4] text-[#1b74e4] bg-white"
                  : "border-transparent text-[#65676b] hover:bg-[#e4e6eb]"
              )}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><path d="M2 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm7 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zM2 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3zm7 0a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" /></svg>
              Кампании
              {selectedCampaigns.size > 0 && (
                <span className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-[#1b74e4] text-white text-[11px] font-bold">
                  {selectedCampaigns.size} выбрано
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCampaigns(new Set()); setSelectedAdsets(new Set()); }}
                    className="ml-0.5 hover:bg-white/20 rounded-full w-3.5 h-3.5 flex items-center justify-center"
                  >✕</button>
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('adsets')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-[14px] font-semibold border-b-[3px] transition-colors",
                activeTab === 'adsets'
                  ? "border-[#1b74e4] text-[#1b74e4] bg-white"
                  : "border-transparent text-[#65676b] hover:bg-[#e4e6eb]"
              )}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zM9 2.5A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zM1 10.5A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zM9 10.5A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" /></svg>
              Группы объяв.
              {selectedAdsets.size > 0 && (
                <span className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-[#1b74e4] text-white text-[11px] font-bold">
                  {selectedAdsets.size} выбрано
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedAdsets(new Set()); }}
                    className="ml-0.5 hover:bg-white/20 rounded-full w-3.5 h-3.5 flex items-center justify-center"
                  >✕</button>
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-[14px] font-semibold border-b-[3px] transition-colors",
                activeTab === 'ads'
                  ? "border-[#1b74e4] text-[#1b74e4] bg-white"
                  : "border-transparent text-[#65676b] hover:bg-[#e4e6eb]"
              )}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor"><path d="M2 2a1 1 0 011-1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2zm2 1v4h8V3H4zm0 6v4h8V9H4z" /></svg>
              Объявления
            </button>
          </div>
        </div>

        {/* Toolbar: Filter + Actions */}
        <div className="px-4 py-2 border-b border-[#dddfe2] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowActiveOnly(false)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                !showActiveOnly
                  ? "bg-[#1b74e4] text-white"
                  : "text-[#1c1e21] hover:bg-[#f0f2f5] border border-[#dddfe2]"
              )}
            >
              Все
            </button>
            <button
              onClick={() => setShowActiveOnly(true)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                showActiveOnly
                  ? "bg-[#31a24c] text-white"
                  : "text-[#1c1e21] hover:bg-[#f0f2f5] border border-[#dddfe2]"
              )}
            >
              Активные
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={loading || visibleRows.length === 0}
              className="h-7 text-xs border-[#dddfe2] text-[#65676b] hover:bg-[#f0f2f5] bg-white rounded-md"
            >
              <Download className="w-3 h-3 mr-1" />
              CSV
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs border-[#dddfe2] text-[#65676b] hover:bg-[#f0f2f5] bg-white rounded-md">
                  <Settings2 className="w-3 h-3 mr-1" />
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

        {accountStatus && accountStatus.account_status !== 1 && (() => {
          const statusInfo = ACCOUNT_STATUS_MAP[accountStatus.account_status] || { label: `Неизвестный статус (${accountStatus.account_status})`, severity: 'warning' as const };
          const disableReason = accountStatus.disable_reason ? DISABLE_REASON_MAP[accountStatus.disable_reason] || '' : '';
          const isError = statusInfo.severity === 'error';

          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mx-4 md:mx-5 mt-3 p-4 rounded-xl border flex items-start gap-3",
                isError
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                isError ? "bg-red-100" : "bg-amber-100"
              )}>
                {accountStatus.account_status === 3 ? (
                  <CreditCard className={cn("w-5 h-5", isError ? "text-red-600" : "text-amber-600")} />
                ) : accountStatus.account_status === 2 ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : accountStatus.account_status >= 100 ? (
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                ) : (
                  <AlertTriangle className={cn("w-5 h-5", isError ? "text-red-600" : "text-amber-600")} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "text-sm font-bold",
                    isError ? "text-red-700" : "text-amber-700"
                  )}>
                    Статус кабинета: {statusInfo.label}
                  </span>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full",
                    isError ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                  )}>
                    code {accountStatus.account_status}
                  </span>
                </div>

                {disableReason && (
                  <p className="text-sm text-foreground/80 mt-1">
                    Причина: <span className="text-foreground font-medium">{disableReason}</span>
                  </p>
                )}

                {accountStatus.account_status === 3 && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Рекламные кампании приостановлены из-за ошибки оплаты. Проверьте способ оплаты в{' '}
                    <a
                      href="https://business.facebook.com/settings/payment-methods"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline underline-offset-2"
                    >
                      настройках платежей Facebook
                    </a>.
                  </p>
                )}

                {accountStatus.funding_source && (
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Способ оплаты: {accountStatus.funding_source}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })()}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f0f2f5] border-b border-[#dddfe2] hover:bg-[#f0f2f5]">
                <TableHead className="w-[40px] p-2 text-center">
                  <input
                    type="checkbox"
                    className="w-[15px] h-[15px] rounded border-[#ccd0d5] accent-[#1b74e4] cursor-pointer"
                    checked={visibleRows.length > 0 && visibleRows.filter(r => activeTab === 'campaigns' ? r.type === 'campaign' : true).every(r => isRowSelected(r))}
                    onChange={() => {
                      const relevantRows = visibleRows.filter(r => activeTab === 'campaigns' ? r.type === 'campaign' : true);
                      const allSelected = relevantRows.every(r => isRowSelected(r));
                      if (activeTab === 'campaigns') {
                        if (allSelected) {
                          setSelectedCampaigns(new Set());
                        } else {
                          setSelectedCampaigns(new Set(relevantRows.filter(r => r.type === 'campaign').map(r => r.id)));
                        }
                      } else if (activeTab === 'adsets') {
                        if (allSelected) {
                          setSelectedAdsets(new Set());
                        } else {
                          setSelectedAdsets(new Set(relevantRows.map(r => r.id)));
                        }
                      }
                    }}
                  />
                </TableHead>
                {columnVisibility.status && (
                  <TableHead className="w-[50px] text-center p-2 text-[#65676b] text-[11px] font-semibold uppercase">Вкл.</TableHead>
                )}
                <TableHead className="min-w-[250px] p-2">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-7 -ml-2 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                    {activeTab === 'campaigns' ? 'Кампания' : activeTab === 'adsets' ? 'Группа объявлений' : 'Объявление'} ↕
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px] p-2 text-[#65676b] text-[11px] font-semibold uppercase">
                  Статус показа
                </TableHead>
                {columnVisibility.spend && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('spend')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      Расходы {getSortIcon('spend')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.leads && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('leadsMeta')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      Лиды {getSortIcon('leadsMeta')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.cpl && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('cpl')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      CPL {getSortIcon('cpl')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.visits && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('visits')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      Визиты {getSortIcon('visits')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.visitCost && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('visitCost')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      Цена виз. {getSortIcon('visitCost')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.sales && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('sales')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      Продажи {getSortIcon('sales')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.revenue && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('revenue')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      Выручка {getSortIcon('revenue')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.roi && (
                  <TableHead className="text-right p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('roi')} className="h-7 px-1 hover:bg-[#e4e6eb] text-[#65676b] text-[11px] font-semibold uppercase">
                      ROI {getSortIcon('roi')}
                    </Button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={12} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-[#65676b]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#1b74e4]" />
                      <span className="text-[13px]">Загрузка данных...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={12} className="h-40 text-center text-[#65676b]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LayoutDashboard className="w-8 h-8 text-[#bec3c9]" />
                      <span className="text-[13px]">Нет рекламных кампаний</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-b border-[#dddfe2] transition-colors group",
                      isRowSelected(row) ? "bg-[#e7f3ff] hover:bg-[#dbeafe]" : "bg-white hover:bg-[#f5f6f7]"
                    )}
                  >
                    {/* Checkbox */}
                    <TableCell className="w-[40px] p-2 text-center">
                      <input
                        type="checkbox"
                        className="w-[15px] h-[15px] rounded border-[#ccd0d5] accent-[#1b74e4] cursor-pointer"
                        checked={isRowSelected(row)}
                        onChange={() => toggleRowSelection(row as any)}
                      />
                    </TableCell>

                    {/* Toggle ON/OFF */}
                    {columnVisibility.status && (
                      <TableCell className="w-[50px] text-center p-2">
                        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                          {toggling === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#65676b]" />
                          ) : (
                            <Switch
                              checked={row.status === 'ACTIVE'}
                              onCheckedChange={() => handleToggleStatus(row.id, row.status, { stopPropagation: () => { } } as any)}
                              className={cn(
                                "scale-[0.8] data-[state=checked]:bg-[#31a24c]",
                                row.status !== 'ACTIVE' && "opacity-60"
                              )}
                            />
                          )}
                        </div>
                      </TableCell>
                    )}

                    {/* Entity Name — flat, no expand arrows */}
                    <TableCell className="py-2.5 px-2">
                      <div className="flex items-center gap-2 select-none">
                        {row.type === 'ad' && row.thumbnail ? (
                          <img src={row.thumbnail} alt="" className="w-8 h-8 rounded object-cover border border-[#dddfe2]" />
                        ) : (
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            row.status === 'ACTIVE' ? "bg-[#31a24c]" : "bg-[#bec3c9]"
                          )} />
                        )}

                        <div className="flex flex-col min-w-0 group/name">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[200px] md:max-w-[300px] text-[13px] font-semibold text-[#1c1e21]" title={row.name}>
                              {row.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover/name:opacity-100 transition-opacity hover:bg-[#e4e6eb]"
                              onClick={(e) => openEditDialog(row, e)}
                            >
                              <Pencil className="w-2.5 h-2.5 text-[#65676b]" />
                            </Button>
                          </div>
                          <span className="text-[11px] text-[#65676b] uppercase tracking-wider">
                            {row.type === 'campaign' ? 'CAMPAIGN' : row.type === 'adset' ? 'AD SET' : 'AD'} · {row.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Status with dot + text */}
                    <TableCell className="p-2">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          row.status === 'ACTIVE' ? "bg-[#31a24c]" : "bg-[#bec3c9]"
                        )} />
                        <span className={cn(
                          "text-[13px]",
                          row.status === 'ACTIVE' ? "text-[#1c1e21]" : "text-[#65676b]"
                        )}>
                          {row.status === 'ACTIVE' ? 'Активно' : 'Выключено'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Metrics columns */}
                    {columnVisibility.spend && (
                      <TableCell className="text-right tabular-nums text-[13px] text-[#1c1e21] p-2">
                        {formatCurrency(row.spendKZT)}
                      </TableCell>
                    )}
                    {columnVisibility.leads && (
                      <TableCell className={cn(
                        "text-right tabular-nums text-[13px] p-2",
                        row.status === 'ACTIVE' && row.leadsMeta === 0 && row.spendKZT > 2000
                          ? "text-red-600 font-semibold"
                          : "text-[#1c1e21] font-medium"
                      )}>
                        {formatNumber(row.leadsMeta)}
                      </TableCell>
                    )}
                    {columnVisibility.cpl && (
                      <TableCell className="text-right tabular-nums text-[13px] text-[#65676b] p-2">
                        {row.leadsMeta === 0 ? '—' : formatCurrency(row.cpl)}
                      </TableCell>
                    )}
                    {columnVisibility.visits && (
                      <TableCell className="text-right tabular-nums text-[13px] text-[#1b74e4] font-medium p-2">
                        {row.visits > 0 ? formatNumber(row.visits) : <span className="text-[#bec3c9]">—</span>}
                      </TableCell>
                    )}
                    {columnVisibility.visitCost && (
                      <TableCell className="text-right tabular-nums text-[13px] text-[#65676b] p-2">
                        {row.visitCost > 0 ? formatCurrency(row.visitCost) : <span className="text-[#bec3c9]">—</span>}
                      </TableCell>
                    )}
                    {columnVisibility.sales && (
                      <TableCell className="text-right tabular-nums text-[13px] text-[#1a7f37] font-medium p-2">
                        {row.sales > 0 ? formatNumber(row.sales) : <span className="text-[#bec3c9]">—</span>}
                      </TableCell>
                    )}
                    {columnVisibility.revenue && (
                      <TableCell className="text-right tabular-nums text-[13px] text-[#1a7f37] font-semibold p-2">
                        {row.revenue > 0 ? formatCurrency(row.revenue) : <span className="text-[#bec3c9]">—</span>}
                      </TableCell>
                    )}
                    {columnVisibility.roi && (
                      <TableCell className="text-right tabular-nums text-[13px] p-2">
                        <span className={cn(
                          row.roi > 0 ? "text-[#1a7f37]" : row.roi < 0 ? "text-red-500" : "text-[#bec3c9]"
                        )}>
                          {row.roi !== 0 ? formatPercent(row.roi) : '—'}
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}

              {/* Totals Row */}
              {!loading && processedData.length > 0 && (
                <TableRow className="bg-[#f0f2f5] font-semibold border-t-2 border-[#dddfe2] hover:bg-[#f0f2f5]">
                  <TableCell className="p-2" /> {/* checkbox */}
                  {columnVisibility.status && <TableCell className="p-2" />} {/* toggle */}
                  <TableCell className="p-3 text-[11px] uppercase tracking-widest text-[#65676b] font-bold">Итого</TableCell>
                  <TableCell /> {/* status */}
                  {columnVisibility.spend && <TableCell className="text-right p-2 text-[13px] text-[#1c1e21] font-bold">{formatCurrency(totalSpendKZT)}</TableCell>}
                  {columnVisibility.leads && <TableCell className="text-right p-2 text-[13px] text-[#1c1e21] font-bold">{formatNumber(totalLeadsMeta)}</TableCell>}
                  {columnVisibility.cpl && <TableCell className="text-right p-2 text-[13px] text-[#65676b]">{formatCurrency(totalCpl)}</TableCell>}
                  {columnVisibility.visits && <TableCell className="text-right p-2 text-[13px] text-[#1b74e4] font-bold">{formatNumber(totalVisits)}</TableCell>}
                  {columnVisibility.visitCost && <TableCell className="text-right p-2 text-[13px] text-[#65676b]">{formatCurrency(totalVisitCost)}</TableCell>}
                  {columnVisibility.sales && <TableCell className="text-right p-2 text-[13px] text-[#1a7f37] font-bold">{formatNumber(totalSales)}</TableCell>}
                  {columnVisibility.revenue && <TableCell className="text-right p-2 text-[13px] text-[#1a7f37] font-bold">{formatCurrency(totalRevenue)}</TableCell>}
                  {columnVisibility.roi && <TableCell className="text-right p-2 text-[13px]">
                    <span className={cn(
                      totalRoi > 0 ? "text-[#1a7f37] font-bold" : totalRoi < 0 ? "text-red-500 font-bold" : "text-[#bec3c9]"
                    )}>
                      {totalRoi !== 0 ? formatPercent(totalRoi) : '—'}
                    </span>
                  </TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Meta-style Footer: entity count based on active tab */}
        {!loading && processedData.length > 0 && (
          <div className="px-4 py-3 border-t border-[#dddfe2] bg-white">
            <span className="text-[13px] text-[#65676b]">
              Результаты {visibleRows.length} {activeTab === 'campaigns' ? 'кампаний' : activeTab === 'adsets' ? 'групп объявлений' : 'объявлений'}
            </span>
          </div>
        )}
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
