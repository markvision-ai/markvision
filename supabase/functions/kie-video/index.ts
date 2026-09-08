import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KIE_BASE_URL = 'https://api.kie.ai';

// Rate limiting configuration — video generation is expensive, keep it tight
const RATE_LIMITS = {
  default: { requests: 20, windowSeconds: 3600 },
  admin: { requests: 100, windowSeconds: 3600 },
};

// Read-only actions don't spend kie.ai credits, so they don't burn the quota
const FREE_ACTIONS = new Set(['credits', 'status']);

type Action = 'credits' | 'create' | 'status';

interface KieRequest {
  action: Action;
  model?: string;
  input?: Record<string, unknown>;
  callBackUrl?: string;
  taskId?: string;
}

// kie.ai answers with { code, msg, data } and returns HTTP 200 even for
// application-level errors, so the envelope has to be unwrapped by hand.
interface KieEnvelope<T> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

// Check rate limit and log usage
async function checkRateLimitAndLog(
  userId: string,
  service: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    return { allowed: true, remaining: -1 };
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey
  );

  const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
    _user_id: userId,
    _role: 'admin'
  });

  const limit = isAdmin ? RATE_LIMITS.admin : RATE_LIMITS.default;
  const windowStart = new Date(Date.now() - limit.windowSeconds * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from('api_key_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('service', service)
    .gte('created_at', windowStart);

  const currentCount = count || 0;
  const allowed = currentCount < limit.requests;
  const remaining = Math.max(0, limit.requests - currentCount - 1);

  await supabaseAdmin.from('api_key_usage').insert({
    service,
    user_id: userId,
    endpoint,
    request_count: 1
  });

  console.log(`Rate limit: user=${userId}, service=${service}, count=${currentCount}/${limit.requests}`);

  return { allowed, remaining };
}

async function callKie<T>(
  apiKey: string,
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' }
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const response = await fetch(`${KIE_BASE_URL}${path}`, {
    method: init.method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const raw = await response.text();
  let payload: KieEnvelope<T>;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.error('kie.ai returned non-JSON:', response.status, raw.slice(0, 500));
    return { ok: false, status: 502, error: `kie.ai returned a non-JSON response (HTTP ${response.status})` };
  }

  if (!response.ok || payload.code !== 200) {
    const message = payload.msg || payload.message || `kie.ai request failed (HTTP ${response.status})`;
    console.error('kie.ai error:', response.status, payload.code, message);
    // 401/402/429 from kie.ai are meaningful to the caller, keep them intact
    const status = response.ok ? (payload.code >= 400 && payload.code < 600 ? payload.code : 502) : response.status;
    return { ok: false, status, error: message };
  }

  return { ok: true, data: payload.data as T };
}

// kie.ai hands back the result as a JSON string inside resultJson
function extractResultUrls(record: Record<string, unknown>): string[] {
  const candidates: unknown[] = [];

  const resultJson = record.resultJson;
  if (typeof resultJson === 'string' && resultJson.trim()) {
    try {
      const parsed = JSON.parse(resultJson);
      candidates.push(parsed?.resultUrls, parsed?.result_urls, parsed?.resultUrl);
    } catch {
      console.warn('Could not parse resultJson for task', record.taskId);
    }
  }

  const response = record.response as Record<string, unknown> | undefined;
  if (response) {
    candidates.push(response.resultUrls, response.result_urls, response.resultUrl);
  }

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.filter((url): url is string => typeof url === 'string');
    }
    if (typeof candidate === 'string' && candidate) {
      return [candidate];
    }
  }

  return [];
}

// State names differ slightly across kie.ai endpoints; normalise to one vocabulary
function normalizeState(record: Record<string, unknown>): 'pending' | 'running' | 'success' | 'failed' {
  const raw = String(record.state ?? record.status ?? '').toLowerCase();

  if (['success', 'succeeded', 'completed', 'done'].includes(raw)) return 'success';
  if (['fail', 'failed', 'error', 'canceled', 'cancelled'].includes(raw)) return 'failed';
  if (['generating', 'running', 'processing', 'in_progress'].includes(raw)) return 'running';
  if (['waiting', 'queuing', 'queued', 'pending', 'created'].includes(raw)) return 'pending';

  // Unknown state means the job is still moving — treat it as running so the
  // caller keeps polling instead of dropping a task that is actually alive.
  console.warn('Unknown kie.ai task state:', raw);
  return 'running';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization header' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return json({ error: 'Invalid or expired token' }, 401);
    }

    const KIE_API_KEY = Deno.env.get('KIE_API_KEY');
    if (!KIE_API_KEY) {
      return json({ error: 'KIE_API_KEY is not configured' }, 500);
    }

    const body: KieRequest = await req.json();
    const action = body.action;

    if (!action || !['credits', 'create', 'status'].includes(action)) {
      return json({ error: "Invalid action. Use 'credits', 'create' or 'status'" }, 400);
    }

    if (!FREE_ACTIONS.has(action)) {
      const { allowed, remaining } = await checkRateLimitAndLog(user.id, 'kie_video', 'kie-video');
      if (!allowed) {
        return json(
          { error: 'Rate limit exceeded. Please try again later.', retryAfter: 3600 },
          429,
          { 'Retry-After': '3600' }
        );
      }
      console.log(`kie-video create by ${user.id}, remaining requests: ${remaining}`);
    }

    if (action === 'credits') {
      const result = await callKie<number | { credits?: number }>(KIE_API_KEY, '/api/v1/chat/credit');
      if (!result.ok) return json({ error: result.error }, result.status);

      const credits = typeof result.data === 'number' ? result.data : (result.data?.credits ?? null);
      return json({ credits });
    }

    if (action === 'create') {
      if (!body.model || !body.input || typeof body.input !== 'object') {
        return json({ error: 'Missing required fields: model and input' }, 400);
      }

      const result = await callKie<{ taskId?: string; task_id?: string }>(
        KIE_API_KEY,
        '/api/v1/jobs/createTask',
        {
          method: 'POST',
          body: {
            model: body.model,
            input: body.input,
            ...(body.callBackUrl ? { callBackUrl: body.callBackUrl } : {}),
          },
        }
      );

      if (!result.ok) return json({ error: result.error }, result.status);

      const taskId = result.data?.taskId ?? result.data?.task_id;
      if (!taskId) {
        return json({ error: 'kie.ai did not return a taskId' }, 502);
      }

      console.log(`kie.ai task created: ${taskId} (model=${body.model})`);
      return json({ taskId, model: body.model, state: 'pending' as const, videoUrls: [] });
    }

    // action === 'status'
    if (!body.taskId) {
      return json({ error: 'Missing required field: taskId' }, 400);
    }

    const result = await callKie<Record<string, unknown>>(
      KIE_API_KEY,
      `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(body.taskId)}`
    );

    if (!result.ok) return json({ error: result.error }, result.status);

    const record = result.data ?? {};
    const state = normalizeState(record);

    return json({
      taskId: String(record.taskId ?? body.taskId),
      model: record.model ?? null,
      state,
      videoUrls: state === 'success' ? extractResultUrls(record) : [],
      error: state === 'failed'
        ? String(record.failMsg ?? record.failureReason ?? 'Generation failed')
        : null,
    });
  } catch (error) {
    console.error('kie-video error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
