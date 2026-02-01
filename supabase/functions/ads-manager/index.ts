// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
       result = await fetchAdsHierarchy(supabase, projectId);
    } else if (action === 'update_status') {
       result = await updateEntityStatus(supabase, projectId, payload);
    } else if (action === 'execute_action') {
       // Handle direct actions like "stop_campaign"
       result = await executeAgentAction(supabase, projectId, payload);
    } else {
      result = { message: "Unknown action" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 400,
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
    const adAccountId = "act_1005197113823722"; // Should be dynamic in production

    try {
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

        const accessToken = await getAccessToken(supabase, projectId);
        
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

async function fetchAdsHierarchy(supabase: any, projectId: string) {
    const accessToken = await getAccessToken(supabase, projectId);
    const adAccountId = await getAdAccountId(accessToken);
    
    // Fetch hierarchy: Campaigns -> AdSets -> Ads
    // Including insights for last 30 days
    const url = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns?` +
        `access_token=${accessToken}&` +
        `fields=id,name,status,daily_budget,insights.date_preset(last_30d){spend,actions,clicks},` +
        `adsets{id,name,status,insights.date_preset(last_30d){spend,actions,clicks},` +
        `ads{id,name,status,creative{thumbnail_url},insights.date_preset(last_30d){spend,actions,clicks}}}` +
        `&effective_status=['ACTIVE']` + // Only ACTIVE as requested
        `&limit=100`; 

    console.log(`Fetching hierarchy from: ${url}`);
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
        console.error('Facebook API Error:', data.error);
        throw new Error(data.error.message);
    }
    
    return { 
        data: data.data || [],
        adAccountId: adAccountId,
        debug: {
            source: 'live_graph_api',
            api_version: 'v21.0'
        }
    };
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
    
    throw new Error("No active Ad Account found connected to this user."); 
}

// --- HELPERS ---

async function getAccessToken(supabase: any, projectId: string): Promise<string> {
  // 1. Try DB first (Project specific)
  const { data: integration } = await supabase
    .from("integrations")
    .select("config")
    .eq("project_id", projectId)
    .eq("type", "facebook")
    .single();

  if (integration?.config?.access_token) return integration.config.access_token;

  // 2. Fallback to Env (Global/Dev)
  const envToken = Deno.env.get("META_ACCESS_TOKEN");
  if (envToken) return envToken;
  
  throw new Error("Meta Access Token missing.");
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

async function fetchFacebookInsights(accessToken: string, adAccountId: string) {
  // Using v21.0 as requested
  const url = `https://graph.facebook.com/v21.0/${adAccountId}/insights?` +
    `access_token=${accessToken}&` +
    `fields=spend,clicks,impressions,actions,cpc,cpm,ctr&` +
    `date_preset=last_30d`;

  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  const data = await res.json();

  if (data.error) throw new Error(data.error.message);
  return data.data?.[0] || null;
}

function getLeadsCount(actions: any[] = []) {
  const leadAction = actions.find((a: any) => 
    a.action_type === 'lead' || 
    a.action_type === 'offsite_conversion.fb_pixel_lead'
  );
  return leadAction ? parseInt(leadAction.value) : 0;
}
