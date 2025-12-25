import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

// Validation constants
const MAX_STRING_LENGTH = 255;
const MAX_PAYLOAD_SIZE = 100000; // 100KB
const MAX_DEAL_AMOUNT = 1000000000;

// Validation schema for extracted fields
const extractedFieldsSchema = z.object({
  utm_source: z.string().max(MAX_STRING_LENGTH).nullable(),
  utm_medium: z.string().max(MAX_STRING_LENGTH).nullable(),
  utm_campaign: z.string().max(MAX_STRING_LENGTH).nullable(),
  utm_content: z.string().max(MAX_STRING_LENGTH).nullable(),
  utm_term: z.string().max(MAX_STRING_LENGTH).nullable(),
  external_lead_id: z.string().max(MAX_STRING_LENGTH).nullable(),
  name: z.string().max(MAX_STRING_LENGTH).nullable(),
  email: z.string().max(MAX_STRING_LENGTH).nullable(),
  phone: z.string().max(50).nullable(),
  visit_id: z.string().max(MAX_STRING_LENGTH).nullable(),
  client_id: z.string().max(MAX_STRING_LENGTH).nullable(),
  deal_amount: z.number().min(0).max(MAX_DEAL_AMOUNT),
});

// Extract value from nested JSON path like "lead_info.name"
function extractJsonPath(data: any, path: string): any {
  if (!path || typeof path !== 'string') return null;
  
  const parts = path.split('.');
  let result = data;
  
  for (const part of parts) {
    if (result === null || result === undefined) return null;
    if (typeof result !== 'object') return null;
    result = result[part];
  }
  
  return result;
}

// Sanitize and truncate string values
function sanitizeString(value: any, maxLength: number = MAX_STRING_LENGTH): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (str === '') return null;
  return str.substring(0, maxLength);
}

// Parse and validate deal amount
function parseAndValidateDealAmount(value: any): number {
  if (value === null || value === undefined) return 0;
  
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return 0;
  if (num < 0) return 0;
  if (num > MAX_DEAL_AMOUNT) return MAX_DEAL_AMOUNT;
  
  return num;
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

    // Get raw body text for size check
    const bodyText = await req.text();
    
    // Check payload size limit
    if (bodyText.length > MAX_PAYLOAD_SIZE) {
      console.log('Payload too large:', bodyText.length, 'bytes');
      return new Response(
        JSON.stringify({ error: 'Payload too large', max_size: MAX_PAYLOAD_SIZE }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON payload with error handling
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(bodyText);
      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        throw new Error('Payload must be a JSON object');
      }
    } catch (parseError) {
      console.log('Invalid JSON payload:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received webhook payload:', JSON.stringify(payload).substring(0, 500));

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
        ip_address: sanitizeString(ipAddress, 45),
        status: 'received'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Extract fields using mapping with sanitization
    const fieldMapping = webhookConfig.field_mapping;
    
    const rawExtractedData = {
      utm_source: sanitizeString(extractJsonPath(payload, fieldMapping.utm_source)),
      utm_medium: sanitizeString(extractJsonPath(payload, fieldMapping.utm_medium)),
      utm_campaign: sanitizeString(extractJsonPath(payload, fieldMapping.utm_campaign)),
      utm_content: sanitizeString(extractJsonPath(payload, fieldMapping.utm_content)),
      utm_term: sanitizeString(extractJsonPath(payload, fieldMapping.utm_term)),
      external_lead_id: sanitizeString(extractJsonPath(payload, fieldMapping.lead_id)),
      name: sanitizeString(extractJsonPath(payload, fieldMapping.name)),
      email: sanitizeString(extractJsonPath(payload, fieldMapping.email)),
      phone: sanitizeString(extractJsonPath(payload, fieldMapping.phone), 50),
      visit_id: sanitizeString(extractJsonPath(payload, fieldMapping.visit_id)),
      client_id: sanitizeString(extractJsonPath(payload, fieldMapping.client_id)),
      deal_amount: parseAndValidateDealAmount(extractJsonPath(payload, fieldMapping.deal_amount)),
    };

    // Validate extracted data against schema
    const validationResult = extractedFieldsSchema.safeParse(rawExtractedData);
    
    if (!validationResult.success) {
      console.error('Extracted data validation failed:', validationResult.error);
      
      // Update webhook log with validation error
      if (webhookLog) {
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'error',
            error_message: 'Validation failed: ' + validationResult.error.message 
          })
          .eq('id', webhookLog.id);
      }
      
      return new Response(
        JSON.stringify({ error: 'Data validation failed', details: validationResult.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedData = validationResult.data;
    console.log('Validated extracted data:', JSON.stringify(extractedData));

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
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
