import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 20, windowSeconds: 3600 }, // 20 requests per hour
  admin: { requests: 100, windowSeconds: 3600 },  // 100 requests per hour for admins
};

// Check rate limit and log usage
async function checkRateLimitAndLog(
  supabase: any, 
  userId: string, 
  projectId: string | null,
  service: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    console.log('Service role key not available, skipping rate limit check');
    return { allowed: true, remaining: -1 };
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey
  );

  // Check if user is admin for higher limits
  const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
    _user_id: userId, 
    _role: 'admin' 
  });

  const limit = isAdmin ? RATE_LIMITS.admin : RATE_LIMITS.default;
  const windowStart = new Date(Date.now() - limit.windowSeconds * 1000).toISOString();

  // Count recent requests
  const { count, error: countError } = await supabaseAdmin
    .from('api_key_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('service', service)
    .gte('created_at', windowStart);

  if (countError) {
    console.error('Rate limit check error:', countError);
    // Allow request on error but log it
    return { allowed: true, remaining: -1 };
  }

  const currentCount = count || 0;
  const allowed = currentCount < limit.requests;
  const remaining = Math.max(0, limit.requests - currentCount - 1);

  // Log the usage attempt
  await supabaseAdmin.from('api_key_usage').insert({
    service,
    user_id: userId,
    project_id: projectId,
    endpoint,
    request_count: 1
  });

  console.log(`Rate limit check: user=${userId}, service=${service}, count=${currentCount}/${limit.requests}, allowed=${allowed}`);

  return { allowed, remaining };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('Auth failed: Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Auth failed: Invalid token');
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, context, projectId, history = [], stream = false } = await req.json();

    // Verify project access if projectId is provided
    if (projectId) {
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('has_project_access', { _user_id: user.id, _project_id: projectId });

      if (accessError || !hasAccess) {
        console.log('Access denied: User does not have project access');
        return new Response(JSON.stringify({ error: 'Access denied to this project' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Check rate limit and log usage
    const { allowed, remaining } = await checkRateLimitAndLog(
      supabase, 
      user.id, 
      projectId || null,
      'lovable_ai_chat',
      'ai-analytics-chat'
    );

    if (!allowed) {
      console.log('Rate limit exceeded for user:', user.id);
      return new Response(JSON.stringify({ 
        error: 'Превышен лимит запросов. Попробуйте позже.',
        retryAfter: 3600
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '3600'
        },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('AI Analytics Chat - Processing request for user:', user.id, projectId ? `project: ${projectId}` : '', stream ? '(streaming)' : '', `remaining: ${remaining}`);

    const systemPrompt = `Ты — AI-аналитик платформы AdMetrics. Ты работаешь только с данными проекта и даёшь конкретные рекомендации на основе реальных цифр.

ТВОЯ РОЛЬ:
- Анализируешь метрики проекта: расходы, лиды, продажи, конверсии, CPL, ROMI
- Выявляешь проблемы и точки роста на основе данных
- Даёшь конкретные actionable рекомендации, а не общие советы
- Сравниваешь показатели с бенчмарками и предыдущими периодами
- Отвечаешь кратко и по делу

ДАННЫЕ ПРОЕКТА:
${context ? `
📊 **Текущие показатели:**
- Расходы: ${context.spend?.toLocaleString('ru-RU') || 0} ₸
- Показы: ${context.impressions?.toLocaleString('ru-RU') || 0}
- Клики: ${context.clicks?.toLocaleString('ru-RU') || 0}
- Лиды: ${context.leads?.toLocaleString('ru-RU') || 0}
- Диагностики: ${context.diagnostics?.toLocaleString('ru-RU') || 0}
- Продажи: ${context.sales?.toLocaleString('ru-RU') || 0}
- Выручка: ${context.revenue?.toLocaleString('ru-RU') || 0} ₸

📈 **Расчётные метрики:**
- CTR: ${context.impressions > 0 ? ((context.clicks / context.impressions) * 100).toFixed(2) : 0}%
- CPL (стоимость лида): ${context.cpl?.toLocaleString('ru-RU') || 0} ₸
- CAC (стоимость клиента): ${context.cac?.toLocaleString('ru-RU') || 0} ₸
- AOV (средний чек): ${context.aov?.toLocaleString('ru-RU') || 0} ₸
- ROMI: ${context.romi?.toFixed(1) || 0}%
- Конверсия лид→продажа: ${context.leads > 0 ? ((context.sales / context.leads) * 100).toFixed(1) : 0}%
` : 'Данные проекта не загружены. Запроси у пользователя выбрать проект или период.'}

БЕНЧМАРКИ ДЛЯ СРАВНЕНИЯ:
- CTR: <1% — низкий, 1-2% — норма, >2% — хороший, >4% — отличный
- Конверсия лид→продажа: <5% — низкая, 5-10% — норма, >10% — хорошая, >20% — отличная
- ROMI: <0% — убыток, 0-100% — низкий, >100% — хороший, >300% — отличный

ПРАВИЛА ОТВЕТОВ:
1. Всегда опирайся на конкретные цифры из данных проекта
2. Не давай абстрактных советов типа "улучшите креативы" — уточни ЧТО именно и ПОЧЕМУ
3. Если данных недостаточно — запроси конкретику
4. Указывай числа: на сколько % изменить, какой показатель достичь
5. Приоритизируй рекомендации по влиянию на прибыль
6. Отвечай на русском языке, кратко и структурированно`;


    // Build messages array with history
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role,
        content: h.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: apiMessages,
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Превышен лимит запросов. Попробуйте позже.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Необходимо пополнить баланс AI.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // If streaming, pass through the response
    if (stream) {
      console.log('Streaming response for user:', user.id);
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error('No response generated');
    }

    console.log('AI response generated successfully for user:', user.id);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-analytics-chat:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Произошла ошибка при обработке запроса. Попробуйте позже.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
