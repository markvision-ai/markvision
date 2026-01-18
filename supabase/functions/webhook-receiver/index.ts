import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token, x-webhook-signature, x-webhook-timestamp',
};

// Validation constants
const MAX_STRING_LENGTH = 255;
const MAX_PAYLOAD_SIZE = 100000; // 100KB
const MAX_DEAL_AMOUNT = 1000000000;
const MAX_PATH_DEPTH = 5;
const SIGNATURE_MAX_AGE_MS = 300000; // 5 minutes - prevent replay attacks

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per token

// In-memory rate limiter (per token)
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 300000;
let lastCleanup = Date.now();

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  const expiredTime = now - RATE_LIMIT_WINDOW_MS;
  
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.windowStart < expiredTime) {
      rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(token: string): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupRateLimitMap();
  
  const now = Date.now();
  const entry = rateLimitMap.get(token);
  
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitMap.set(token, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }
  
  entry.count++;
  const remaining = RATE_LIMIT_MAX_REQUESTS - entry.count;
  const resetIn = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart);
  return { allowed: true, remaining, resetIn };
}

// Path validation regex - only allow alphanumeric, underscores, and dots
const VALID_PATH_PATTERN = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/;

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

// Validate field mapping path for security
function isValidPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  if (path.length > 100) return false; // Limit path length
  if (!VALID_PATH_PATTERN.test(path)) return false;
  
  const parts = path.split('.');
  if (parts.length > MAX_PATH_DEPTH) return false;
  
  // Check for prototype pollution attempts
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  if (parts.some(part => dangerousKeys.includes(part.toLowerCase()))) {
    return false;
  }
  
  return true;
}

