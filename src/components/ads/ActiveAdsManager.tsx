import { useState, useEffect, useMemo } from 'react';
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
  const [hierarchy, setHierarchy] = useState<Campaign[]>([]);
  const [adInsights, setAdInsights] = useState<Record<string, AdInsightRecord>>({});
  const [adAccountId, setAdAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
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
    if (!pid) return;

    const since = format(dateRange.from, 'yyyy-MM-dd');
    const until = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : since;

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

  // Stable key for dateRange to prevent unnecessary refetches
  const dateRangeKey = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return '';
    return `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`;
  }, [dateRange]);

  // Load local data from DB only — no Meta API auto-sync from UI.
  // Meta sync should be triggered server-side (Edge Function + cron).
  useEffect(() => {
    if (pid && dateRangeKey && dateRange?.from) {
      fetchHierarchy(false);
      fetchAdInsights();
    }
  }, [pid, dateRangeKey]);

  useEffect(() => {
    if (pid && refreshTrigger > 0) {
      fetchAdInsights();
    }
  }, [refreshTrigger]);

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

  const fetchHierarchy = async (forceApi = false) => {
    setLoading(true);
    try {
      // 0. Try Local DB First (if not forced) to save API calls
      if (!forceApi) {
        // 0.1 Try 'campaigns' table
        const { data: localCampaigns } = await (supabase as any)
          .from('campaigns')
          .select('*')
          .eq('project_id', pid)
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
          .eq('project_id', pid)
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

      const payload: any = { projectId: pid };

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
          .eq('project_id', pid)
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
      if (data.accountStatus) {
        setAccountStatus(data.accountStatus);
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

  // Pre-normalize lead UTM fields once to avoid 25K+ normalize calls in tree traversal
  const normalizedLeadUtms = useMemo(() => {
    return filteredLeads.map(l => ({
      lead: l,
      campaign: normalize(l.utm_campaign),
      term: normalize(l.utm_term),
      content: normalize(l.utm_content),
    }));
  }, [filteredLeads]);

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
      // Filter leads relevant to this node using pre-normalized UTM fields
      const normId = normalize(node.id);
      const normName = normalize(node.name);

      const matchedEntries = normalizedLeadUtms.filter(entry => {
        if (type === 'campaign') {
          if (!entry.lead.utm_campaign) return false;
          if (entry.lead.utm_campaign === node.id || entry.campaign === normName) return true;
          if (entry.campaign.length > 3 && normName.length > 3) {
            if (entry.campaign.includes(normName) || normName.includes(entry.campaign)) return true;
          }
          return false;
        } else if (type === 'adset') {
          if (!entry.lead.utm_term) return false;
          if (entry.lead.utm_term === node.id || entry.term === normName) return true;
          if (entry.term.length > 3 && normName.length > 3) {
            if (entry.term.includes(normName) || normName.includes(entry.term)) return true;
          }
          return false;
        } else if (type === 'ad') {
          if (!entry.lead.utm_content) return false;
          if (entry.lead.utm_content === node.id || entry.content === normName) return true;
          if (entry.content.length > 3 && normName.length > 3) {
            if (entry.content.includes(normName) || normName.includes(entry.content)) return true;
          }
          return false;
        }
        return false;
      });
      const nodeLeads = matchedEntries.map(e => e.lead);

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

  }, [fullHierarchy, normalizedLeadUtms, filteredLeads, adInsights, showActiveOnly]);

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
    <div className="space-y-6">
      <div className="interstellar-card relative overflow-hidden ring-1 ring-white/10">
        {/* Glow behind header */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />

        {/* Header toolbar */}
        <div className="relative p-4 md:p-5 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <LayoutDashboard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white/90">Active Ads Manager</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {accountStatus && accountStatus.account_status !== 1 ? (
                  <span className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                    accountStatus.account_status === 3
                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      accountStatus.account_status === 3
                        ? "bg-red-500 shadow-[0_0_5px_#ef4444]"
                        : "bg-amber-500 shadow-[0_0_5px_#f59e0b]"
                    )} />
                    {ACCOUNT_STATUS_MAP[accountStatus.account_status]?.label || 'Ошибка'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" />
                    Live Sync
                  </span>
                )}
                {adAccountId && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-white/60">
                    ID: {adAccountId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceSync}
              disabled={loading}
              className="hidden md:flex h-9 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Синхронизация
            </Button>

            <div className="flex items-center space-x-2 bg-black/40 p-1.5 rounded-lg border border-white/5 backdrop-blur-md">
              <Switch
                id="active-mode"
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Label htmlFor="active-mode" className="text-xs font-medium cursor-pointer text-white/80 pr-2">
                {showActiveOnly ? 'Только активные' : 'Все кампании'}
              </Label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={loading || visibleRows.length === 0}
              className="h-9 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Столбцы
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0B0C15] border-white/10 text-white/90">
                <DropdownMenuLabel>Видимость столбцов</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {Object.keys(columnVisibility).map(key => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={columnVisibility[key]}
                    onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [key]: checked }))}
                    className="focus:bg-white/10 focus:text-white"
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

        {/* Account Status Alert Banner */}
        {accountStatus && accountStatus.account_status !== 1 && (() => {
          const statusInfo = ACCOUNT_STATUS_MAP[accountStatus.account_status] || { label: `Неизвестный статус (${accountStatus.account_status})`, severity: 'warning' as const };
          const disableReason = accountStatus.disable_reason ? DISABLE_REASON_MAP[accountStatus.disable_reason] || '' : '';
          const isError = statusInfo.severity === 'error';

          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mx-4 md:mx-5 mt-3 p-4 rounded-xl border backdrop-blur-md flex items-start gap-3",
                isError
                  ? "bg-red-500/[0.08] border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                  : "bg-amber-500/[0.08] border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                isError ? "bg-red-500/20" : "bg-amber-500/20"
              )}>
                {accountStatus.account_status === 3 ? (
                  <CreditCard className={cn("w-5 h-5", isError ? "text-red-400" : "text-amber-400")} />
                ) : accountStatus.account_status === 2 ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : accountStatus.account_status >= 100 ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertTriangle className={cn("w-5 h-5", isError ? "text-red-400" : "text-amber-400")} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "text-sm font-bold",
                    isError ? "text-red-400" : "text-amber-400"
                  )}>
                    Статус кабинета: {statusInfo.label}
                  </span>
                  <span className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full",
                    isError ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                  )}>
                    code {accountStatus.account_status}
                  </span>
                </div>

                {disableReason && (
                  <p className="text-sm text-white/60 mt-1">
                    Причина: <span className="text-white/80 font-medium">{disableReason}</span>
                  </p>
                )}

                {accountStatus.account_status === 3 && (
                  <p className="text-sm text-white/50 mt-1.5">
                    Рекламные кампании приостановлены из-за ошибки оплаты. Проверьте способ оплаты в{' '}
                    <a
                      href="https://business.facebook.com/settings/payment-methods"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                    >
                      настройках платежей Facebook
                    </a>.
                  </p>
                )}

                {accountStatus.funding_source && (
                  <p className="text-xs text-white/30 mt-2 font-mono">
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
              <TableRow className="bg-white/[0.02] border-b border-white/5 hover:bg-white/[0.02]">
                <TableHead className="w-[350px] p-4 text-white/60 sticky left-0 bg-[#0B0C15] z-20 border-b border-white/5 ring-1 ring-white/5">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-8 -ml-3 hover:bg-white/5 font-bold text-white/90">
                    Кампания
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                {columnVisibility.status && (
                  <TableHead className="w-[100px] text-center p-4 text-white/60 border-b border-white/5">Статус</TableHead>
                )}
                {columnVisibility.spend && (
                  <TableHead className="text-right p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('spend')} className="h-8 px-0 hover:bg-white/5 font-bold text-white/90 hover:text-white">
                      Расходы
                      {getSortIcon('spend')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.leads && (
                  <TableHead className="text-right p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('leadsMeta')} className="h-8 px-0 hover:bg-white/5 font-bold text-white/90 hover:text-white">
                      Лиды
                      {getSortIcon('leadsMeta')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.cpl && (
                  <TableHead className="text-right p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('cpl')} className="h-8 px-0 hover:bg-white/5 font-bold text-white/90 hover:text-white">
                      CPL
                      {getSortIcon('cpl')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.visits && (
                  <TableHead className="text-right min-w-[100px] p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('visits')} className="h-8 px-0 hover:bg-white/5 font-bold text-blue-400 hover:text-blue-300">
                      Виз. (CRM)
                      {getSortIcon('visits')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.visitCost && (
                  <TableHead className="text-right p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('visitCost')} className="h-8 px-0 hover:bg-white/5 font-bold text-blue-400 hover:text-blue-300">
                      Цена виз.
                      {getSortIcon('visitCost')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.sales && (
                  <TableHead className="text-right p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('sales')} className="h-8 px-0 hover:bg-white/5 font-bold text-emerald-400 hover:text-emerald-300">
                      Продажи
                      {getSortIcon('sales')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.revenue && (
                  <TableHead className="text-right p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('revenue')} className="h-8 px-0 hover:bg-white/5 font-bold text-emerald-400 hover:text-emerald-300">
                      Выручка
                      {getSortIcon('revenue')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.roi && (
                  <TableHead className="text-right p-4 text-white/60 border-b border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('roi')} className="h-8 px-0 hover:bg-white/5 font-bold text-white/90 hover:text-white">
                      ROI
                      {getSortIcon('roi')}
                    </Button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/5">
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="p-3 rounded-full bg-white/5">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                      </div>
                      <span className="text-sm">Загрузка данных...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="h-40 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LayoutDashboard className="w-8 h-8 text-white/10" />
                      <span>Нет активных рекламных кампаний</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "group transition-colors",
                      row.type === 'campaign' ? "bg-white/[0.015] hover:bg-white/[0.03]" : "hover:bg-white/[0.02]",
                      "border-transparent"
                    )}
                  >
                    <TableCell className={cn(
                      "py-3 sticky left-0 z-10 border-r border-white/5 backdrop-blur-md",
                      row.type === 'campaign' ? "bg-[#0f1019] group-hover:bg-[#151622]" : "bg-[#0B0C15] group-hover:bg-[#12131e]"
                    )}>
                      <div
                        className="flex items-center gap-2 cursor-pointer select-none pl-2"
                        style={{ paddingLeft: `${(row.level * 24) + 8}px` }}
                        onClick={() => row.children && row.children.length > 0 && toggleRow(row.id)}
                      >
                        {row.children && row.children.length > 0 ? (
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-colors",
                            expandedRows.has(row.id) ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white/80"
                          )}>
                            <ChevronRight className={cn(
                              "w-3.5 h-3.5 transition-transform duration-200",
                              expandedRows.has(row.id) && "rotate-90"
                            )} />
                          </div>
                        ) : (
                          <div className="w-5 h-5" />
                        )}

                        <div className="relative shrink-0">
                          {row.type === 'ad' && row.thumbnail ? (
                            <img src={row.thumbnail} alt="" className="w-8 h-8 rounded object-cover border border-white/10" />
                          ) : (
                            <div className={cn(
                              "w-2 h-2 rounded-full ring-2 ring-black",
                              row.status === 'ACTIVE' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/20"
                            )} />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0 group/name relative">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "truncate max-w-[180px] md:max-w-[280px] text-sm",
                              row.level === 0 ? "font-bold text-white/90" : "font-medium text-white/70"
                            )} title={row.name}>
                              {row.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover/name:opacity-100 transition-opacity hover:bg-white/10 hover:text-white"
                              onClick={(e) => openEditDialog(row, e)}
                            >
                              <Pencil className="w-3 h-3 text-white/40" />
                            </Button>
                          </div>
                          <span className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1 font-mono">
                            {row.type}
                            <span className="opacity-30">•</span>
                            {row.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {columnVisibility.status && (
                      <TableCell className="text-center p-2">
                        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                          {toggling === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                          ) : (
                            <Switch
                              checked={row.status === 'ACTIVE'}
                              onCheckedChange={(checked) => handleToggleStatus(row.id, row.status, { stopPropagation: () => { } } as any)}
                              className={cn(
                                "data-[state=checked]:bg-emerald-500 border-white/10 bg-white/5",
                                row.status !== 'ACTIVE' && "opacity-60"
                              )}
                            />
                          )}
                        </div>
                      </TableCell>
                    )}

                    {columnVisibility.spend && (
                      <TableCell className="text-right tabular-nums font-mono text-sm text-white/80 p-3">
                        {formatCurrency(row.spendKZT)}
                      </TableCell>
                    )}

                    {columnVisibility.leads && (
                      <TableCell className={cn(
                        "text-right tabular-nums font-mono text-sm p-3",
                        row.status === 'ACTIVE' && row.leadsMeta === 0 && row.spendKZT > 2000
                          ? "bg-red-500/10 text-red-400 font-bold border-l-2 border-red-500"
                          : "text-white/90 font-semibold"
                      )}>
                        {formatNumber(row.leadsMeta)}
                      </TableCell>
                    )}

                    {columnVisibility.cpl && (
                      <TableCell className="text-right tabular-nums font-mono text-sm text-white/50 p-3">
                        {row.leadsMeta === 0 ? '—' : formatCurrency(row.cpl)}
                      </TableCell>
                    )}

                    {columnVisibility.visits && (
                      <TableCell className="text-right tabular-nums font-mono text-sm font-medium text-blue-400 p-3">
                        {row.visits > 0 ? formatNumber(row.visits) : <span className="text-white/10">-</span>}
                      </TableCell>
                    )}

                    {columnVisibility.visitCost && (
                      <TableCell className="text-right tabular-nums font-mono text-sm text-blue-400/70 p-3">
                        {row.visitCost > 0 ? formatCurrency(row.visitCost) : <span className="text-white/10">-</span>}
                      </TableCell>
                    )}

                    {columnVisibility.sales && (
                      <TableCell className="text-right tabular-nums font-mono text-sm font-medium text-emerald-400 p-3">
                        {row.sales > 0 ? formatNumber(row.sales) : <span className="text-white/10">-</span>}
                      </TableCell>
                    )}

                    {columnVisibility.revenue && (
                      <TableCell className="text-right tabular-nums font-mono text-sm text-emerald-400 font-bold p-3">
                        {row.revenue > 0 ? formatCurrency(row.revenue) : <span className="text-white/10">-</span>}
                      </TableCell>
                    )}

                    {columnVisibility.roi && (
                      <TableCell className="text-right tabular-nums font-mono text-sm p-3">
                        <span className={cn(
                          row.roi > 0 ? "text-emerald-400" : row.roi < 0 ? "text-red-400" : "text-white/30"
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
                <TableRow className="bg-[#0B0C15] font-bold border-t border-white/10 hover:bg-[#0B0C15] sticky bottom-0 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                  <TableCell className="sticky left-0 bg-[#0B0C15] border-r border-white/5 p-4 text-xs uppercase tracking-widest text-white/50">ИТОГО</TableCell>
                  {columnVisibility.status && <TableCell />}
                  {columnVisibility.spend && <TableCell className="text-right p-3 text-white">{formatCurrency(totalSpendKZT)}</TableCell>}
                  {columnVisibility.leads && <TableCell className="text-right p-3 text-white">{formatNumber(totalLeadsMeta)}</TableCell>}
                  {columnVisibility.cpl && <TableCell className="text-right p-3 text-white/70">{formatCurrency(totalCpl)}</TableCell>}
                  {columnVisibility.visits && <TableCell className="text-right p-3 text-blue-400">{formatNumber(totalVisits)}</TableCell>}
                  {columnVisibility.visitCost && <TableCell className="text-right p-3 text-blue-400/70">{formatCurrency(totalVisitCost)}</TableCell>}
                  {columnVisibility.sales && <TableCell className="text-right p-3 text-emerald-400">{formatNumber(totalSales)}</TableCell>}
                  {columnVisibility.revenue && <TableCell className="text-right p-3 text-emerald-400 font-bold text-base shadow-[0_0_15px_rgba(16,185,129,0.2)]">{formatCurrency(totalRevenue)}</TableCell>}
                  {columnVisibility.roi && <TableCell className="text-right p-3">
                    <span className={cn(
                      totalRoi > 0 ? "text-emerald-400" : totalRoi < 0 ? "text-red-400" : "text-white/30"
                    )}>
                      {totalRoi !== 0 ? formatPercent(totalRoi) : '-'}
                    </span>
                  </TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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
