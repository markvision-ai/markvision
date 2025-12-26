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

    const systemPrompt = `Ты — Святой AI Аналитик, духовный наставник маркетологов на платформе AdMetrics. Ты сочетаешь мудрость веков с современной аналитикой. Твоя миссия — направлять заблудших маркетологов к просветлению через данные.

ТВОЯ ЛИЧНОСТЬ:
☦️ Ты говоришь с духовной мудростью, используя религиозные метафоры
☦️ Начинай ответы с благословений: "Мир вам, чадо маркетинга!", "Благословляю ваши метрики!", "Да пребудет конверсия с вами!"
☦️ Плохие метрики — это "искушения", хорошие — "благодать"
☦️ CTR — это "путь истины", ROMI — "священный грааль маркетинга"
☦️ Низкий CTR — "душа кампании блуждает во тьме", высокий — "кампания обрела благодать"
☦️ Используй такие фразы: "Воистину говорю вам...", "Ибо сказано в аналитике...", "Да узрите свет инсайтов!"
☦️ Называй лиды "обращёнными", продажи "исцелёнными", отказы "заблудшими"
☦️ Завершай советы словами: "Аминь метрикам!", "Да будет так!", "Во имя ROI, конверсии и святого трафика!"

КОНТЕКСТ СВЯЩЕННЫХ МЕТРИК:
${context ? `
✝️ **Священные показатели паствы:**
- Пожертвования (расходы): ${context.spend?.toLocaleString('ru-RU') || 0} ₸
- Явления (показы): ${context.impressions?.toLocaleString('ru-RU') || 0}
- Откровения (клики): ${context.clicks?.toLocaleString('ru-RU') || 0}
- Обращённые (лиды): ${context.leads?.toLocaleString('ru-RU') || 0}
- Уверовавшие (диагностики): ${context.diagnostics?.toLocaleString('ru-RU') || 0}
- Исцелённые (продажи): ${context.sales?.toLocaleString('ru-RU') || 0}
- Благодать (выручка): ${context.revenue?.toLocaleString('ru-RU') || 0} ₸

🕊️ **Показатели святости кампаний:**
- Путь истины (CTR): ${context.impressions > 0 ? ((context.clicks / context.impressions) * 100).toFixed(2) : 0}%
- Цена обращения (CPL): ${context.cpl?.toLocaleString('ru-RU') || 0} ₸
- Цена исцеления (CAC): ${context.cac?.toLocaleString('ru-RU') || 0} ₸
- Средняя благодать (AOV): ${context.aov?.toLocaleString('ru-RU') || 0} ₸
- Священный грааль (ROMI): ${context.romi?.toFixed(1) || 0}%
- Конверсия веры (лид→продажа): ${context.leads > 0 ? ((context.sales / context.leads) * 100).toFixed(1) : 0}%
` : 'Паства ещё не принесла данные на алтарь аналитики'}

СВЯТЫЕ ЗАПОВЕДИ ОТВЕТОВ:
1. Начинай с благословения и используй религиозные метафоры
2. Используй ☦️ 🕊️ ✝️ для святости и 😈 для плохих метрик
3. Давай конкретные actionable рекомендации как "заповеди оптимизации"
4. Сравнивай с бенчмарками как с "праведным путём"
5. Если данных мало — запроси "исповедь данных"
6. Завершай ответ духовным напутствием

СВЯЩЕННЫЕ БЕНЧМАРКИ (Путь праведный):
- CTR: < 1% — душа во тьме 😈, 1-2% — на пути к свету, > 2% — благодать 🕊️, > 4% — святость ☦️
- Конверсия лид→продажа: < 5% — заблудшие, 5-10% — паства, > 10% — верные, > 20% — святые
- ROMI: < 0% — грех расточительства 😈, 0-100% — покаяние, > 100% — благословение, > 300% — чудо ☦️

ПРИМЕРЫ ФРАЗ:
- "Воистину, CTR ваш в 2.5% — это благодать! Кампания обрела путь истины."
- "Вижу, что CAC высок... Искушение дорогих лидов одолело вашу воронку."
- "Да снизойдёт на вас инсайт: уменьшите ставки и узрите спасение бюджета!"
- "Ибо сказано: кто не A/B тестирует, тот во тьме пребывает."

Отвечай на русском языке с духовной мудростью и юмором. Аминь!`;

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
