import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AttributionModel, 
  calculateAttribution, 
  Touchpoint,
  CustomModelSettings,
  ChannelAttribution 
} from '@/lib/attribution';

interface Visit {
  id: string;
  clientId: string;
  sessionId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  sourceType: string;
  visitedAt: string;
  isConversion: boolean;
}

interface TouchpointData {
  id: string;
  dealId: string;
  position: number;
  totalInChain: number;
  isFirst: boolean;
  isLast: boolean;
  sourceType: string;
  channelName: string;
  campaignName: string | null;
  keyword: string | null;
  dealRevenue: number;
  dealProfit: number;
  touchedAt: string;
}

interface AttributionResultData {
  channelName: string;
  sourceType: string;
  model: AttributionModel;
  visits: number;
  leads: number;
  sales: number;
  revenue: number;
  attributedRevenue: number;
  attributedProfit: number;
  cpl: number;
  cac: number;
  roi: number;
  assistedConversions: number;
}

// Demo data for visualization when no real data exists
const generateDemoData = (): AttributionResultData[] => {
  const channels = [
    { name: 'Google Ads', sourceType: 'paid_search', visits: 15420, leads: 342, sales: 89, spend: 450000 },
    { name: 'Facebook Ads', sourceType: 'paid_social', visits: 12350, leads: 287, sales: 72, spend: 380000 },
    { name: 'TikTok Ads', sourceType: 'paid_social', visits: 8900, leads: 198, sales: 45, spend: 220000 },
    { name: 'Яндекс.Директ', sourceType: 'paid_search', visits: 9800, leads: 234, sales: 58, spend: 320000 },
    { name: 'Instagram Ads', sourceType: 'paid_social', visits: 6700, leads: 156, sales: 38, spend: 180000 },
    { name: 'Email рассылки', sourceType: 'email', visits: 4500, leads: 189, sales: 67, spend: 45000 },
    { name: 'Ретаргетинг', sourceType: 'retargeting', visits: 3200, leads: 145, sales: 52, spend: 95000 },
    { name: 'Органический поиск', sourceType: 'organic', visits: 22000, leads: 412, sales: 98, spend: 0 },
    { name: 'Прямые заходы', sourceType: 'direct', visits: 18500, leads: 267, sales: 78, spend: 0 },
    { name: 'Реферальный трафик', sourceType: 'referral', visits: 5400, leads: 123, sales: 34, spend: 25000 },
  ];

  const avgDealValue = 185000; // Average deal value in ₸
  
  return channels.map(ch => {
    const revenue = ch.sales * avgDealValue;
    const profit = revenue * 0.35; // 35% margin
    
    return {
      channelName: ch.name,
      sourceType: ch.sourceType,
      model: 'last_click' as AttributionModel,
      visits: ch.visits,
      leads: ch.leads,
      sales: ch.sales,
      revenue,
      attributedRevenue: revenue,
      attributedProfit: profit,
      cpl: ch.spend > 0 && ch.leads > 0 ? ch.spend / ch.leads : 0,
      cac: ch.spend > 0 && ch.sales > 0 ? ch.spend / ch.sales : 0,
      roi: ch.spend > 0 ? ((revenue - ch.spend) / ch.spend) * 100 : 0,
      assistedConversions: Math.floor(ch.sales * 0.4),
    };
  });
};

// Generate demo customer journeys
const generateDemoJourneys = () => {
  return [
    {
      id: '1',
      dealId: 'DEAL-001',
      revenue: 245000,
      touchpoints: [
        { channel: 'Google Ads', source: 'paid_search', position: 1 },
        { channel: 'Ретаргетинг', source: 'retargeting', position: 2 },
        { channel: 'Прямой заход', source: 'direct', position: 3 },
      ]
    },
    {
      id: '2',
      dealId: 'DEAL-002',
      revenue: 180000,
      touchpoints: [
        { channel: 'Facebook Ads', source: 'paid_social', position: 1 },
        { channel: 'Email', source: 'email', position: 2 },
        { channel: 'Органический поиск', source: 'organic', position: 3 },
        { channel: 'Прямой заход', source: 'direct', position: 4 },
      ]
    },
    {
      id: '3',
      dealId: 'DEAL-003',
      revenue: 320000,
      touchpoints: [
        { channel: 'TikTok Ads', source: 'paid_social', position: 1 },
        { channel: 'Instagram Ads', source: 'paid_social', position: 2 },
        { channel: 'Ретаргетинг', source: 'retargeting', position: 3 },
        { channel: 'Email', source: 'email', position: 4 },
        { channel: 'Прямой заход', source: 'direct', position: 5 },
      ]
    },
    {
      id: '4',
      dealId: 'DEAL-004',
      revenue: 150000,
      touchpoints: [
        { channel: 'Яндекс.Директ', source: 'paid_search', position: 1 },
        { channel: 'Органический поиск', source: 'organic', position: 2 },
      ]
    },
    {
      id: '5',
      dealId: 'DEAL-005',
      revenue: 275000,
      touchpoints: [
        { channel: 'Реферальный', source: 'referral', position: 1 },
        { channel: 'Google Ads', source: 'paid_search', position: 2 },
        { channel: 'Ретаргетинг', source: 'retargeting', position: 3 },
      ]
    },
  ];
};

