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

Deno.serve(async (req) => {
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

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, payload } = await req.json();
    const projectId = payload.project_id || payload.projectId;

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // Log command to ai_commands table (audit log)
    const { data: logEntry, error: logError } = await supabase
      .from('ai_commands')
      .insert({
        project_id: projectId,
        user_id: user.id,
        command: action,
        payload: payload,
        status: 'pending'
      })
      .select()
      .single();

    if (logError) {
      console.error("Failed to log command:", logError);
    }

    let result;

    switch (action) {
      case 'create_campaign':
        result = await createCampaign(supabase, payload);
        break;
      case 'start_campaign':
        result = await updateCampaignStatus(supabase, payload.id, true);
        break;
      case 'stop_campaign':
        result = await updateCampaignStatus(supabase, payload.id, false);
        break;
      case 'delete_campaign':
        result = await deleteCampaign(supabase, payload.id);
        break;
      case 'optimize_campaigns':
        result = await optimizeCampaigns(supabase, projectId);
        break;
      case 'chat_request':
        result = await processChatRequest(supabase, projectId, payload);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update log entry with success
    if (logEntry) {
      await supabase
        .from('ai_commands')
        .update({
          status: 'completed',
          result: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// --- Helper Functions ---

async function getAccessToken(supabase: any, projectId: string): Promise<string> {
  // 1. Try Environment Variable (Priority for dev/single user)
  const envToken = Deno.env.get("META_ACCESS_TOKEN");
  if (envToken) return envToken;

  // 2. Try Integrations Table
  const { data: integration } = await supabase
    .from("integrations")
    .select("config")
    .eq("project_id", projectId)
    .eq("type", "facebook")
    .single();

  if (integration?.config?.access_token) {
    return integration.config.access_token;
  }

  throw new Error("Meta Access Token not found. Please set META_ACCESS_TOKEN secret or connect Facebook integration.");
}

async function getAdAccountId(accessToken: string, supabase: any, projectId: string): Promise<string> {
  // 1. Check ad_accounts table
  const { data: account } = await supabase
    .from("ad_accounts")
    .select("ad_account_id")
    .eq("project_id", projectId)
    .single();

  if (account?.ad_account_id) {
    return account.ad_account_id;
  }

  // 2. Fetch from Facebook API if not in DB
  console.log("Fetching ad accounts from Facebook API...");
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status`
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(`Facebook API Error: ${data.error.message}`);
  }

  const accounts = data.data || [];
  const activeAccount = accounts.find((a: any) => a.account_status === 1) || accounts[0];

  if (!activeAccount) {
    throw new Error("No Facebook Ad Accounts found for this user.");
  }

  return activeAccount.id; // Format: "act_123456789"
}

async function fetchFacebookInsights(accessToken: string, adAccountId: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  const dateRange = {
    since: startDate.toISOString().split("T")[0],
    until: endDate.toISOString().split("T")[0],
  };

  const url = `https://graph.facebook.com/v19.0/${adAccountId}/insights?` +
    `access_token=${accessToken}&` +
    `fields=spend,clicks,impressions,actions,cpc,cpm,ctr&` +
    `time_range=${JSON.stringify(dateRange)}&` +
    `time_increment=all_days`; // Aggregate over the period

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    throw new Error(`Insights Error: ${data.error.message}`);
  }

  return data.data?.[0] || null; // Return aggregated data
}

async function processChatRequest(supabase: any, projectId: string, payload: any) {
  const query = payload.query?.toLowerCase() || "";
  
  if (query.includes('сделай аудит') || query.includes('audit')) {
    try {
      const accessToken = await getAccessToken(supabase, projectId);
      const adAccountId = await getAdAccountId(accessToken, supabase, projectId);
      const insights = await fetchFacebookInsights(accessToken, adAccountId);

      if (!insights) {
        return {
          message: "Данные не найдены за последние 30 дней.",
          type: "terminal_output",
          data: { raw_output: "> NO DATA FOUND." }
        };
      }

      // Process Metrics
      const spent = parseFloat(insights.spend || "0");
      const impressions = parseInt(insights.impressions || "0");
      const clicks = parseInt(insights.clicks || "0");
      const ctr = parseFloat(insights.ctr || "0").toFixed(2);
      
      // Find leads (usually "lead" action type)
      const actions = insights.actions || [];
      const leadsAction = actions.find((a: any) => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead');
      const leads = leadsAction ? parseInt(leadsAction.value) : 0;
      
      const cpl = leads > 0 ? Math.round(spent / leads) : 0;

      // Terminal Response
      return {
        message: "Аудит завершен успешно (Real Data).",
        type: "terminal_output",
        data: {
          timestamp: new Date().toISOString(),
          meta_api_status: "CONNECTED",
          account_id: adAccountId,
          metrics: {
            spend: spent,
            leads: leads,
            cpl: cpl,
            ctr: `${ctr}%`
          },
          recommendations: [
            cpl > 2000 ? "⚠️ CPL выше нормы." : "✅ CPL в норме.",
            parseFloat(ctr) < 1 ? "📉 CTR низкий. Улучшите креативы." : "✅ CTR хороший."
          ],
          raw_output: `
> CONNECTING TO META GRAPH API... OK
> AUTHENTICATED AS: ${adAccountId}
> FETCHING INSIGHTS (LAST 30 DAYS)... DONE
> ----------------------------------------
> SPEND:       ${spent.toLocaleString('ru-RU')} ₸
> LEADS:       ${leads}
> CPL:         ${cpl} ₸ / lead
> CTR:         ${ctr}%
> IMPRESSIONS: ${impressions.toLocaleString()}
> CLICKS:      ${clicks.toLocaleString()}
> ----------------------------------------
> STATUS:      REAL DATA AUDIT COMPLETE
          `.trim()
        }
      };
    } catch (e) {
      return {
        message: `Ошибка аудита: ${e.message}`,
        type: "terminal_output",
        data: {
          raw_output: `> ERROR: ${e.message}\n> PLEASE CHECK ACCESS TOKEN.`
        }
      };
    }
  }
  
  return { message: "Команда принята. Ожидайте обработки." };
}

// --- Placeholder implementations for other actions ---

async function createCampaign(supabase: any, payload: any) {
  // Placeholder - logic remains same or can be expanded
  return { message: "Campaign created (simulation)", campaign: payload };
}

async function updateCampaignStatus(supabase: any, campaignId: string, isActive: boolean) {
   return { message: `Campaign ${isActive ? 'started' : 'stopped'} (simulation)` };
}

async function deleteCampaign(supabase: any, campaignId: string) {
  return { message: "Campaign deleted (simulation)" };
}

async function optimizeCampaigns(supabase: any, projectId: string) {
  return { message: "Optimization completed (simulation)" };
}
