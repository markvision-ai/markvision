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
  handle: string;
  platform: string;
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

    const { handle, platform } = await req.json() as RequestBody;

    if (!handle || !platform) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: handle, platform' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { allowed, remaining } = await checkRateLimitAndLog(
      user.id,
      'ai_analysis',
      'analyze-competitor'
    );

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `Ты — эксперт по SMM и вирусному контенту.
Проанализируй аккаунт @${handle} на платформе ${platform}.
Поскольку у тебя нет прямого доступа к истории просмотров, используй свои знания о популярных блогах и типичных стратегиях в этой нише (судя по никнейму и платформе).

Твоя задача:
1. Определить (или предположить с высокой точностью) нишу и целевую аудиторию.
2. Выявить ключевые форматы контента, которые вероятно использует этот аккаунт.
3. Предложить 5 идей для вирусных роликов, которые можно адаптировать из стратегии этого конкурента.

Верни ответ СТРОГО в формате JSON:
{
  "niche": "Ниша (напр. Стоматология, Лайфстайл, Юмор)",
  "target_audience": "Описание ЦА",
  "strategy_summary": "Краткий анализ стратегии",
  "ideas": [
    {
      "title": "Заголовок идеи 1",
      "concept": "Описание сценария/формата",
      "why_viral": "Почему это залетит"
    },
    ... (еще 4 идеи)
  ]
}

Ответ на русском языке. Только чистый JSON без markdown.`;

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
      throw new Error('No content received from AI');
    }

    // Clean markdown if present
    const jsonStr = content.replace(/```json\n|\n```/g, '').trim();
    const parsedData = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
