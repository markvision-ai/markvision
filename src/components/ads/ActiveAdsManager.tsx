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
  const [showActiveOnly, setShowActiveOnly] = useState(false);
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

      // Fallback removed to prevent mixing Lifetime (API) and Daily (DB) data.
      // We rely strictly on DB logs for consistent aggregation.

      const spendKZT = spend * KZT_RATE;
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
      const effectiveStatus: string = liveStatus ?? normalizeStatus(node.effective_status || node.status);

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
    <div className="relative overflow-visible">
      {/* Meta-style Top Bar */}
      <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Рекламные кампании</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20 uppercase tracking-widest">
                Активно
              </span>
              {adAccountId && (
                <span className="px-2 py-1 bg-muted text-muted-foreground font-mono text-[10px] rounded border border-border">
                  ID: {adAccountId}
                </span>
              )}
            </div>
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          {accountStatus && accountStatus.account_status !== 1 ? (
            <div className={cn(
              "flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
              accountStatus.account_status === 3 ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", accountStatus.account_status === 3 ? "bg-red-500" : "bg-amber-500")} />
              {ACCOUNT_STATUS_MAP[accountStatus.account_status]?.label || 'Ошибка'}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              Meta Engine готов
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
            <button
              onClick={() => setShowActiveOnly(false)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                !showActiveOnly ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Все
            </button>
            <button
              onClick={() => setShowActiveOnly(true)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                showActiveOnly ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Активные
            </button>
          </div>

          <div className="h-8 w-px bg-border" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleForceSync}
            disabled={loading}
            className="h-10 px-6 rounded-xl border-border bg-background text-foreground hover:bg-accent font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} />
            Обновить
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || visibleRows.length === 0}
            className="h-10 w-10 p-0 rounded-xl border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent shadow-sm"
          >
            <Download className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-accent text-muted-foreground">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card border border-border rounded-2xl shadow-xl">
              <DropdownMenuLabel className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Видимость колонок</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <div className="p-2 space-y-1">
                {Object.keys(columnVisibility).map(key => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={columnVisibility[key]}
                    onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [key]: checked }))}
                    className="rounded-lg py-2 focus:bg-primary/10 focus:text-primary text-xs font-bold uppercase tracking-widest"
                  >
                    {key === 'status' ? 'Статус' :
                      key === 'spend' ? 'Затраты' :
                        key === 'leads' ? 'Лиды (Meta)' :
                          key === 'cpl' ? 'Цена лида' :
                            key === 'visits' ? 'Визиты CRM' :
                              key === 'visitCost' ? 'Цена визита' :
                                key === 'sales' ? 'Продажи' :
                                  key === 'revenue' ? 'Выручка' :
                                    key === 'roi' ? 'ROI' : key}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Account Alerts Area */}
      {accountStatus && accountStatus.account_status !== 1 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl flex items-center gap-4 shadow-2xl"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-widest text-red-400">Система: {ACCOUNT_STATUS_MAP[accountStatus.account_status]?.label}</h4>
              <p className="text-[11px] text-red-300 opacity-80 truncate">{DISABLE_REASON_MAP[accountStatus.disable_reason] || 'Обнаружено ограничение доступа к рекламному аккаунту.'}</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg h-8 border-red-500/30 text-red-400 hover:bg-red-500/10">Исправить</Button>
          </motion.div>
        </div>
      )}

      {/* Main Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent h-16">
              <TableHead className="w-16 text-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded-md border-border bg-muted accent-primary cursor-pointer"
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
                    "group border-b border-border transition-all relative overflow-hidden h-14",
                    isRowSelected(row) ? "bg-primary/5" : "hover:bg-muted/50"
                  )}
                >
                  <TableCell className="text-center relative z-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded-md border-border bg-background accent-primary cursor-pointer"
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
                            className="scale-90 data-[state=checked]:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          />
                        )}
                      </div>
                    </TableCell>
                  )}

                  <TableCell className="relative z-10">
                    <div className="flex items-center gap-4">
                      {row.type === 'ad' && row.thumbnail ? (
                        <div className="relative group/thumb">
                          <img src={row.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border border-border" />
                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity rounded-xl" />
                        </div>
                      ) : (
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                          row.status === 'ACTIVE'
                            ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                            : "bg-muted border-border text-muted-foreground"
                        )}>
                          <LayoutDashboard className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 group/name max-w-[400px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-bold text-foreground transition-colors group-hover/name:text-primary uppercase tracking-tight" title={row.name}>
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
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                            {row.type === 'campaign' ? 'КАМПАНИЯ' : (row.type === 'adset' ? 'ГРУППА ОБЪЯВЛЕНИЙ' : 'ОБЪЯВЛЕНИЕ')}
                          </span>
                          <span className="text-[9px] font-mono text-muted-foreground opacity-70">ID: {row.id}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        row.status === 'ACTIVE' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-muted-foreground/30"
                      )} />
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        row.status === 'ACTIVE' ? "text-emerald-600" : "text-muted-foreground"
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
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground">{formatCurrency(row.spendKZT)}</span>
                        <span className="text-[10px] text-muted-foreground font-mono tracking-tighter">Бюджет: {row.spend.toFixed(2)} USD</span>
                      </div>
                    </TableCell>
                  )}

                  {columnVisibility.leads && (
                    <TableCell className="text-right relative z-10">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          {row.leadsMeta > 0 && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
                          <span className="text-sm font-bold text-foreground">{formatNumber(row.leadsMeta)}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.1em]">Лиды Meta</span>
                      </div>
                    </TableCell>
                  )}

                  {columnVisibility.cpl && (
                    <TableCell className="text-right relative z-10">
                      <div className="p-2 inline-flex flex-col items-end rounded-xl bg-muted/50 border border-border">
                        <span className={cn("text-xs font-bold", row.cpl > 5000 ? "text-red-600" : "text-primary")}>
                          {formatCurrency(row.cpl)}
                        </span>
                        <span className="text-[8px] font-bold uppercase text-muted-foreground tracking-widest">ЦЕЛЕВАЯ ЦЕНА</span>
                      </div>
                    </TableCell>
                  )}

                  {columnVisibility.visits && (
                    <TableCell className="text-right relative z-10">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground">{formatNumber(row.visits)}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1 h-1 rounded-full bg-blue-500" />
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">CRM FLOW</span>
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {columnVisibility.roi && (
                    <TableCell className="text-right relative z-10">
                      <div className={cn(
                        "inline-flex flex-col items-end px-3 py-1.5 rounded-2xl border",
                        row.roi > 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"
                      )}>
                        <span className="text-sm font-bold tracking-tight">{formatPercent(row.roi)}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">ROMI</span>
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
      {!loading && visibleRows.length > 0 && (
        <div className="mt-8 p-8 rounded-[2.5rem] bg-card border border-border grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 shadow-sm">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Всего затрат</p>
            <p className="text-lg font-black text-slate-900">{formatCurrency(totals.totalSpendKZT)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Всего конверсий</p>
            <p className="text-lg font-black text-emerald-600">{formatNumber(totals.totalLeadsMeta)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Средний CPL</p>
            <p className="text-lg font-black text-primary">{formatCurrency(totals.totalCpl)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Эффективность ROI</p>
            <p className="text-lg font-black text-slate-900">{formatPercent(totals.totalRoi)}</p>
          </div>
          <div className="space-y-0.5 hidden lg:block">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Визиты CRM</p>
            <p className="text-lg font-black text-blue-600">{formatNumber(totals.totalVisits)}</p>
          </div>
        </div>
      )}

      {/* Facebook-style Edit Modal (Light themed) */}
      <Dialog open={!!editingEntity} onOpenChange={(open) => !open && setEditingEntity(null)}>
        <DialogContent className="bg-card border border-border rounded-3xl shadow-xl text-foreground max-w-md">
          <DialogHeader className="px-2">
            <DialogTitle className="text-2xl font-bold uppercase tracking-widest text-foreground">
              Редактировать
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              {editingEntity?.type === 'campaign' ? 'КАМПАНИЯ' : (editingEntity?.type === 'adset' ? 'ГРУППА' : 'ОБЪЯВЛЕНИЕ')} · ID: {editingEntity?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6 px-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Название</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-muted border-border rounded-xl h-12 focus:ring-primary focus:border-primary text-sm font-bold"
              />
            </div>

            {editingEntity?.type === 'campaign' && (
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Дневной бюджет (USD)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="bg-muted border-border rounded-xl h-12 pl-10 focus:ring-primary focus:border-primary text-sm font-bold"
                  />
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-2 pb-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setEditingEntity(null)}
              className="rounded-xl h-12 uppercase text-[10px] font-bold tracking-widest hover:bg-muted"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-8 uppercase text-[10px] font-bold tracking-widest shadow-lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить изменения'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