// Extract value from nested JSON path like "lead_info.name"
function extractJsonPath(data: any, path: string): any {
  if (!path || typeof path !== 'string') return null;
  
  // Validate path before using it
  if (!isValidPath(path)) {
    console.log('Invalid path rejected:', path.substring(0, 50));
    return null;
  }
  
  const parts = path.split('.');
  let result = data;
  
  for (const part of parts) {
    if (result === null || result === undefined) return null;
    if (typeof result !== 'object') return null;
    // Additional safety: use Object.hasOwn to avoid prototype chain access
    if (!Object.prototype.hasOwnProperty.call(result, part)) return null;
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

// Validate entire field mapping object
function validateFieldMapping(fieldMapping: Record<string, string>): boolean {
  if (!fieldMapping || typeof fieldMapping !== 'object') return false;
  
  for (const [key, path] of Object.entries(fieldMapping)) {
    if (path && typeof path === 'string' && !isValidPath(path)) {
      console.log('Invalid field mapping path for key:', key);
      return false;
    }
  }
  return true;
}

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison to prevent timing attacks
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

// Verify HMAC signature using Web Crypto API (Deno-compatible)
async function verifyHmacSignature(secret: string, timestamp: string, body: string, providedSignature: string): Promise<boolean> {
  try {
    // Import the secret key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Create the message to sign
    const message = encoder.encode(`${timestamp}.${body}`);
    
    // Generate expected signature
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, message);
    const expectedSignature = bytesToHex(new Uint8Array(signatureBuffer));
    
    // Use constant-time comparison to prevent timing attacks
    const expectedBytes = hexToBytes(expectedSignature);
    const providedBytes = hexToBytes(providedSignature);
    
    return constantTimeEqual(expectedBytes, providedBytes);
  } catch (error) {
    console.error('Signature verification error');
    return false;
  }
}

// Log failed authentication attempts for security monitoring
async function logFailedAuth(supabase: any, projectId: string | null, reason: string, ipAddress: string) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      project_id: projectId,
      action: 'webhook_auth_failed',
      entity_type: 'webhook',
      old_values: { reason, ip_address: ipAddress },
      new_values: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Failed to log auth failure');
  }
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

    // Get IP address early for logging
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // Get webhook token from header (preferred) - REMOVED URL query param for security
    const token = req.headers.get('X-Webhook-Token') || 
                  req.headers.get('Authorization')?.replace('Bearer ', '');
    
    // Get HMAC signature headers (optional but recommended)
    const signature = req.headers.get('X-Webhook-Signature');
    const timestamp = req.headers.get('X-Webhook-Timestamp');
    
    if (!token) {
      console.log('Auth failed: Missing webhook token');
      await logFailedAuth(supabase, null, 'missing_token', ipAddress);
      return new Response(
        JSON.stringify({ 
          error: 'Missing webhook token',
          hint: 'Provide token via X-Webhook-Token header or Authorization: Bearer <token>'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit for this token
    const rateLimit = checkRateLimit(token);
    if (!rateLimit.allowed) {
      console.log('Rate limit exceeded for token');
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retry_after_seconds: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimit.resetIn) / 1000))
          } 
        }
      );
    }

    // Find webhook config by token (including secret for verification)
    const { data: webhookConfig, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('webhook_token', token)
      .eq('is_active', true)
      .maybeSingle();

    if (configError || !webhookConfig) {
      console.log('Auth failed: Invalid webhook token');
      await logFailedAuth(supabase, null, 'invalid_token', ipAddress);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive webhook' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body text for size check and signature verification
    const bodyText = await req.text();
    
    // Check payload size limit
    if (bodyText.length > MAX_PAYLOAD_SIZE) {
      console.log('Payload size exceeded limit');
      return new Response(
        JSON.stringify({ error: 'Payload too large', max_size: MAX_PAYLOAD_SIZE }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify HMAC signature if provided (recommended for production)
    const hasSignature = signature && timestamp;
    let signatureValid = false;
    
    if (hasSignature && webhookConfig.webhook_secret) {
      // Verify timestamp is not too old (prevent replay attacks)
      const requestTime = parseInt(timestamp, 10);
      const now = Date.now();
      
      if (isNaN(requestTime) || Math.abs(now - requestTime) > SIGNATURE_MAX_AGE_MS) {
        console.log('Auth failed: Signature timestamp expired or invalid');
        await logFailedAuth(supabase, webhookConfig.project_id, 'expired_timestamp', ipAddress);
        return new Response(
          JSON.stringify({ 
            error: 'Request expired or invalid timestamp',
            hint: 'X-Webhook-Timestamp must be current Unix timestamp in milliseconds'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify HMAC signature
      signatureValid = await verifyHmacSignature(webhookConfig.webhook_secret, timestamp, bodyText, signature);

      if (!signatureValid) {
        console.log('Auth failed: Invalid HMAC signature');
        await logFailedAuth(supabase, webhookConfig.project_id, 'invalid_signature', ipAddress);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid signature',
            hint: 'Signature = HMAC-SHA256(secret, timestamp + "." + body)'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('HMAC signature verified successfully');
    } else {
      // Token-only authentication (legacy mode - log warning)
      console.log('WARNING: Request authenticated with token only (no HMAC signature)');
    }

    // Parse JSON payload with error handling
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(bodyText);
      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        throw new Error('Payload must be a JSON object');
      }
    } catch (parseError) {
      console.log('Invalid JSON payload received');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Webhook received for project:', webhookConfig.project_id, 'signed:', signatureValid);

    // Validate field mapping before using it
    const fieldMapping = webhookConfig.field_mapping;
    if (!validateFieldMapping(fieldMapping)) {
      console.log('Invalid field mapping configuration');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the raw webhook
    const { data: webhookLog, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        project_id: webhookConfig.project_id,
        webhook_config_id: webhookConfig.id,
        raw_payload: payload,
        headers: Object.fromEntries(
          // Filter out sensitive headers from logs
          Array.from(req.headers.entries()).filter(([key]) => 
            !['x-webhook-token', 'x-webhook-signature', 'authorization'].includes(key.toLowerCase())
          )
        ),
        ip_address: sanitizeString(ipAddress, 45),
        status: 'received'
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log webhook');
    }

    // Extract fields using mapping with sanitization
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
      console.error('Extracted data validation failed');
      
      // Update webhook log with validation error
      if (webhookLog) {
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'error',
            error_message: 'Validation failed' 
          })
          .eq('id', webhookLog.id);
      }
      
      return new Response(
        JSON.stringify({ error: 'Data validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extractedData = validationResult.data;
    console.log('Data extracted successfully for webhook:', webhookLog?.id);

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
        console.log('Found matching visit');
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
      console.error('Failed to create lead');
      
      // Update webhook log with error
      if (webhookLog) {
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'error',
            error_message: 'Failed to create lead' 
          })
          .eq('id', webhookLog.id);
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to process lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Lead created successfully');

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
        console.error('Failed to create touchpoint');
      } else {
        console.log('Touchpoint created for lead');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: lead.id,
        message: 'Lead processed successfully',
        signature_verified: signatureValid
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook processing error');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