export function useMultichannelAnalytics(projectId: string | null) {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [touchpoints, setTouchpoints] = useState<TouchpointData[]>([]);
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('last_click');
  const [compareModel, setCompareModel] = useState<AttributionModel | null>(null);
  const [customSettings, setCustomSettings] = useState<CustomModelSettings>({
    firstTouchWeight: 40,
    lastTouchWeight: 40,
    middleTouchesWeight: 20,
  });

  const demoData = useMemo(() => generateDemoData(), []);
  const demoJourneys = useMemo(() => generateDemoJourneys(), []);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    try {
      // Fetch visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('project_id', projectId)
        .order('visited_at', { ascending: false })
        .limit(10000)
        .abortSignal(signal);

      if (visitsError) throw visitsError;

      // Fetch touchpoints
      const { data: touchpointsData, error: tpError } = await supabase
        .from('touchpoints')
        .select('*')
        .eq('project_id', projectId)
        .order('touched_at', { ascending: true })
        .abortSignal(signal);

      if (tpError) throw tpError;

      setVisits((visitsData || []).map(v => ({
        id: v.id,
        clientId: v.client_id,
        sessionId: v.session_id,
        utmSource: v.utm_source,
        utmMedium: v.utm_medium,
        utmCampaign: v.utm_campaign,
        sourceType: v.source_type,
        visitedAt: v.visited_at,
        isConversion: v.is_conversion,
      })));

      setTouchpoints((touchpointsData || []).map(tp => ({
        id: tp.id,
        dealId: tp.deal_id,
        position: tp.position,
        totalInChain: tp.total_in_chain,
        isFirst: tp.is_first,
        isLast: tp.is_last,
        sourceType: tp.source_type,
        channelName: tp.channel_name,
        campaignName: tp.campaign_name,
        keyword: tp.keyword,
        dealRevenue: Number(tp.deal_revenue),
        dealProfit: Number(tp.deal_profit),
        touchedAt: tp.touched_at,
      })));

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError') || error.message?.includes('aborted')) {
        return;
      }
      console.error('Error fetching multichannel data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  // Calculate attribution for selected model
  const attributionResults = useMemo((): AttributionResultData[] => {
    // If no real data, use demo data
    if (touchpoints.length === 0) {
      return demoData.map(d => ({ ...d, model: selectedModel }));
    }

    // Group touchpoints by deal
    const dealGroups = new Map<string, TouchpointData[]>();
    for (const tp of touchpoints) {
      const existing = dealGroups.get(tp.dealId) || [];
      existing.push(tp);
      dealGroups.set(tp.dealId, existing);
    }

    // Calculate attribution for each deal
    const channelResults = new Map<string, AttributionResultData>();

    for (const [dealId, dealTouchpoints] of dealGroups) {
      const tps: Touchpoint[] = dealTouchpoints.map(tp => ({
        id: tp.id,
        position: tp.position,
        totalInChain: tp.totalInChain,
        isFirst: tp.isFirst,
        isLast: tp.isLast,
        sourceType: tp.sourceType,
        channelName: tp.channelName,
        campaignName: tp.campaignName || undefined,
        keyword: tp.keyword || undefined,
        touchedAt: new Date(tp.touchedAt),
        dealRevenue: tp.dealRevenue,
        dealProfit: tp.dealProfit,
      }));

      const weights = calculateAttribution(tps, selectedModel, customSettings);

      for (let i = 0; i < tps.length; i++) {
        const tp = tps[i];
        const weight = weights[i];
        const key = tp.channelName;

        const existing = channelResults.get(key);
        if (existing) {
          existing.attributedRevenue += weight.attributedRevenue;
          existing.attributedProfit += weight.attributedProfit;
          if (weight.weight > 0 && weight.weight < 1) {
            existing.assistedConversions += 1;
          }
          if (tp.isLast) {
            existing.sales += 1;
            existing.revenue += tp.dealRevenue;
          }
        } else {
          channelResults.set(key, {
            channelName: tp.channelName,
            sourceType: tp.sourceType,
            model: selectedModel,
            visits: 0,
            leads: 0,
            sales: tp.isLast ? 1 : 0,
            revenue: tp.isLast ? tp.dealRevenue : 0,
            attributedRevenue: weight.attributedRevenue,
            attributedProfit: weight.attributedProfit,
            cpl: 0,
            cac: 0,
            roi: 0,
            assistedConversions: weight.weight > 0 && weight.weight < 1 ? 1 : 0,
          });
        }
      }
    }

    return Array.from(channelResults.values());
  }, [touchpoints, selectedModel, customSettings, demoData]);

  // Calculate comparison model results
  const comparisonResults = useMemo((): AttributionResultData[] | null => {
    if (!compareModel) return null;

    if (touchpoints.length === 0) {
      return demoData.map(d => ({ ...d, model: compareModel }));
    }

    // Similar calculation as above but with compareModel
    const dealGroups = new Map<string, TouchpointData[]>();
    for (const tp of touchpoints) {
      const existing = dealGroups.get(tp.dealId) || [];
      existing.push(tp);
      dealGroups.set(tp.dealId, existing);
    }

    const channelResults = new Map<string, AttributionResultData>();

    for (const [dealId, dealTouchpoints] of dealGroups) {
      const tps: Touchpoint[] = dealTouchpoints.map(tp => ({
        id: tp.id,
        position: tp.position,
        totalInChain: tp.totalInChain,
        isFirst: tp.isFirst,
        isLast: tp.isLast,
        sourceType: tp.sourceType,
        channelName: tp.channelName,
        campaignName: tp.campaignName || undefined,
        keyword: tp.keyword || undefined,
        touchedAt: new Date(tp.touchedAt),
        dealRevenue: tp.dealRevenue,
        dealProfit: tp.dealProfit,
      }));

      const weights = calculateAttribution(tps, compareModel, customSettings);

      for (let i = 0; i < tps.length; i++) {
        const tp = tps[i];
        const weight = weights[i];
        const key = tp.channelName;

        const existing = channelResults.get(key);
        if (existing) {
          existing.attributedRevenue += weight.attributedRevenue;
          existing.attributedProfit += weight.attributedProfit;
          if (weight.weight > 0 && weight.weight < 1) {
            existing.assistedConversions += 1;
          }
        } else {
          channelResults.set(key, {
            channelName: tp.channelName,
            sourceType: tp.sourceType,
            model: compareModel,
            visits: 0,
            leads: 0,
            sales: 0,
            revenue: 0,
            attributedRevenue: weight.attributedRevenue,
            attributedProfit: weight.attributedProfit,
            cpl: 0,
            cac: 0,
            roi: 0,
            assistedConversions: weight.weight > 0 && weight.weight < 1 ? 1 : 0,
          });
        }
      }
    }

    return Array.from(channelResults.values());
  }, [touchpoints, compareModel, customSettings, demoData]);

  // Customer journeys for visualization
  const customerJourneys = useMemo(() => {
    if (touchpoints.length === 0) {
      return demoJourneys;
    }

    const dealGroups = new Map<string, TouchpointData[]>();
    for (const tp of touchpoints) {
      const existing = dealGroups.get(tp.dealId) || [];
      existing.push(tp);
      dealGroups.set(tp.dealId, existing);
    }

    return Array.from(dealGroups.entries()).slice(0, 10).map(([dealId, tps]) => ({
      id: dealId,
      dealId,
      revenue: tps[0]?.dealRevenue || 0,
      touchpoints: tps.sort((a, b) => a.position - b.position).map(tp => ({
        channel: tp.channelName,
        source: tp.sourceType,
        position: tp.position,
      })),
    }));
  }, [touchpoints, demoJourneys]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const results = attributionResults;
    return {
      totalVisits: results.reduce((sum, r) => sum + r.visits, 0) || 107270,
      totalLeads: results.reduce((sum, r) => sum + r.leads, 0) || 2353,
      totalSales: results.reduce((sum, r) => sum + r.sales, 0) || 631,
      totalRevenue: results.reduce((sum, r) => sum + r.attributedRevenue, 0) || 116735000,
      avgTouchpoints: 3.2,
      topChannel: results.sort((a, b) => b.attributedRevenue - a.attributedRevenue)[0]?.channelName || 'Органический поиск',
    };
  }, [attributionResults]);

  return {
    loading,
    visits,
    touchpoints,
    attributionResults,
    comparisonResults,
    customerJourneys,
    summaryStats,
    selectedModel,
    setSelectedModel,
    compareModel,
    setCompareModel,
    customSettings,
    setCustomSettings,
    refetch: fetchData,
  };
}
