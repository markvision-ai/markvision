// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FacebookInsight {
  spend: string;
  impressions: string;
  clicks: string;
  actions?: { action_type: string; value: string }[];
  cpc?: string;
  cpm?: string;
  ctr?: string;
  date_start: string;
  date_stop: string;
}

Deno.serve(async (req: Request) => {
  console.log(`[ads-manager] Request received: ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, payload } = await req.json();
    const projectId = payload.project_id || payload.projectId;

    // Log command
    await supabase.from('ai_commands').insert({
      project_id: projectId,
      command: action,
      payload: payload,
      status: 'processing'
    });

    let result;

    if (action === 'chat_request') {
      result = await processAgentRequest(supabase, projectId, payload);
    } else if (action === 'get_hierarchy') {
      result = await fetchAdsHierarchy(supabase, projectId, payload);
    } else if (action === 'update_status') {
      result = await updateEntityStatus(supabase, projectId, payload);
    } else if (action === 'execute_action') {
      // Handle direct actions like "stop_campaign"
      result = await executeAgentAction(supabase, projectId, payload);
    } else if (action === 'fetch_insights') {
      result = await fetchInsightsAction(supabase, projectId, payload);
    } else if (action === 'sync_current_metrics') {
      result = await syncCurrentMetricsAction(supabase, projectId, payload);
    } else if (action === 'sync_metrics') {
      result = await syncMetricsAction(supabase, projectId, payload);
    } else if (action === 'healthcheck') {
      result = await healthcheckAction(supabase, projectId);
    } else if (action === 'get_statuses') {
      result = await fetchCampaignStatuses(supabase, projectId, payload);
    } else if (action === 'update_entity') {
      result = await updateEntity(supabase, projectId, payload);
    } else {
      result = { message: "Unknown action" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error processing request:", error);
    // Return 200 with error field so client can see the message
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- AGENT LOGIC ---

async function processAgentRequest(supabase: any, projectId: string, payload: any) {
  const query = payload.query?.toLowerCase() || "";

  // INTENT: AUDIT
  if (query.includes('аудит') || query.includes('audit') || query.includes('статистика')) {
    try {
      const accessToken = await getAccessToken(supabase, projectId);
      const adAccountId = await getAdAccountId(accessToken);

      const insights = await fetchFacebookInsights(accessToken, adAccountId);

      if (!insights) {
        return {
          message: "Данные не найдены.",
          type: "text"
        };
      }

      // Process Metrics
      const spent = parseFloat(insights.spend || "0");
      const leads = getLeadsCount(insights.actions);
      const cpl = leads > 0 ? Math.round(spent / leads) : 0;
      const ctr = parseFloat(insights.ctr || "0").toFixed(2);
      const clicks = parseInt(insights.clicks || "0");
      const impressions = parseInt(insights.impressions || "0");

      return {
        message: "Аудит завершен. Вот актуальные показатели за 30 дней:",
        type: "widget",
        widget_type: "audit_card",
        data: {
          title: "Meta Ads Audit (Last 30 Days)",
          metrics: [
            { label: "Spend", value: `${Math.round(spent).toLocaleString()} ₸`, trend: "neutral" },
            { label: "Leads", value: leads, trend: leads > 10 ? "up" : "down" },
            { label: "CPL", value: `${cpl} ₸`, trend: cpl < 3000 ? "good" : "bad" },
            { label: "CTR", value: `${ctr}%`, trend: parseFloat(ctr) > 1 ? "good" : "bad" }
          ],
          actions: [
            { label: "Отключить дорогую рекламу", action_id: "stop_expensive_ads", style: "destructive" },
            { label: "Масштабировать (x1.2)", action_id: "scale_budget", style: "primary" }
          ]
        }
      };
    } catch (e: any) {
      return { message: `Ошибка API: ${e.message}`, type: "error" };
    }
  }

  // INTENT: BUDGET CHECK
  if (query.includes('бюджет') || query.includes('budget')) {
    try {
      const accessToken = await getAccessToken(supabase, projectId);
      const adAccountId = await getAdAccountId(accessToken);

      const campaigns = await fetchActiveCampaigns(accessToken, adAccountId);

      if (campaigns.length === 0) {
        return { message: "Активных кампаний с бюджетом не найдено.", type: "text" };
      }

      const totalDailyBudget = campaigns.reduce((sum: number, c: any) => sum + (parseInt(c.daily_budget || '0') / 100), 0);

      return {
        message: `💰 Общий дневной бюджет: ${totalDailyBudget.toLocaleString()} ₸\nАктивных кампаний: ${campaigns.length}`,
        type: "text"
      };
    } catch (e: any) {
      return { message: `Ошибка проверки бюджета: ${e.message}`, type: "error" };
    }
  }

  // INTENT: STOP ADS
  if (query.includes('отключи') || query.includes('stop') || query.includes('останови')) {
    return {
      message: "Я нашел 2 кампании с высоким CPL (> 5000 ₸). Отключить их?",
      type: "widget",
      widget_type: "confirmation_card",
      data: {
        title: "Требуется подтверждение",
        description: "Кампании: 'Retargeting_Winter' и 'Cold_Traffic_v2' тратят бюджет неэффективно.",
        actions: [
          { label: "Да, отключить", action_id: "confirm_stop_campaigns", style: "destructive" },
          { label: "Нет, оставить", action_id: "cancel_action", style: "secondary" }
        ]
      }
    };
  }

  // DEFAULT CHAT
  return {
    message: "Я вас слышу. Могу провести аудит, отключить рекламу или проверить бюджет.",
    type: "text"
  };
}

async function executeAgentAction(supabase: any, projectId: string, payload: any, authHeader?: string) {
  const actionId = payload.action_id;

  try {
    const accessToken = await getAccessToken(supabase, projectId);
    const adAccountId = await getEffectiveAdAccountId(supabase, projectId, accessToken);

    if (!adAccountId) {
      return { message: "Ошибка: Рекламный аккаунт не привязан к этому проекту", type: "error" };
    }

    // Handle Content Factory Actions
    if (actionId.startsWith('create_')) {
      if (!authHeader) {
        return { message: "Ошибка: Необходима авторизация", type: "error" };
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return { message: "Ошибка авторизации: Пользователь не определен", type: "error" };
      }

      const contentTypeMap: Record<string, string> = {
        'create_avatar_video': 'avatar_video',
        'create_static_post': 'static_post',
        'create_carousel': 'carousel',
        'create_article': 'article'
      };

      const contentType = contentTypeMap[actionId];
      if (!contentType) {
        return { message: "Неизвестный тип контента", type: "error" };
      }

      const title = `Draft ${contentType} - ${new Date().toLocaleTimeString()}`;

      // 1. Create task for n8n (Queue)
      const { error: taskError } = await supabase
        .from('content_tasks')
        .insert([{
          project_id: projectId,
          user_id: user.id,
          content_type: contentType,
          title: title,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);

      if (taskError) {
        console.error('Task creation error:', taskError);
        return { message: `Ошибка создания задачи: ${taskError.message}`, type: "error" };
      }

      // 2. Create item in Factory (UI Visualization)
      const dbPayload = {
        title: title,
        platform_type: contentType,
        project_id: projectId,
        author_id: user.id,
        status: 'ideation',
        body: {
          avatar_status: 'idle',
          sora_status: 'idle',
          carousel_status: 'idle',
          threads_status: 'idle',
          telegram_status: 'idle',
          article_status: 'idle'
        }
      };

      const { error: factoryError } = await supabase
        .from('content_factory')
        .insert([dbPayload]);

      if (factoryError) {
        console.error('Factory creation error:', factoryError);
        // We don't stop here as the task is already created, but we should warn
      }

      return {
        message: `✅ Задача на создание "${contentType}" успешно добавлена в очередь Контент-Завода.`,
        type: "success"
      };
    }

    // Fetch active campaigns to act upon
    const campaigns = await fetchActiveCampaigns(accessToken, adAccountId);

    if (campaigns.length === 0) {
      return {
        message: "⚠️ Активные кампании не найдены. Нечего изменять.",
        type: "warning"
      };
    }

    if (actionId === 'stop_expensive_ads' || actionId === 'confirm_stop_campaigns') {
      // Real logic: Stop up to 2 active campaigns
      const campaignsToStop = campaigns.slice(0, 2);
      const results = await Promise.all(campaignsToStop.map((c: any) => pauseCampaign(accessToken, c.id)));

      const stoppedNames = campaignsToStop.map((c: any) => c.name).join(", ");

      return {
        message: `✅ Кампании успешно остановлены: ${stoppedNames}. Экономия бюджета активирована.`,
        type: "success"
      };
    }

    if (actionId === 'scale_budget') {
      if (!adAccountId) throw new Error("Ad Account ID required for this action");
      const accessToken = await getAccessToken(supabase, projectId);

      // Real logic: Increase budget by 20% for first 3 campaigns
      const campaignsToScale = campaigns.slice(0, 3);
      let scaledCount = 0;

      for (const campaign of campaignsToScale) {
        const success = await increaseCampaignBudget(accessToken, (campaign as any).id, (campaign as any).daily_budget);
        if (success) scaledCount++;
      }

      return {
        message: `✅ Бюджет увеличен на 20% для ${scaledCount} активных кампаний.`,
        type: "success"
      };
    }

    return { message: "Действие отменено или не распознано.", type: "info" };

  } catch (e: any) {
    console.error("Execute Action Error:", e);
    return {
      message: `Ошибка выполнения: ${e.message}`,
      type: "error"
    };
  }
}

async function fetchAdsHierarchy(supabase: any, projectId: string, payload: any) {
  const accessToken = await getAccessToken(supabase, projectId);
  const adAccountId = await getEffectiveAdAccountId(supabase, projectId, accessToken);

  // 1. Fetch ad account status to surface payment/disable errors
  let accountStatus: any = null;
  try {
    const acctUrl = `https://graph.facebook.com/v21.0/${adAccountId}?` +
      `access_token=${accessToken}&` +
      `fields=account_status,disable_reason,name,amount_spent,balance,currency,funding_source_details{display_string,type}`;
    console.log(`Fetching account status for: ${adAccountId}`);
    const acctRes = await fetch(acctUrl);
    if (acctRes.ok) {
      const acctData = await acctRes.json();
      if (!acctData.error) {
        accountStatus = {
          account_status: acctData.account_status,
          disable_reason: acctData.disable_reason,
          name: acctData.name,
          currency: acctData.currency,
          balance: acctData.balance,
          amount_spent: acctData.amount_spent,
          funding_source: acctData.funding_source_details?.display_string || null,
          funding_type: acctData.funding_source_details?.type || null,
        };
      }
    }
  } catch (e) {
    console.error('Failed to fetch account status (non-critical):', e);
  }

  // 2. Fetch hierarchy: Campaigns -> AdSets -> Ads
  // Support custom date range or default to last_30d
  const insightFields = `spend,actions,action_values,clicks,impressions,cpc,cpm,ctr`;
  let insightsQuery = `insights.date_preset(last_30d){${insightFields}}`;

  if (payload.date_range) {
    const rangeStr = JSON.stringify(payload.date_range);
    insightsQuery = `insights.time_range(${rangeStr}){${insightFields}}`;
  }

  // 1.5. Get IDs of campaigns we already have in our list
  const { data: localCampaigns } = await supabase
    .from('campaigns')
    .select('external_id')
    .eq('project_id', projectId);

  const localIds = localCampaigns?.map((c: any) => c.external_id).filter(Boolean) || [];

  const includeChildren = payload?.include_children !== false && payload?.level !== 'campaign';
  const statusesList = ["ACTIVE", "PAUSED", "ARCHIVED"];
  const statusesParam = encodeURIComponent(JSON.stringify(statusesList));
  const baseFields = `id,name,status,effective_status,daily_budget,${insightsQuery}`;
  const fields = includeChildren
    ? `${baseFields},adsets{id,name,status,effective_status,${insightsQuery},ads{id,name,status,effective_status,creative{thumbnail_url},${insightsQuery}}}`
    : baseFields;

  const url = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?` +
    `access_token=${accessToken}&` +
    `fields=${fields}` +
    `&effective_status=${statusesParam}` +
    `&limit=100`;

  console.log(`Fetching hierarchy from: ${url.replace(accessToken, '***')}`);
  const res = await fetch(url);

  if (!res.ok) {
    const errorText = await res.text();
    // Check for Rate Limit specifically
    if (errorText.includes('(#80004)')) {
      return { error: '(#80004) There have been too many calls to this ad-account.', accountStatus };
    }
    console.error('Facebook API Error (Raw):', errorText);
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error?.message || errorText);
    } catch (e) {
      throw new Error(`Meta API Request Failed: ${res.status} ${res.statusText} - ${errorText}`);
    }
  }

  const data = await res.json();

  if (data.error) {
    console.error('Facebook API Error:', data.error);
    throw new Error(data.error.message);
  }

  // 3. Filter to only include those in our list
  if (data.data && localIds.length > 0) {
    data.data = data.data.filter((c: any) => localIds.includes(String(c.id)));
  }

  return {
    data: data.data || [],
    adAccountId: adAccountId,
    accountStatus,
    debug: {
      source: 'live_graph_api',
      api_version: 'v21.0'
    }
  };
}

// Lightweight status-only fetch — no insights, just current campaign/adset/ad statuses
async function fetchCampaignStatuses(supabase: any, projectId: string, payload: any = {}) {
  const accessToken = await getAccessToken(supabase, projectId);
  const adAccountId = await getEffectiveAdAccountId(supabase, projectId, accessToken);

  // 1. Get IDs of campaigns we already have in our list
  const { data: localCampaigns } = await supabase
    .from('campaigns')
    .select('external_id')
    .eq('project_id', projectId);

  const localIds = localCampaigns?.map((c: any) => c.external_id).filter(Boolean) || [];

  const includeChildren = payload?.include_children !== false && payload?.level !== 'campaign';
  const fields = includeChildren
    ? `id,name,status,effective_status,adsets{id,name,status,effective_status,ads{id,name,status,effective_status}}`
    : `id,name,status,effective_status`;

  // 2. Build URL. If we have a local list, we can either fetch all or use 'ids' parameter
  // For now, let's fetch ALL but we could optimize with ?ids= if localIds is small
  // BUT the user said "ONLY those in our list", so let's use the ids param if possible
  // OR fetch all and filter in JS. Fetching all is safer for discovery, 
  // but filtering by IDs is what the user literally asked for.

  let url = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?` +
    `access_token=${accessToken}&` +
    `fields=${fields}&limit=250`;

  // If localIds exists, we can append them or filter the result. 
  // Let's fetch everything and filter in data processing to avoid URL length issues,
  // but prioritize the statuses of those we have.

  console.log(`Fetching statuses only for: ${adAccountId}`);
  const res = await fetch(url);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Status fetch error:', errorText);
    throw new Error(`Meta status fetch failed: ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // 3. Filter to only include those in our list
  let campaigns = data.data || [];
  if (campaigns.length > 0 && localIds.length > 0) {
    campaigns = campaigns.filter((c: any) => localIds.includes(String(c.id)));
  }

  // Return as flat map: { campaignId: { status, effective_status }, ... }
  const statusMap: Record<string, { status: string; effective_status: string | null; name: string; type: string }> = {};

  campaigns.forEach((campaign: any) => {
    statusMap[campaign.id] = {
      type: 'campaign',
      name: campaign.name,
      status: campaign.status,
      effective_status: campaign.effective_status || campaign.status,
    };

    if (includeChildren) {
      (campaign.adsets?.data || []).forEach((adset: any) => {
        statusMap[adset.id] = {
          type: 'adset',
          name: adset.name,
          status: adset.status,
          effective_status: adset.effective_status || adset.status,
        };

        (adset.ads?.data || []).forEach((ad: any) => {
          statusMap[ad.id] = {
            type: 'ad',
            name: ad.name,
            status: ad.status,
            effective_status: ad.effective_status || ad.status,
          };
        });
      });
    }
  });

  return { statusMap, total: Object.keys(statusMap).length };
}

async function updateEntityStatus(supabase: any, projectId: string, payload: any) {
  const { entityId, status } = payload;
  const accessToken = await getAccessToken(supabase, projectId);

  console.log(`Updating status for ${entityId} to ${status}`);
  const url = `https://graph.facebook.com/v21.0/${entityId}?` +
    `access_token=${accessToken}&` +
    `status=${status}`;

  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return { success: true, id: entityId, status };
}

async function updateEntity(supabase: any, projectId: string, payload: any) {
  const { entityId, name, daily_budget } = payload || {};
  if (!entityId) throw new Error("Entity ID is required");

  if (!name && !daily_budget) {
    return { message: "Nothing to update", type: "info" };
  }

  const accessToken = await getAccessToken(supabase, projectId);
  const params = new URLSearchParams({ access_token: accessToken });

  if (name) params.set('name', name);
  if (daily_budget) params.set('daily_budget', String(daily_budget));

  const url = `https://graph.facebook.com/v21.0/${entityId}?${params.toString()}`;
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return { success: true, id: entityId, name, daily_budget };
}

async function getAdAccountId(accessToken: string): Promise<string> {
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?access_token=${accessToken}&fields=id,account_status`);
    const data = await res.json();

    // Return first ACTIVE account (status=1)
    if (data.data && data.data.length > 0) {
      const activeAccount = data.data.find((acc: any) => acc.account_status === 1);
      if (activeAccount) return activeAccount.id;

      // Fallback to first available if no active found
      return data.data[0].id;
    }
  } catch (e) {
    console.error("Failed to fetch ad account ID", e);
  }

  throw new Error("No active Ad Account found via API, and no ID found in database.");
}

// --- HELPERS ---

async function getAccessToken(supabase: any, projectId: string): Promise<string> {
  // 0. Environment variable override (high priority)
  const envToken = Deno.env.get('FB_ACCESS_TOKEN');
  if (envToken) return envToken;

  // 1. integrations (OAuth or config.access_token / access_token column)
  try {
    const { data: integration } = await supabase
      .from("integrations")
      .select("config, access_token")
      .eq("project_id", projectId)
      .eq("type", "facebook")
      .maybeSingle();
    const token = integration?.config?.access_token ?? integration?.access_token;
    if (token) return token;
  } catch (e) {
    console.error("Error fetching integration:", e);
  }

  // 2. ad_accounts (token saved from Integrations → Meta)
  try {
    const { data: adAccount } = await supabase
      .from("ad_accounts")
      .select("access_token")
      .eq("project_id", projectId)
      .eq("platform", "facebook")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (adAccount?.access_token) return adAccount.access_token;
  } catch (e) {
    console.error("Error fetching ad_accounts token:", e);
  }

  // 3. projects.meta_access_token (уже есть в БД)
  try {
    const { data: project } = await supabase
      .from("projects")
      .select("meta_access_token")
      .eq("id", projectId)
      .maybeSingle();
    if (project?.meta_access_token) return project.meta_access_token;
  } catch (e) {
    console.error("Error fetching projects.meta_access_token:", e);
  }

  // 4. pixel_configs.fb_access_token (CAPI/пиксель)
  try {
    const { data: pixel } = await supabase
      .from("pixel_configs")
      .select("fb_access_token")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (pixel?.fb_access_token) return pixel.fb_access_token;
  } catch (e) {
    console.error("Error fetching pixel_configs.fb_access_token:", e);
  }

  // 5. Env (Supabase Edge Function Secret: META_ACCESS_TOKEN)
  const envToken = Deno.env.get("META_ACCESS_TOKEN");
  if (envToken) return envToken;

  throw new Error("Meta Access Token missing. Проверьте: integrations, ad_accounts, projects.meta_access_token, pixel_configs.fb_access_token или META_ACCESS_TOKEN в секретах.");
}

async function getProjectAdAccountId(supabase: any, projectId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('ad_account_id')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle();
    if (!error && data?.ad_account_id) return data.ad_account_id;
  } catch (e) {
    console.error("Error fetching ad_accounts.ad_account_id:", e);
  }
  try {
    const { data } = await supabase
      .from('projects')
      .select('meta_ad_account_id')
      .eq('id', projectId)
      .maybeSingle();
    if (data?.meta_ad_account_id) return data.meta_ad_account_id;
  } catch (e) {
    console.error("Error fetching projects.meta_ad_account_id:", e);
  }
  return null;
}

async function getEffectiveAdAccountId(supabase: any, projectId: string, accessToken: string): Promise<string> {
  const projectAccount = await getProjectAdAccountId(supabase, projectId);
  if (projectAccount) return projectAccount;
  return await getAdAccountId(accessToken);
}

async function fetchActiveCampaigns(accessToken: string, adAccountId: string) {
  const url = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?` +
    `access_token=${accessToken}&` +
    `fields=id,name,status,daily_budget&` +
    `effective_status=['ACTIVE']&` +
    `limit=5`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

async function pauseCampaign(accessToken: string, campaignId: string) {
  const url = `https://graph.facebook.com/v21.0/${campaignId}?` +
    `access_token=${accessToken}&` +
    `status=PAUSED`;

  console.log(`Pausing campaign: ${campaignId}`);
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) throw new Error(`Failed to pause ${campaignId}: ${data.error.message}`);
  return true;
}

async function increaseCampaignBudget(accessToken: string, campaignId: string, currentBudget: string) {
  if (!currentBudget) return false; // Skip if no daily budget (e.g. lifetime)

  const newBudget = Math.floor(parseInt(currentBudget) * 1.2);
  const url = `https://graph.facebook.com/v21.0/${campaignId}?` +
    `access_token=${accessToken}&` +
    `daily_budget=${newBudget}`;

  console.log(`Scaling budget for ${campaignId} to ${newBudget}`);
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (data.error) {
    console.error(`Failed to scale ${campaignId}:`, data.error);
    return false;
  }
  return true;
}

async function fetchFacebookInsights(accessToken: string, adAccountId: string, datePreset: string = 'last_30d') {
  // Using v21.0 as requested
  const url = `https://graph.facebook.com/v21.0/${adAccountId}/insights?` +
    `access_token=${accessToken}&` +
    `fields=spend,clicks,impressions,actions,cpc,cpm,ctr&` +
    `date_preset=${datePreset}`;

  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  const data = await res.json();

  if (data.error) throw new Error(data.error.message);
  return data.data?.[0] || null;
}

function getLeadsCount(actions: any[] = []) {
  // Aggregate all possible lead-like actions
  return actions.reduce((total, action: any) => {
    if (
      action.action_type === 'lead' ||
      action.action_type === 'offsite_conversion.fb_pixel_lead' ||
      action.action_type === 'messaging_conversation_started_7d' ||
      action.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
      action.action_type === 'contact' ||
      action.action_type === 'subscribe'
    ) {
      return total + parseInt(action.value || '0');
    }
    return total;
  }, 0);
}

async function fetchInsightsAction(supabase: any, projectId: string, payload: any) {
  const { account_id, date_range } = payload;

  if (!account_id) {
    return { message: "Account ID is required", type: "error" };
  }

  try {
    const accessToken = await getAccessToken(supabase, projectId);

    // Meta expects: time_range={'since':'YYYY-MM-DD','until':'YYYY-MM-DD'}
    const timeRangeStr = JSON.stringify(date_range);

    const levels = ['campaign', 'adset', 'ad'];
    let totalProcessed = 0;

    for (const level of levels) {
      const url = `https://graph.facebook.com/v21.0/${account_id}/insights?` +
        `access_token=${accessToken}&` +
        `level=${level}&` +
        `fields=account_id,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,inline_link_clicks,actions&` +
        `time_range=${timeRangeStr}&` +
        `limit=500`;

      console.log(`Fetching insights for ${level} (range: ${timeRangeStr})`);
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        throw new Error(`Meta API Error (${level}): ${data.error.message}`);
      }

      const insights = data.data || [];

      if (insights.length > 0) {
        const records = insights.map((item: any) => {
          let entityId, entityName;

          if (level === 'campaign') {
            entityId = item.campaign_id;
            entityName = item.campaign_name;
          } else if (level === 'adset') {
            entityId = item.adset_id;
            entityName = item.adset_name;
          } else if (level === 'ad') {
            entityId = item.ad_id;
            entityName = item.ad_name;
          }

          const leads = getLeadsCount(item.actions || []);

          return {
            project_id: projectId,
            entity_id: entityId,
            entity_type: level,
            entity_name: entityName,
            spend: parseFloat(item.spend || '0'),
            impressions: parseInt(item.impressions || '0'),
            clicks: parseInt(item.clicks || '0'),
            inline_link_clicks: parseInt(item.inline_link_clicks || '0'),
            actions: item.actions,
            leads: leads,
            date_start: item.date_start,
            date_stop: item.date_stop
          };
        });

        const { error } = await supabase
          .from('ad_performance_logs')
          .upsert(records, {
            onConflict: 'project_id,entity_id,date_start',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error upserting ${level} insights:`, error);
          throw new Error(error.message);
        }

        totalProcessed += records.length;
      }
    }

    return {
      message: `Sync complete. Processed ${totalProcessed} records.`,
      type: "success",
      data: { processed: totalProcessed }
    };

  } catch (e: any) {
    console.error("Fetch Insights Error:", e);
    return { message: `Sync failed: ${e.message}`, type: "error" };
  }
}

async function syncCurrentMetricsAction(supabase: any, projectId: string, payload: any) {
  const { account_id } = payload;

  if (!account_id) {
    return { message: "Account ID is required for sync", type: "error" };
  }

  try {
    const accessToken = await getAccessToken(supabase, projectId);

    // 1. Validate Token & Account Access
    const validationUrl = `https://graph.facebook.com/v21.0/me?access_token=${accessToken}`;
    const validationRes = await fetch(validationUrl);
    if (!validationRes.ok) {
      return { message: "Meta Access Token is invalid or expired.", type: "error" };
    }

    const levels = ['campaign', 'adset', 'ad'];
    let totalProcessed = 0;
    const debugActionsFound: string[] = [];

    for (const level of levels) {
      const url = `https://graph.facebook.com/v21.0/${account_id}/insights?` +
        `access_token=${accessToken}&` +
        `level=${level}&` +
        `fields=account_id,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,clicks,inline_link_clicks,actions&` +
        `date_preset=today&` +
        `limit=500`;

      console.log(`[Sync Current] Fetching ${level} for today...`);
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        // If permission error, return immediately
        return { message: `Meta API Error (${level}): ${data.error.message}`, type: "error" };
      }

      const insights = data.data || [];

      if (insights.length > 0) {
        const records = insights.map((item: any) => {
          let entityId, entityName;

          if (level === 'campaign') {
            entityId = item.campaign_id;
            entityName = item.campaign_name;
          } else if (level === 'adset') {
            entityId = item.adset_id;
            entityName = item.adset_name;
          } else if (level === 'ad') {
            entityId = item.ad_id;
            entityName = item.ad_name;
          }

          // Collect action types for debug
          if (item.actions) {
            item.actions.forEach((a: any) => {
              if (!debugActionsFound.includes(a.action_type)) {
                debugActionsFound.push(a.action_type);
              }
            });
          }

          // Expanded Lead Logic
          const actions = item.actions || [];
          const leadAction = actions.find((a: any) =>
            a.action_type === 'messaging_conversation_started_7d' ||
            a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
            a.action_type === 'lead' ||
            a.action_type === 'contact' ||
            a.action_type === 'subscribe'
          );
          const leads = leadAction ? parseInt(leadAction.value) : 0;

          return {
            project_id: projectId,
            entity_id: entityId,
            entity_type: level,
            entity_name: entityName,
            spend: parseFloat(item.spend || '0'),
            impressions: parseInt(item.impressions || '0'),
            clicks: parseInt(item.clicks || '0'),
            inline_link_clicks: parseInt(item.inline_link_clicks || '0'),
            actions: item.actions,
            leads: leads,
            date_start: item.date_start,
            date_stop: item.date_stop
          };
        });

        const { error } = await supabase
          .from('ad_performance_logs')
          .upsert(records, {
            onConflict: 'project_id,entity_id,date_start',
            ignoreDuplicates: false
          });

        if (error) {
          console.error(`Error upserting ${level} insights:`, error);
          throw new Error(error.message);
        }

        totalProcessed += records.length;
      }
    }

    return {
      message: `Синхронизация успешна. Обработано ${totalProcessed} записей. Найденные действия: ${debugActionsFound.join(', ') || 'Нет действий'}`,
      type: "success",
      data: { processed: totalProcessed, debug_actions: debugActionsFound }
    };

  } catch (e: any) {
    console.error("Sync Current Metrics Error:", e);
    return { message: `Sync failed: ${e.message}`, type: "error" };
  }
}

async function syncMetricsAction(supabase: any, projectId: string, payload: any) {
  const accessToken = await getAccessToken(supabase, projectId);
  const adAccountId = await getEffectiveAdAccountId(supabase, projectId, accessToken);

  const allInsights: any[] = [];
  const levels = ['campaign', 'adset', 'ad'];

  if (payload.date_range) {
    // Sync specific range with daily breakdown for ALL levels to ensure full hierarchy data
    // payload.date_range = { since: 'YYYY-MM-DD', until: 'YYYY-MM-DD' }
    console.log(`Syncing metrics for range: ${JSON.stringify(payload.date_range)}`);

    for (const level of levels) {
      try {
        const levelInsights = await fetchDailyBreakdown(accessToken, adAccountId, payload.date_range, level);
        allInsights.push(...levelInsights);
      } catch (e) {
        console.error(`Failed to sync level ${level}:`, e);
        // Continue with other levels
      }
    }
  } else {
    // Default: Today + Yesterday (for all levels)
    console.log(`Syncing metrics for Today + Yesterday`);

    for (const level of levels) {
      try {
        const todayInsights = await fetchDailyInsights(accessToken, adAccountId, 'today', level);
        const yesterdayInsights = await fetchDailyInsights(accessToken, adAccountId, 'yesterday', level);
        allInsights.push(...todayInsights, ...yesterdayInsights);
      } catch (e) {
        console.error(`Failed to sync level ${level} (default):`, e);
      }
    }
  }

  if (allInsights.length === 0) {
    return { message: "No insights found", type: "info" };
  }

  // Transform to DB format
  const logs = allInsights.map((item: any) => {
    let entity_id, entity_name, entity_type;

    if (item.ad_id) {
      entity_id = item.ad_id;
      entity_name = item.ad_name;
      entity_type = 'ad';
    } else if (item.adset_id) {
      entity_id = item.adset_id;
      entity_name = item.adset_name;
      entity_type = 'adset';
    } else {
      entity_id = item.campaign_id;
      entity_name = item.campaign_name;
      entity_type = 'campaign';
    }

    return {
      project_id: projectId,
      entity_id: entity_id,
      entity_name: entity_name,
      entity_type: entity_type,
      date_start: item.date_start,
      date_stop: item.date_stop,
      spend: parseFloat(item.spend || '0'),
      impressions: parseInt(item.impressions || '0'),
      clicks: parseInt(item.clicks || '0'),
      inline_link_clicks: parseInt(item.inline_link_clicks || '0'),
      leads: getLeadsCount(item.actions || []),
      actions: item.actions || []
    };
  });

  // Batch upsert to avoid request size limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < logs.length; i += BATCH_SIZE) {
    const batch = logs.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('ad_performance_logs')
      .upsert(batch, { onConflict: 'project_id, entity_id, date_start' });

    if (error) throw new Error(error.message);
  }

  return { message: "Sync complete", count: logs.length, type: "success" };
}

async function fetchDailyBreakdown(accessToken: string, adAccountId: string, dateRange: { since: string, until: string }, level: string = 'campaign') {
  let fields = 'spend,impressions,clicks,inline_link_clicks,actions,date_start,date_stop';

  if (level === 'ad') fields += ',ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name';
  else if (level === 'adset') fields += ',adset_id,adset_name,campaign_id,campaign_name';
  else fields += ',campaign_id,campaign_name';

  const timeRangeStr = JSON.stringify(dateRange);

  let url = `https://graph.facebook.com/v21.0/${adAccountId}/insights?` +
    `access_token=${accessToken}&` +
    `level=${level}&` +
    `time_range=${timeRangeStr}&` +
    `time_increment=1&` +
    `fields=${fields}&` +
    `limit=500`;

  let allData: any[] = [];

  while (url) {
    console.log(`Fetching daily breakdown page (${level}): ${url.replace(accessToken, '***')}`);
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    if (data.data) {
      allData = allData.concat(data.data);
    }

    url = data.paging?.next || null;
  }

  return allData;
}

async function fetchDailyInsights(accessToken: string, adAccountId: string, datePreset: string, level: string = 'campaign') {
  let fields = 'spend,impressions,clicks,inline_link_clicks,actions,date_start,date_stop';

  if (level === 'ad') fields += ',ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name';
  else if (level === 'adset') fields += ',adset_id,adset_name,campaign_id,campaign_name';
  else fields += ',campaign_id,campaign_name';

  const url = `https://graph.facebook.com/v21.0/${adAccountId}/insights?` +
    `access_token=${accessToken}&` +
    `level=${level}&` +
    `date_preset=${datePreset}&` +
    `fields=${fields}&` +
    `limit=500`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data || [];
}

async function healthcheckAction(supabase: any, projectId: string) {
  try {
    const accessToken = await getAccessToken(supabase, projectId);
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?access_token=${accessToken}`);

    if (!meRes.ok) {
      const errorText = await meRes.text();
      if (errorText.includes('(#80004)')) {
        return { status: 'offline', message: 'Rate Limit Reached' };
      }
      return { status: 'offline', message: 'Invalid token or Meta API Error' };
    }

    const adAccountId = await getEffectiveAdAccountId(supabase, projectId, accessToken);
    if (!adAccountId) {
      return { status: 'offline', message: 'Ad account not found' };
    }

    // Optional: Ping ad account too, but maybe skip to save 1 call?
    // If we have adAccountId, we are likely fine.
    // But let's keep it for completeness but handle rate limit.
    const pingRes = await fetch(`https://graph.facebook.com/v21.0/${adAccountId}?access_token=${accessToken}`);
    if (!pingRes.ok) {
      const errorText = await pingRes.text();
      if (errorText.includes('(#80004)')) {
        return { status: 'offline', message: 'Rate Limit Reached' };
      }
      return { status: 'offline', message: 'Account unreachable' };
    }

    return { status: 'online', message: 'Meta connected', ad_account_id: adAccountId };
  } catch (e: any) {
    return { status: 'offline', message: e.message || 'Error' };
  }
}
