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
  ShieldAlert,
  Activity,
  Zap,
  ArrowUpRight,
  DollarSign
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

import { format, subDays, differenceInCalendarDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

const COLUMN_LABELS: Record<string, string> = {
  status: 'Сигнал',
  spend: 'Затраты',
  leads: 'Лиды (Meta)',
  cpl: 'Цена цели',
  visits: 'Визиты CRM',
  visitCost: 'Цена визита',
  sales: 'Продажи',
  revenue: 'Выручка',
  roi: 'ROMI'
};

const ACCOUNT_STATUS_MAP: Record<number, { label: string; color: string }> = {
  1: { label: 'АКТИВЕН', color: 'bg-green-500' },
  2: { label: 'ОТКЛЮЧЕН', color: 'bg-red-500' },
  3: { label: 'В ОЧЕРЕДИ', color: 'bg-amber-500' },
  7: { label: 'ПРОВЕРКА', color: 'bg-blue-500' },
  8: { label: 'ОГРАНИЧЕН', color: 'bg-red-500' }, // Correct status for restricted
};

const DISABLE_REASON_MAP: Record<number, string> = {
  0: 'NONE',
  1: 'ADS_INTEGRITY_POLICY',
  2: 'ADS_IP_REVIEW',
  3: 'RISK_PAYMENT',
  4: 'GRAY_ACCOUNT_SHUT_DOWN',
  5: 'ADS_OFF_BOARDING',
  6: 'OVER_QUOTA',
};

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

// Constants moved to top for organization

export const ActiveAdsManager = ({ projectId, dateRange, refreshTrigger = 0 }: ActiveAdsManagerProps) => {
  const pid = projectId ?? null;
  const { leads } = useLeads(pid);

  // Stable ref for dateRange to prevent callback re-creation
  const dateRangeRef = useRef(dateRange);
  dateRangeRef.current = dateRange;

  const [hierarchy, setHierarchy] = useState<Campaign[]>([]);
  const [liveStatusMap, setLiveStatusMap] = useState<Record<string, { status: string; effective_status: string; name?: string }>>({});
  const [adInsights, setAdInsights] = useState<Record<string, AdInsightRecord>>({});
  const [adAccountId, setAdAccountId] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  // Circuit Breaker for Rate Limits
  const rateLimitUntilRef = useRef<number>(0);
  const lastStatusSyncRef = useRef<number>(0);
  const setRateLimit = useCallback((until: number) => {
    rateLimitUntilRef.current = until;
    try {
      localStorage.setItem('meta_rate_limit_until', String(until));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem('meta_rate_limit_until') || 0);
      if (stored > 0) {
        rateLimitUntilRef.current = stored;
      }
    } catch {
      // ignore
    }
  }, []);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
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

  const normalizeStatus = useCallback((value: unknown): string => {
    if (typeof value !== 'string') return '';
    const val = value.toUpperCase();
    // Map all Meta-specific paused/inactive variants to a uniform 'PAUSED'
    if (val === 'PAUSED' || val === 'CAMPAIGN_PAUSED' || val === 'ADSET_PAUSED' || val === 'DISALLOWED' || val === 'DELETED' || val === 'ARCHIVED' || val === 'IN_PROCESS' || val === 'WITH_ISSUES' || val === 'PENDING_REVIEW') {
      return 'PAUSED';
    }
    return val;
  }, []);

  // Normalization Helper for Loose Matching (stable)
  const normalize = useCallback((str: string | undefined | null) => {
    if (!str) return '';
    let decoded = str;
    try {
      decoded = decodeURIComponent(str);
    } catch {
      decoded = str;
    }
    // Remove emojis, special chars, keep only alphanumeric and cyrillic
    return decoded.toLowerCase().replace(/[^a-z0-9а-яё]/g, '');
  }, []);

  const liveStatusByName = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(liveStatusMap || {}).forEach((entry) => {
      const key = normalize(entry?.name);
      if (key) {
        map.set(key, normalizeStatus(entry.effective_status ?? entry.status) as string);
      }
    });
    return map;
  }, [liveStatusMap, normalize, normalizeStatus]);

  // Reset data when switching projects to avoid cross-project leakage
  useEffect(() => {
    setHierarchy([]);
    setLiveStatusMap({});
    setAdInsights({});
    setAdAccountId(null);
    setAccountStatus(null);
    setSelectedCampaigns(new Set());
    setLoading(!!pid);
  }, [pid]);

  const normalizeNodeStatuses = useCallback((nodes: any[]): any[] => {
    return nodes.map((node: any) => {
      const status = normalizeStatus(node.status);
      const effective = normalizeStatus(node.effective_status ?? status);
      const next = { ...node, status, effective_status: effective };
      if (node.adsets?.data) {
        next.adsets = { data: normalizeNodeStatuses(node.adsets.data) };
      }
      if (node.ads?.data) {
        next.ads = { data: normalizeNodeStatuses(node.ads.data) };
      }
      return next;
    });
  }, [normalizeStatus]);

  const getLiveStatus = useCallback((id: string, name?: string): string | null => {
    const live = liveStatusMap[id];
    if (live) return normalizeStatus(live.effective_status ?? live.status);
    // Fallback by name when IDs don't align (e.g., local DB ids)
    if (name) {
      const key = normalize(name);
      const byName = liveStatusByName.get(key);
      if (byName) return byName;
    }
    return null;
  }, [liveStatusMap, normalizeStatus, normalize, liveStatusByName]);

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

  const leadIndexes = useMemo(() => {
    const buildIndex = (field: 'utm_campaign' | 'utm_term' | 'utm_content') => {
      const map = new Map<string, { visits: number; paid: number; revenue: number }>();
      const keys: string[] = [];

      filteredLeads.forEach((lead) => {
        const utm = (lead as any)[field] as string | null | undefined;
        if (!utm) return;
        const key = normalize(utm);
        if (!key) return;

        let agg = map.get(key);
        if (!agg) {
          agg = { visits: 0, paid: 0, revenue: 0 };
          map.set(key, agg);
          keys.push(key);
        }

        agg.visits += 1;
        if (lead.status === 'paid') {
          agg.paid += 1;
          agg.revenue += lead.deal_amount || 0;
        }
      });

      return { map, keys };
    };

    return {
      campaign: buildIndex('utm_campaign'),
      adset: buildIndex('utm_term'),
      ad: buildIndex('utm_content'),
    };
  }, [filteredLeads, normalize]);

  // Merge Hierarchy with Derived Campaigns from CRM AND Ad Performance Logs
  const fullHierarchy = useMemo(() => {
    if (!hierarchy) return [];

    const existingIds = new Set(hierarchy.map(c => c.id));
    const derived: Campaign[] = [];
    const processedUtms = new Set<string>();

    if (!showActiveOnly) {
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
    }

    return [...hierarchy, ...derived];
  }, [hierarchy, filteredLeads, adInsights, showActiveOnly, normalize]);

  const fetchHierarchyFromDb = useCallback(async () => {
    if (!pid) return [] as Campaign[];

    let fallbackHierarchy: Campaign[] = [];

    // 1. Try 'campaigns' table (structure source)
    const { data: localCampaigns } = await (supabase as any)
      .from('campaigns')
      .select('*')
      .eq('project_id', pid)
      .order('created_at', { ascending: false });

    if (localCampaigns && localCampaigns.length > 0) {
      fallbackHierarchy = localCampaigns.map((c: any) => ({
        id: String(c.external_id || c.id),
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
        .eq('project_id', pid)
        .eq('entity_type', 'campaign')
        .order('date_start', { ascending: false });

      if (logs && logs.length > 0) {
        const uniqueMap = new Map();
        logs.forEach((log: any) => {
          if (!uniqueMap.has(String(log.entity_id))) {
            uniqueMap.set(String(log.entity_id), {
              id: String(log.entity_id),
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

    return fallbackHierarchy;
  }, [pid]);


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
        const entityId = String(item.entity_id);
        if (!insightsMap[entityId]) {
          insightsMap[entityId] = {
            entity_id: entityId,
            name: item.entity_name,
            spend: 0,
            leads: 0,
            clicks: 0,
            impressions: 0
          };
        }
        const record = insightsMap[entityId];
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

  // Lightweight: get ONLY real-time status from Meta (no insights, no rate limit concerns)
  const fetchLiveStatuses = useCallback(async (ignoreThrottle = false) => {
    if (!pid) return;
    if (Date.now() < rateLimitUntilRef.current) return;

    const now = Date.now();
    if (!ignoreThrottle && now - lastStatusSyncRef.current < 30000) return;
    try {
      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { action: 'get_statuses', payload: { projectId: pid, include_children: false, level: 'campaign' } }
      });
      if (!error && data?.statusMap) {
        setLiveStatusMap(data.statusMap);
        lastStatusSyncRef.current = now;
        console.log(`✅ Live status sync: ${data.total} entities from Meta`);
      } else if (error || data?.error) {
        const message = String(error || data?.error || '');
        if (message.includes('(#80004)')) {
          setRateLimit(Date.now() + 60000 * 5);
        }
        console.warn('Live status fetch failed (non-critical):', error || data?.error);
      }
    } catch (e) {
      console.warn('fetchLiveStatuses error (non-critical):', e);
    }
  }, [pid, setRateLimit]);

  const fetchHierarchy = useCallback(async (forceApi = false) => {
    if (!pid) return;
    setLoading(true);
    try {
      // Prefer local DB when not forced to avoid Meta rate limits
      if (!forceApi) {
        const localHierarchy = await fetchHierarchyFromDb();
        if (localHierarchy.length > 0) {
          setHierarchy(localHierarchy);
          setLoading(false);
          return;
        }
      }

      if (Date.now() < rateLimitUntilRef.current) {
        const localHierarchy = await fetchHierarchyFromDb();
        if (localHierarchy.length > 0) {
          setHierarchy(localHierarchy);
        }
        if (forceApi) {
          toast.warning('Meta API временно недоступно (лимит запросов).');
        }
        return;
      }

      const payload: any = { projectId: pid, include_children: false, level: 'campaign' };

      const dr = dateRangeRef.current;
      if (dr?.from && dr?.to) {
        payload.date_range = {
          since: format(dr.from, 'yyyy-MM-dd'),
          until: format(dr.to, 'yyyy-MM-dd')
        };
      }

      const { data, error } = await supabase.functions.invoke('ads-manager', {
        body: { action: 'get_hierarchy', payload }
      });

      if (error || !data || data.error) {
        console.error('Edge Function/Meta API Error:', error || data?.error);

        const message = String(error || data?.error || '');
        const isRateLimit = message.includes('(#80004)') || message.includes('rate-limiting');

        if (isRateLimit) {
          setRateLimit(Date.now() + 60000 * 5);
          toast.warning('Meta API: Превышен лимит запросов. Используем локальные данные.');
        } else if (message.includes('No active Ad Account')) {
          toast.error('Рекламный аккаунт не найден.');
          return;
        }

        const localHierarchy = await fetchHierarchyFromDb();
        if (localHierarchy.length > 0) {
          setHierarchy(localHierarchy);
        }
        return;
      }

      const apiData = normalizeNodeStatuses(data.data || []);
      setHierarchy(apiData);

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
  }, [pid, fetchHierarchyFromDb, normalizeNodeStatuses, setRateLimit]); // Only depends on pid/rate limit, reads dateRange from ref



  // Stable key for dateRange to prevent unnecessary refetches
  const dateRangeKey = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return '';
    return `${format(dateRange.from, 'yyyy-MM-dd')}_${format(dateRange.to, 'yyyy-MM-dd')}`;
  }, [dateRange]);

  useEffect(() => {
    if (pid && dateRangeKey && dateRange?.from) {
      // 1. Load Local Data Immediately (History + cached Today)
      fetchHierarchy(false);
      fetchAdInsights();
      if (Date.now() >= rateLimitUntilRef.current) {
        fetchLiveStatuses(); // Statuses are lightweight but still respect rate limits
      }

      // 2. Smart Sync Logic
      // We sync if we haven't synced this specific range recently to ensure data consistency
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromStr;
      const toDate = dateRange.to ?? dateRange.from;
      const rangeDays = differenceInCalendarDays(toDate, dateRange.from) + 1;
      const yesterday = subDays(new Date(), 1);
      const includesRecent = toDate >= yesterday;

      // Use a unique key for this specific date range
      const lastSyncKey = `ads_sync_${pid}_${fromStr}_${toStr}`;
      const lastSyncTime = sessionStorage.getItem(lastSyncKey);
      const now = Date.now();

      // Check if we should sync:
      // 1. Not synced recently (5 mins cooldown)
      // 2. Rate limit not active
      // 3. Range includes recent dates (avoid syncing old ranges)
      if (
        includesRecent &&
        rangeDays <= 7 &&
        Date.now() >= rateLimitUntilRef.current &&
        (!lastSyncTime || (now - parseInt(lastSyncTime)) > 300000)
      ) {
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
            setRateLimit(Date.now() + 60000 * 5); // 5 min pause
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
  }, [pid, dateRangeKey]); // Stable deps only — callbacks use refs internally

  useEffect(() => {
    if (pid && refreshTrigger > 0) {
      // Refresh DB insights + hierarchy to update active statuses
      fetchAdInsights();
      fetchHierarchy(true);
      if (Date.now() >= rateLimitUntilRef.current) {
        fetchLiveStatuses(); // Refresh live statuses on manual refresh too
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, pid]);

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
      await fetchLiveStatuses(true);

      if (syncData.message) {
        toast.success(syncData.message);
      } else {
        toast.success('Данные Meta Ads обновлены');
      }
    } catch (e: any) {
      console.error('Sync failed', e);
      if (e.message?.includes('(#80004)')) {
        setRateLimit(Date.now() + 60000 * 5);
        toast.warning('Meta API: Превышен лимит запросов. Синхронизация пропущена.');
      } else {
        toast.error(`Ошибка синхронизации: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Added projectId because it was used in fallback logging (line 621 in original)

  const handleToggleStatus = async (id: string, enabled: boolean) => {
    setToggling(id);
    const newStatus = enabled ? 'ACTIVE' : 'PAUSED';

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

      // Background refresh after a short delay to confirm with Meta
      setTimeout(() => {
        fetchLiveStatuses(true);
      }, 3000);
    } catch (e) {
      console.error('Failed to update status', e);
      toast.error('Не удалось обновить статус');
    } finally {
      setToggling(null);
    }
  };

  const updateLocalStatus = (id: string, status: 'ACTIVE' | 'PAUSED') => {
    // 1. Update liveStatusMap immediately for UI responsiveness
    setLiveStatusMap(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        effective_status: status
      }
    }));

    // 2. Update hierarchy state
    const updateNode = (nodes: any[]): any[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, status, effective_status: status };
        const next = { ...node };
        if (node.adsets?.data) {
          next.adsets = { data: updateNode(node.adsets.data) };
        }
        if (node.ads?.data) {
          next.ads = { data: updateNode(node.ads.data) };
        }
        return next;
      });
    };
    setHierarchy(prev => updateNode(prev));
  };

  // Process data into tree structure
  const processedData = useMemo(() => {
    const getMetrics = (id: string, node?: any) => {
      const record = adInsights[id];
      const spend = record?.spend || 0;
      const leadsMeta = record?.leads || 0;
      const clicks = record?.clicks || 0;
      const impressions = record?.impressions || 0;

      const currency = accountStatus?.currency || 'USD';

      // Only apply KZT_RATE if the account currency is USD. 
      // If it's KZT, spend is already in KZT.
      const spendKZT = currency === 'USD' ? spend * KZT_RATE : spend;
      return { spend, leadsMeta, clicks, impressions, spendKZT };
    };

    const shouldShow = (status: string) => {
      const norm = normalizeStatus(status);
      if (norm === 'DELETED' || norm === 'ARCHIVED') return false;
      if (!showActiveOnly) return true;
      return norm === 'ACTIVE';
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
          shouldShow(child.status)
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
      const getLeadAggForNode = (nodeType: 'campaign' | 'adset' | 'ad', nodeId: string, nodeName: string) => {
        const index = nodeType === 'campaign'
          ? leadIndexes.campaign
          : nodeType === 'adset'
            ? leadIndexes.adset
            : leadIndexes.ad;

        const normName = normalize(nodeName);
        const normId = normalize(nodeId);
        const keysToInclude = new Set<string>();

        if (normId) keysToInclude.add(normId);
        if (normName) keysToInclude.add(normName);

        if (normName.length > 3) {
          for (const key of index.keys) {
            if (keysToInclude.has(key)) continue;
            if (key.length > 3 && (key.includes(normName) || normName.includes(key))) {
              keysToInclude.add(key);
            }
          }
        }

        let visits = 0;
        let paid = 0;
        let revenue = 0;
        keysToInclude.forEach((key) => {
          const agg = index.map.get(key);
          if (!agg) return;
          visits += agg.visits;
          paid += agg.paid;
          revenue += agg.revenue;
        });

        return { visits, paid, revenue };
      };

      const leadAgg = getLeadAggForNode(type, node.id, node.name);

      // Leads CRM (now Visits): For campaigns, if direct matching fails (0), try using children sum
      // This handles cases where leads match AdSets (via utm_term) but not Campaign (via utm_campaign)
      let visits = leadAgg.visits;
      if (visits === 0 && type === 'campaign' && childrenSum.visits > 0) {
        visits = childrenSum.visits;
      }

      // Smart Leads Logic: Use Max(Meta, CRM)
      const finalLeadsMeta = Math.max(rawLeadsMeta, visits);

      // Calculate derivatives (using Smart Leads count)
      const cpl = finalLeadsMeta > 0 ? finalSpendKZT / finalLeadsMeta : 0;

      const sales = leadAgg.paid;
      const revenue = leadAgg.revenue;

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

      // Prefer live status map (status-only endpoint), fallback to hierarchy status
      const liveStatus = getLiveStatus(String(node.id), node.name);
      let effectiveStatus: string = liveStatus ?? normalizeStatus(node.effective_status || node.status);

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
      .filter(campaign => shouldShow(campaign.status));

  }, [fullHierarchy, filteredLeads, adInsights, showActiveOnly, getLiveStatus, leadIndexes]);

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

  // Selection helpers
  const toggleCampaignSelection = useCallback((id: string) => {
    setSelectedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleRowSelection = useCallback((row: RowData) => {
    if (row.type === 'campaign') toggleCampaignSelection(row.id);
  }, [toggleCampaignSelection]);

  const isRowSelected = useCallback((row: RowData) => {
    return selectedCampaigns.has(row.id);
  }, [selectedCampaigns]);

  const visibleRows = useMemo(() => {
    const campaigns = sortedData.filter(r => r.type === 'campaign');
    if (!showActiveOnly) return campaigns;

    // When showing only active, dedupe by normalized name and keep highest spend
    const byName = new Map<string, typeof campaigns[0]>();
    campaigns.forEach(c => {
      const key = normalize(c.name);
      const current = byName.get(key);
      if (!current || c.spendKZT > current.spendKZT) {
        byName.set(key, c);
      }
    });
    return Array.from(byName.values());
  }, [sortedData, showActiveOnly, normalize]);

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
  const totals = useMemo(() => {
    const totalSpendKZT = processedData.reduce((sum, row) => sum + row.spendKZT, 0);
    const totalLeadsMeta = processedData.reduce((sum, row) => sum + row.leadsMeta, 0);
    const totalVisits = processedData.reduce((sum, row) => sum + row.visits, 0);
    const totalSales = processedData.reduce((sum, row) => sum + row.sales, 0);
    const totalRevenue = processedData.reduce((sum, row) => sum + row.revenue, 0);

    return {
      totalSpendKZT,
      totalLeadsMeta,
      totalVisits,
      totalSales,
      totalRevenue,
      totalCpl: totalLeadsMeta > 0 ? totalSpendKZT / totalLeadsMeta : 0,
      totalVisitCost: totalVisits > 0 ? totalSpendKZT / totalVisits : 0,
      totalRoi: totalSpendKZT > 0 ? (totalRevenue - totalSpendKZT) / totalSpendKZT * 100 : 0,
    };
  }, [processedData]);

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
    <>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-sans pb-20 bg-[#020617] min-h-screen relative overflow-visible">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 px-2">
          <div className="flex items-center gap-8">
            <div>
              <h2 className="text-5xl font-black tracking-widest uppercase text-white">
                Active <span className="text-primary italic">Intelligence</span>
              </h2>
              <div className="flex items-center gap-4 mt-3 ml-1">
                <span className="h-0.5 w-12 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em]">Omnichannel Ad Management</p>
              </div>
            </div>

            <div className="h-12 w-px bg-white/10 mx-2 hidden lg:block" />

            <div className="flex flex-col gap-2">
              {adAccountId && (
                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Account Matrix: {adAccountId}</div>
              )}
              {accountStatus && accountStatus.account_status !== 1 ? (
                <div className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  accountStatus.account_status === 3 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                )}>
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", accountStatus.account_status === 3 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]")} />
                  {ACCOUNT_STATUS_MAP[accountStatus.account_status]?.label || 'Error'}
                </div>
              ) : (
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse" />
                  Neural Engine Active
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-card/40 backdrop-blur-3xl border border-white/10 shadow-interstellar">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Active Only</span>
            <Switch
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="h-10 w-px bg-white/10 hidden sm:block" />

          <Button
            variant="outline"
            onClick={handleForceSync}
            disabled={loading}
            className="h-14 px-8 rounded-[1.5rem] bg-card/40 backdrop-blur-3xl border border-white/10 text-white hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[11px] gap-3 shadow-interstellar"
          >
            <RefreshCw className={cn("w-5 h-5 text-primary", loading && "animate-spin")} />
            Architecture Sync
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading || visibleRows.length === 0}
            className="h-14 w-14 p-0 rounded-[1.5rem] bg-card/40 backdrop-blur-3xl border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-interstellar"
          >
            <Download className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-14 w-14 p-0 rounded-[1.5rem] bg-card/40 backdrop-blur-3xl border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-interstellar">
                <Settings2 className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-[#020617]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-interstellar p-4">
              <DropdownMenuLabel className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30">Matrix Configuration</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5 mx-4" />
              <div className="p-2 space-y-2">
                {Object.keys(columnVisibility).map(key => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={columnVisibility[key]}
                    onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [key]: checked }))}
                    className="rounded-xl py-3 focus:bg-primary/20 focus:text-white text-[10px] font-black uppercase tracking-widest text-white/50 cursor-pointer"
                  >
                    {COLUMN_LABELS[key] || key}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Account Alerts Area */}
      {accountStatus && accountStatus.account_status !== 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-2 p-8 rounded-[2.5rem] bg-red-500/5 border border-red-500/20 backdrop-blur-3xl flex items-center gap-8 shadow-interstellar"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2">Architectural Interruption: {ACCOUNT_STATUS_MAP[accountStatus.account_status]?.label}</h4>
            <p className="text-sm font-black text-red-200/60 uppercase tracking-tight">{DISABLE_REASON_MAP[accountStatus.disable_reason] || "Unauthorized restriction detected on the advertisement account."}</p>
          </div>
          <Button variant="outline" className="rounded-2xl h-12 px-8 border-red-500/30 text-red-400 hover:bg-red-500/10 font-black uppercase tracking-widest text-[10px]">Initialize Recovery</Button>
        </motion.div>
      )
      }

      {/* Main Table Content */}
      <div className="mx-2 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border border-white/10 shadow-interstellar overflow-hidden p-1">
        <div className="overflow-x-auto min-h-[400px]">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="border-b border-white/50 hover:bg-transparent h-16">
                <TableHead className="w-16 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded-md border-white/50 bg-muted accent-primary cursor-pointer"
                    checked={visibleRows.length > 0 && visibleRows.every(r => isRowSelected(r))}
                    onChange={() => {
                      const allSelected = visibleRows.every(r => isRowSelected(r));
                      setSelectedCampaigns(new Set(allSelected ? [] : visibleRows.map(r => r.id)));
                    }}
                  />
                </TableHead>
                {columnVisibility.status && (
                  <TableHead className="w-20 text-center font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Вкл</TableHead>
                )}
                <TableHead className="min-w-[300px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="hover:bg-transparent p-0 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                    Название
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead className="w-40 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Статус</TableHead>
                {columnVisibility.spend && (
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('spend')} className="hover:bg-transparent p-0 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                      Затраты {getSortIcon('spend')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.leads && (
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('leadsMeta')} className="hover:bg-transparent p-0 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                      Конверсии {getSortIcon('leadsMeta')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.cpl && (
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('cpl')} className="hover:bg-transparent p-0 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                      Цена лида {getSortIcon('cpl')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.visits && (
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('visits')} className="hover:bg-transparent p-0 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                      Визиты CRM {getSortIcon('visits')}
                    </Button>
                  </TableHead>
                )}
                {columnVisibility.roi && (
                  <TableHead className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleSort('roi')} className="hover:bg-transparent p-0 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">
                      ROMI {getSortIcon('roi')}
                    </Button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={10} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl border-2 border-primary/20 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Синхронизация данных...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow className="hover:bg-transparent border-none">
                  <TableCell colSpan={10} className="h-80 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                      <Zap className="w-12 h-12 text-muted-foreground" />
                      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Сигналы не обнаружены в этом диапазоне.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row) => (
                  <motion.tr
                    key={row.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "group border-b border-white/5 transition-all relative overflow-hidden h-16",
                      isRowSelected(row) ? "bg-primary/5" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <TableCell className="text-center relative z-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-md border-white/20 bg-white/5 accent-primary cursor-pointer"
                        checked={isRowSelected(row)}
                        onChange={() => toggleRowSelection(row)}
                      />
                    </TableCell>

                    {columnVisibility.status && (
                      <TableCell className="text-center relative z-10">
                        <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                          {toggling === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <Switch
                              checked={row.status === 'ACTIVE'}
                              onCheckedChange={(checked) => handleToggleStatus(row.id, checked)}
                              className="scale-90 data-[state=checked]:bg-secondary transition-all"
                            />
                          )}
                        </div>
                      </TableCell>
                    )}

                    <TableCell className="relative z-10">
                      <div className="flex items-center gap-4">
                        {row.type === 'ad' && row.thumbnail ? (
                          <div className="relative group/thumb">
                            <img src={row.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/50" />
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-xl" />
                          </div>
                        ) : (
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                            row.status === 'ACTIVE'
                              ? "bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/5"
                              : "bg-white/5 border-white/10 text-white/20"
                          )}>
                            <LayoutDashboard className="w-5 h-5" />
                          </div>
                        )}

                        <div className="flex flex-col min-w-0 group/name max-w-[400px]">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-black text-white/90 transition-colors group-hover/name:text-primary uppercase tracking-tight" title={row.name}>
                              {row.name}
                            </span>
                            <button
                              className="opacity-0 group-hover/name:opacity-100 p-1.5 hover:bg-muted rounded-lg transition-all"
                              onClick={(e) => openEditDialog(row, e)}
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                              {row.type === 'campaign' ? 'КАМПАНИЯ' : (row.type === 'adset' ? 'ГРУППА' : 'ОБЪЯВЛЕНИЕ')}
                            </span>
                            <span className="text-[9px] font-mono text-white/20">#{row.id}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          row.status === 'ACTIVE' ? "bg-secondary shadow-[0_0_12px_#3b82f6]" : "bg-white/10"
                        )} />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          row.status === 'ACTIVE' ? "text-secondary" : "text-white/20"
                        )}>
                          {row.status === 'ACTIVE' ? 'АКТИВНА' : 'ПАУЗА'}
                        </span>
                      </div>
                      {row.type === 'campaign' && row.spendKZT === 0 && !loading && (
                        <div className="mt-1 text-[9px] text-amber-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Нет данных
                        </div>
                      )}
                    </TableCell>

                    {columnVisibility.spend && (
                      <TableCell className="text-right relative z-10">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-sm font-black text-white/90">{formatCurrency(row.spendKZT)}</span>
                          <span className="text-[9px] text-white/30 font-mono tracking-tighter uppercase">{row.spend.toFixed(2)} USD</span>
                        </div>
                      </TableCell>
                    )}

                    {columnVisibility.leads && (
                      <TableCell className="text-right relative z-10">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center gap-2">
                            {row.leadsMeta > 0 && <ArrowUpRight className="w-3 h-3 text-secondary animate-pulse" />}
                            <span className="text-sm font-black text-white/90">{formatNumber(row.leadsMeta)}</span>
                          </div>
                          <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">ЛИДЫ META</span>
                        </div>
                      </TableCell>
                    )}

                    {columnVisibility.cpl && (
                      <TableCell className="text-right relative z-10">
                        <div className="p-3 inline-flex flex-col items-end rounded-2xl bg-white/5 border border-white/10 shadow-interstellar">
                          <span className={cn("text-xs font-black", row.cpl > 5000 ? "text-red-500" : "text-primary")}>
                            {formatCurrency(row.cpl)}
                          </span>
                          <span className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] mt-1">ЦЕНА ЦЕЛИ</span>
                        </div>
                      </TableCell>
                    )}

                    {columnVisibility.visits && (
                      <TableCell className="text-right relative z-10">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-sm font-black text-white/90">{formatNumber(row.visits)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#3b82f6]" />
                            <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em]">CRM FLOW</span>
                          </div>
                        </div>
                      </TableCell>
                    )}

                    {columnVisibility.roi && (
                      <TableCell className="text-right relative z-10">
                        <div className={cn(
                          "inline-flex flex-col items-end px-4 py-2 rounded-2xl border transition-colors",
                          row.roi > 0 ? "bg-secondary/10 border-secondary/20 text-secondary" : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                          <span className="text-sm font-black tracking-tight">{formatPercent(row.roi)}</span>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">ROMI</span>
                        </div>
                      </TableCell>
                    )}
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Futuristic Summary Footer */}
        {
          !loading && visibleRows.length > 0 && (
            <div className="mt-8 p-10 rounded-[3rem] bg-card/40 backdrop-blur-xl shadow-interstellar border border-white/10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Всего затрат</p>
                <p className="text-xl font-black text-white">{formatCurrency(totals.totalSpendKZT)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Всего конверсий</p>
                <p className="text-xl font-black text-secondary">{formatNumber(totals.totalLeadsMeta)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Средний CPL</p>
                <p className="text-xl font-black text-primary">{formatCurrency(totals.totalCpl)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">ROMI</p>
                <p className="text-xl font-black text-white">{formatPercent(totals.totalRoi)}</p>
              </div>
              <div className="space-y-1 hidden lg:block">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Визиты CRM</p>
                <p className="text-xl font-black text-secondary">{formatNumber(totals.totalVisits)}</p>
              </div>
            </div>
          )
        }

        {/* Facebook-style Edit Modal (Light themed) */}
        <Dialog open={!!editingEntity} onOpenChange={(open) => !open && setEditingEntity(null)}>
          <DialogContent className="bg-[#020617]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-interstellar text-white max-w-md">
            <DialogHeader className="px-2">
              <DialogTitle className="text-2xl font-black uppercase tracking-widest text-white">
                Редактировать
              </DialogTitle>
              <DialogDescription className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                {editingEntity?.type === 'campaign' ? 'КАМПАНИЯ' : (editingEntity?.type === 'adset' ? 'ГРУППА' : 'ОБЪЯВЛЕНИЕ')} · ID: {editingEntity?.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6 px-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Название</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-2xl h-14 focus:ring-primary focus:border-primary text-sm font-bold text-white"
                />
              </div>

              {editingEntity?.type === 'campaign' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Дневной бюджет (USD)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 focus:ring-primary focus:border-primary text-sm font-bold text-white"
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="px-2 pb-4 mt-6">
              <Button
                variant="ghost"
                onClick={() => setEditingEntity(null)}
                className="rounded-2xl h-14 uppercase text-[10px] font-black tracking-[0.2em] text-white/40 hover:bg-white/5"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-10 uppercase text-[10px] font-black tracking-[0.2em] shadow-interstellar"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ActiveAdsManager;
