import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

interface WebhookPayload {
  [key: string]: any;
}

// Extract value from nested JSON path like "lead_info.name"
function extractJsonPath(data: any, path: string): any {
  const parts = path.split('.');
  let result = data;
  
  for (const part of parts) {
    if (result === null || result === undefined) return null;
    result = result[part];
  }
  
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook token from header (preferred) or URL params (fallback)
    const url = new URL(req.url);
    const token = req.headers.get('X-Webhook-Token') || 
                  req.headers.get('Authorization')?.replace('Bearer ', '') ||
                  url.searchParams.get('token');
    
    if (!token) {
      console.log('Auth failed: Missing webhook token');
      return new Response(
        JSON.stringify({ error: 'Missing webhook token. Provide via X-Webhook-Token header or ?token= query param' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find webhook config by token
    const { data: webhookConfig, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('webhook_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (configError || !webhookConfig) {
      console.log('Auth failed: Invalid webhook token');
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive webhook' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse incoming payload
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', JSON.stringify(payload));

    // Get IP address from headers
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Log the raw webhook
    const { data: webhookLog, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        project_id: webhookConfig.project_id,
        webhook_config_id: webhookConfig.id,
        raw_payload: payload,
        headers: Object.fromEntries(req.headers.entries()),
        ip_address: ipAddress,
        status: 'received'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Extract fields using mapping
    const fieldMapping = webhookConfig.field_mapping;
    
    const extractedData = {
      utm_source: extractJsonPath(payload, fieldMapping.utm_source) || null,
      utm_medium: extractJsonPath(payload, fieldMapping.utm_medium) || null,
      utm_campaign: extractJsonPath(payload, fieldMapping.utm_campaign) || null,
      utm_content: extractJsonPath(payload, fieldMapping.utm_content) || null,
      utm_term: extractJsonPath(payload, fieldMapping.utm_term) || null,
      external_lead_id: extractJsonPath(payload, fieldMapping.lead_id) || null,
      name: extractJsonPath(payload, fieldMapping.name) || null,
      email: extractJsonPath(payload, fieldMapping.email) || null,
      phone: extractJsonPath(payload, fieldMapping.phone) || null,
      visit_id: extractJsonPath(payload, fieldMapping.visit_id) || null,
      client_id: extractJsonPath(payload, fieldMapping.client_id) || null,
      deal_amount: extractJsonPath(payload, fieldMapping.deal_amount) || 0,
    };

    console.log('Extracted data:', JSON.stringify(extractedData));

    // Try to find existing visit by client_id or visit_id to get UTM if missing
    let visitUtm: any = null;
    if (extractedData.client_id || extractedData.visit_id) {
      const visitQuery = supabase
        .from('visits')
        .select('*')
        .eq('project_id', webhookConfig.project_id);
      
      if (extractedData.client_id) {
        visitQuery.eq('client_id', extractedData.client_id);
      }
      
      const { data: visits } = await visitQuery
        .order('visited_at', { ascending: false })
        .limit(1);
      
      if (visits && visits.length > 0) {
        visitUtm = visits[0];
        console.log('Found matching visit:', visitUtm.id);
      }
    }

    // Fill missing UTM data from last visit (Last Click priority)
    const finalUtm = {
      utm_source: extractedData.utm_source || visitUtm?.utm_source || null,
      utm_medium: extractedData.utm_medium || visitUtm?.utm_medium || null,
      utm_campaign: extractedData.utm_campaign || visitUtm?.utm_campaign || null,
      utm_content: extractedData.utm_content || visitUtm?.utm_content || null,
      utm_term: extractedData.utm_term || visitUtm?.utm_term || null,
    };

    // Create lead record
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        project_id: webhookConfig.project_id,
        webhook_log_id: webhookLog?.id || null,
        external_lead_id: extractedData.external_lead_id,
        name: extractedData.name,
        email: extractedData.email,
        phone: extractedData.phone,
        client_id: extractedData.client_id,
        visit_id: extractedData.visit_id,
        deal_amount: extractedData.deal_amount,
        extra_data: payload,
        status: 'new',
        ...finalUtm
      })
      .select()
      .single();

    if (leadError) {
      console.error('Failed to create lead:', leadError);
      
      // Update webhook log with error
      if (webhookLog) {
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'error',
            error_message: leadError.message 
          })
          .eq('id', webhookLog.id);
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to process lead', details: leadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lead created successfully:', lead.id);

    // Update webhook log with success
    if (webhookLog) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'processed' })
        .eq('id', webhookLog.id);
    }

    // Create touchpoint for multichannel analytics
    if (lead && (finalUtm.utm_source || visitUtm)) {
      const sourceType = finalUtm.utm_medium === 'cpc' ? 'paid' : 
                        finalUtm.utm_source === 'direct' ? 'direct' : 
                        finalUtm.utm_source ? 'organic' : 'direct';
      
      // Get existing touchpoints for this client
      let position = 1;
      let totalInChain = 1;
      
      if (extractedData.client_id) {
        const { data: existingTouchpoints } = await supabase
          .from('touchpoints')
          .select('id')
          .eq('project_id', webhookConfig.project_id)
          .eq('deal_id', lead.id);
        
        if (existingTouchpoints) {
          position = existingTouchpoints.length + 1;
          totalInChain = position;
        }
      }

      const { error: touchpointError } = await supabase
        .from('touchpoints')
        .insert({
          project_id: webhookConfig.project_id,
          deal_id: lead.id,
          visit_id: visitUtm?.id || null,
          channel_name: finalUtm.utm_source || 'direct',
          campaign_name: finalUtm.utm_campaign,
          keyword: finalUtm.utm_term,
          source_type: sourceType,
          position: position,
          total_in_chain: totalInChain,
          is_first: position === 1,
          is_last: true,
          deal_revenue: extractedData.deal_amount || 0,
          touched_at: new Date().toISOString()
        });

      if (touchpointError) {
        console.error('Failed to create touchpoint:', touchpointError);
      } else {
        console.log('Touchpoint created for lead');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: lead.id,
        message: 'Lead processed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
