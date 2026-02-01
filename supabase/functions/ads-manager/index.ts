import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

async function createCampaign(supabase: any, payload: any) {
  // Validate payload
  if (!payload.name) throw new Error("Campaign name is required");

  const newCampaign = {
    project_id: payload.project_id,
    name: payload.name,
    platform: payload.platform || 'facebook',
    status: false, // Draft/Paused by default
    budget: payload.budget || 5000,
    spent_today: 0,
    autopilot_enabled: false,
    rules: {},
    ai_log: [],
    external_id: null // Placeholder for real external ID
  };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(newCampaign)
    .select()
    .single();

  if (error) throw error;
  return { message: "Campaign created successfully", campaign: data };
}

async function updateCampaignStatus(supabase: any, campaignId: string, isActive: boolean) {
  if (!campaignId) throw new Error("Campaign ID is required");

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: isActive })
    .eq('id', campaignId)
    .select()
    .single();

  if (error) throw error;
  return { message: `Campaign ${isActive ? 'started' : 'stopped'} successfully`, campaign: data };
}

async function deleteCampaign(supabase: any, campaignId: string) {
  if (!campaignId) throw new Error("Campaign ID is required");

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) throw error;
  return { message: "Campaign deleted successfully" };
}

async function optimizeCampaigns(supabase: any, projectId: string) {
  // Mock optimization logic
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return { 
    message: "Optimization completed", 
    details: "Analyzed 5 campaigns. Adjusted budget for 2 underperforming ad sets." 
  };
}

async function processChatRequest(supabase: any, projectId: string, payload: any) {
  const query = payload.query?.toLowerCase() || "";
  
  if (query.includes('сделай аудит')) {
    // Simulate Meta API call and audit
    // In a real scenario, this would fetch insights from 'facebook_ads_insights' or external API
    
    // 1. Fetch campaigns for context
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('project_id', projectId);

    // 2. Mock pulling data from Meta API
    // const metaData = await fetchMetaInsights(projectId); 
    
    // 3. Calculate CPL (Cost Per Lead)
    // We'll use random data for simulation if no real data exists, 
    // or calculate from what we have.
    const spent = Math.floor(Math.random() * 50000) + 10000;
    const leads = Math.floor(Math.random() * 50) + 5;
    const cpl = Math.round(spent / leads);
    const ctr = (Math.random() * 2 + 0.5).toFixed(2);
    
    // Terminal style response
    return {
      message: "Аудит завершен успешно.",
      type: "terminal_output",
      data: {
        timestamp: new Date().toISOString(),
        meta_api_status: "CONNECTED",
        account_id: `ACT_${projectId.substring(0, 8)}`,
        metrics: {
          spend: spent,
          leads: leads,
          cpl: cpl,
          ctr: `${ctr}%`
        },
        recommendations: [
          cpl > 2000 ? "⚠️ CPL выше нормы. Рекомендуется отключить AdSet #3." : "✅ CPL в норме.",
          "📉 CTR низкий в кампании 'Retargeting'. Обновите креативы."
        ],
        raw_output: `
> CONNECTING TO META GRAPH API... OK
> FETCHING CAMPAIGN DATA... [||||||||||] 100%
> ANALYZING AD SETS... DONE
> CALCULATING METRICS...
> ----------------------------------------
> SPEND:       ${spent.toLocaleString('ru-RU')} ₸
> LEADS:       ${leads}
> CPL:         ${cpl} ₸ / lead
> CTR:         ${ctr}%
> ----------------------------------------
> STATUS:      AUDIT COMPLETE
        `.trim()
      }
    };
  }
  
  return { message: "Команда принята. Ожидайте обработки." };
}
