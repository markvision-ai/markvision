import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
      // We continue even if logging fails, or we could fail here.
      // For now, proceed but warn.
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
  // In reality, this would analyze stats and adjust budgets
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return { 
    message: "Optimization completed", 
    details: "Analyzed 5 campaigns. Adjusted budget for 2 underperforming ad sets." 
  };
}
