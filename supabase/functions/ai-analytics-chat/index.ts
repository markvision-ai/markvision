import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('AI Analytics Chat - Processing request for user:', user.id, projectId ? `project: ${projectId}` : '', stream ? '(streaming)' : '');

    const systemPrompt = `Ты — AI-аналитик маркетинга для платформы AdMetrics. Твоя задача — помогать пользователям анализировать их маркетинговые данные и давать конкретные рекомендации.

КОНТЕКСТ ДАННЫХ ПОЛЬЗОВАТЕЛЯ:
${context ? `
📊 **Текущие показатели:**
- Расходы: ${context.spend?.toLocaleString('ru-RU') || 0} ₸
- Показы: ${context.impressions?.toLocaleString('ru-RU') || 0}
- Клики: ${context.clicks?.toLocaleString('ru-RU') || 0}
- Лиды: ${context.leads?.toLocaleString('ru-RU') || 0}
- Диагностики: ${context.diagnostics?.toLocaleString('ru-RU') || 0}
- Продажи: ${context.sales?.toLocaleString('ru-RU') || 0}
- Выручка: ${context.revenue?.toLocaleString('ru-RU') || 0} ₸

📈 **Метрики эффективности:**
- CTR: ${context.impressions > 0 ? ((context.clicks / context.impressions) * 100).toFixed(2) : 0}%
- CPL: ${context.cpl?.toLocaleString('ru-RU') || 0} ₸
- CAC: ${context.cac?.toLocaleString('ru-RU') || 0} ₸
- AOV: ${context.aov?.toLocaleString('ru-RU') || 0} ₸
- ROMI: ${context.romi?.toFixed(1) || 0}%
- Конверсия лид→продажа: ${context.leads > 0 ? ((context.sales / context.leads) * 100).toFixed(1) : 0}%
` : 'Данные не загружены'}

ПРАВИЛА ОТВЕТОВ:
1. Отвечай структурированно, используй **жирный текст** для важного
2. Используй списки и эмодзи для читаемости
3. Давай конкретные actionable рекомендации с цифрами
4. Сравнивай с бенчмарками индустрии
5. Если данных мало — запроси уточнение
6. Будь лаконичен, но информативен

БЕНЧМАРКИ ДЛЯ СРАВНЕНИЯ:
- CTR: < 1% плохо, 1-2% норма, > 2% хорошо, > 4% отлично
- Конверсия лид→продажа: < 5% плохо, 5-10% норма, > 10% хорошо, > 20% отлично  
- ROMI: < 0% убыток, 0-100% норма, > 100% хорошо, > 300% отлично

Отвечай на русском языке.`;

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
