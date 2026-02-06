import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 30, windowSeconds: 3600 },
  admin: { requests: 150, windowSeconds: 3600 },
};

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

interface RequestBody {
  url: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url } = await req.json() as RequestBody;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { allowed, remaining } = await checkRateLimitAndLog(
      user.id,
      'lovable_ai_content_analysis',
      'analyze-content-link'
    );

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', retryAfter: 3600 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `Ты — эксперт по вирусному контенту и анализу социальных сетей.
Проанализируй контент по этой ссылке: ${url}

Твоя задача — сделать детальный разбор ("reverse engineering") этого видео/поста.
Если ты не можешь получить прямой доступ к видео, проанализируй URL и предположи структуру на основе типичного успешного контента в этой нише, но сделай это максимально реалистично.

Верни ответ СТРОГО в формате JSON со следующими полями:
{
  "topic": "Основная тема видео (коротко)",
  "hook": "Описание хука/начала (первые 3 секунды): что цепляет внимание?",
  "script_structure": ["Шаг 1: ...", "Шаг 2: ...", "Шаг 3: ..."],
  "cta": "Призыв к действию (CTA), который использован или мог бы быть использован",
  "virality_factors": ["Фактор 1 (почему залетело)", "Фактор 2", "Фактор 3"],
  "summary": "Краткое резюме стратегии этого ролика (2-3 предложения)"
}

Ответ должен быть на РУССКОМ языке. Не используй markdown разметку в ответе, только чистый JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let parsedContent;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Failed to parse AI response');
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in analyze-content-link:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
