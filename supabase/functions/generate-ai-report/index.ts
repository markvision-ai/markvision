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

    const { totals, metrics, projectName, dateRange, projectId } = await req.json();

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

    console.log('Generating AI report for user:', user.id, projectId ? `project: ${projectId}` : '');

    const prompt = `Ты — эксперт по маркетинговой аналитике. Проанализируй следующие данные рекламной кампании и дай развёрнутый анализ с конкретными рекомендациями.

Проект: ${projectName}
Период: ${dateRange.from} — ${dateRange.to}

ДАННЫЕ КАМПАНИИ:
- Расходы на рекламу: ${totals.spend.toLocaleString('ru-RU')} ₸
- Показы: ${totals.impressions.toLocaleString('ru-RU')}
- Клики: ${totals.clicks.toLocaleString('ru-RU')}
- Лиды: ${totals.leads.toLocaleString('ru-RU')}
- Диагностики: ${totals.diagnostics.toLocaleString('ru-RU')}
- Продажи: ${totals.sales.toLocaleString('ru-RU')}
- Выручка: ${totals.revenue.toLocaleString('ru-RU')} ₸

РАССЧИТАННЫЕ МЕТРИКИ:
- CTR (Click-Through Rate): ${totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : 0}%
- CPL (Cost Per Lead): ${metrics.cpl.toLocaleString('ru-RU')} ₸
- CAC (Customer Acquisition Cost): ${metrics.cac.toLocaleString('ru-RU')} ₸
- AOV (Average Order Value): ${metrics.aov.toLocaleString('ru-RU')} ₸
- ROMI (Return on Marketing Investment): ${metrics.romi.toFixed(1)}%
- ROAS (Return on Ad Spend): ${metrics.roas.toFixed(2)}x
- Конверсия лидов в продажи: ${totals.leads > 0 ? ((totals.sales / totals.leads) * 100).toFixed(1) : 0}%

Дай структурированный анализ в формате:

1. ОБЩАЯ ОЦЕНКА (2-3 предложения о текущем состоянии кампании)

2. СИЛЬНЫЕ СТОРОНЫ (2-3 пункта что работает хорошо)

3. ОБЛАСТИ ДЛЯ УЛУЧШЕНИЯ (2-3 конкретных проблемы)

4. РЕКОМЕНДАЦИИ ПО ОПТИМИЗАЦИИ (3-5 конкретных действий с ожидаемым эффектом)

5. ПРОГНОЗ (что можно ожидать при внедрении рекомендаций)

Пиши конкретно, с цифрами и процентами. Избегай общих фраз.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Ты опытный маркетинговый аналитик. Даёшь конкретные, actionable рекомендации на основе данных. Всегда используй цифры и метрики в анализе.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      
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

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error('No analysis generated');
    }

    console.log('AI report generated successfully for user:', user.id);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ai-report:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'Произошла ошибка при генерации отчёта. Попробуйте позже.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
