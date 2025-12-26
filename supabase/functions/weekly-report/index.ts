import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProjectData {
  id: string;
  name: string;
  telegram_chat_id: string | null;
}

interface WeeklyStats {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

interface PlanData {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  diagnostics: number;
  sales: number;
  revenue: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₸';
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
};

const formatPercent = (value: number): string => {
  return value.toFixed(1) + '%';
};

const getPercentChange = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? '+∞' : '0%';
  const change = ((current - previous) / previous) * 100;
  return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
};

const getPlanFactEmoji = (fact: number, plan: number): string => {
  if (plan === 0) return '➖';
  const percent = (fact / plan) * 100;
  if (percent >= 100) return '✅';
  if (percent >= 80) return '🟡';
  return '🔴';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authentication check
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create auth client to verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User authenticated: ${user.id}`);

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if user has admin role
    const { data: hasAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError) {
      console.error('Role check error:', roleError.message);
      return new Response(JSON.stringify({ error: 'Failed to verify permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!hasAdmin) {
      console.error('User lacks admin role:', user.id);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Admin role verified, starting weekly report generation...');

    // Get all projects with telegram_chat_id
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, telegram_chat_id')
      .not('telegram_chat_id', 'is', null);

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    console.log(`Found ${projects?.length || 0} projects with Telegram configured`);

    const results: { project: string; success: boolean; error?: string }[] = [];

    for (const project of (projects || []) as ProjectData[]) {
      try {
        console.log(`Processing project: ${project.name} (${project.id})`);

        // Calculate date range (last week: Monday to Sunday)
        const now = new Date();
        const lastMonday = new Date(now);
        lastMonday.setDate(now.getDate() - now.getDay() - 6); // Previous Monday
        lastMonday.setHours(0, 0, 0, 0);
        
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        lastSunday.setHours(23, 59, 59, 999);

        const weekBeforeMonday = new Date(lastMonday);
        weekBeforeMonday.setDate(lastMonday.getDate() - 7);
        const weekBeforeSunday = new Date(lastSunday);
        weekBeforeSunday.setDate(lastSunday.getDate() - 7);

        // Get current week data
        const { data: currentWeekData, error: currentError } = await supabase
          .from('daily_data')
          .select('*')
          .eq('project_id', project.id)
          .gte('date', lastMonday.toISOString().split('T')[0])
          .lte('date', lastSunday.toISOString().split('T')[0]);

        if (currentError) throw currentError;

        // Get previous week data
        const { data: previousWeekData, error: previousError } = await supabase
          .from('daily_data')
          .select('*')
          .eq('project_id', project.id)
          .gte('date', weekBeforeMonday.toISOString().split('T')[0])
          .lte('date', weekBeforeSunday.toISOString().split('T')[0]);

        if (previousError) throw previousError;

        // Get monthly plan
        const currentMonth = new Date(lastMonday.getFullYear(), lastMonday.getMonth(), 1);
        const { data: planData, error: planError } = await supabase
          .from('plan_data')
          .select('*')
          .eq('project_id', project.id)
          .eq('month', currentMonth.toISOString().split('T')[0])
          .single();

        // Calculate totals
        const current: WeeklyStats = (currentWeekData || []).reduce((acc, day) => ({
          spend: acc.spend + (day.spend || 0),
          impressions: acc.impressions + (day.impressions || 0),
          clicks: acc.clicks + (day.clicks || 0),
          leads: acc.leads + (day.leads || 0),
          diagnostics: acc.diagnostics + (day.diagnostics || 0),
          sales: acc.sales + (day.sales || 0),
          revenue: acc.revenue + (day.revenue || 0),
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 });

        const previous: WeeklyStats = (previousWeekData || []).reduce((acc, day) => ({
          spend: acc.spend + (day.spend || 0),
          impressions: acc.impressions + (day.impressions || 0),
          clicks: acc.clicks + (day.clicks || 0),
          leads: acc.leads + (day.leads || 0),
          diagnostics: acc.diagnostics + (day.diagnostics || 0),
          sales: acc.sales + (day.sales || 0),
          revenue: acc.revenue + (day.revenue || 0),
        }), { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 });

        // Calculate weekly portion of plan (7/30 days)
        const weeklyPlanFactor = 7 / 30;
        const plan: PlanData = planData ? {
          spend: (planData.spend || 0) * weeklyPlanFactor,
          impressions: (planData.impressions || 0) * weeklyPlanFactor,
          clicks: (planData.clicks || 0) * weeklyPlanFactor,
          leads: (planData.leads || 0) * weeklyPlanFactor,
          diagnostics: (planData.diagnostics || 0) * weeklyPlanFactor,
          sales: (planData.sales || 0) * weeklyPlanFactor,
          revenue: (planData.revenue || 0) * weeklyPlanFactor,
        } : { spend: 0, impressions: 0, clicks: 0, leads: 0, diagnostics: 0, sales: 0, revenue: 0 };

        // Calculate metrics
        const cpl = current.leads > 0 ? current.spend / current.leads : 0;
        const cac = current.sales > 0 ? current.spend / current.sales : 0;
        const aov = current.sales > 0 ? current.revenue / current.sales : 0;
        const romi = current.spend > 0 ? ((current.revenue - current.spend) / current.spend) * 100 : 0;
        const roas = current.spend > 0 ? current.revenue / current.spend : 0;
        const convRate = current.leads > 0 ? (current.sales / current.leads) * 100 : 0;

        // Generate AI analysis
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        let aiAnalysis = '';

        if (LOVABLE_API_KEY) {
          try {
            const aiPrompt = `Ты — маркетинговый аналитик. Сделай краткий еженедельный анализ (максимум 5 предложений).

ДАННЫЕ ЗА НЕДЕЛЮ:
- Расходы: ${formatCurrency(current.spend)} (план: ${formatCurrency(plan.spend)})
- Лиды: ${current.leads} (план: ${Math.round(plan.leads)})
- Продажи: ${current.sales} (план: ${Math.round(plan.sales)})
- Выручка: ${formatCurrency(current.revenue)} (план: ${formatCurrency(plan.revenue)})
- ROMI: ${formatPercent(romi)}
- Конверсия в продажу: ${formatPercent(convRate)}

СРАВНЕНИЕ С ПРОШЛОЙ НЕДЕЛЕЙ:
- Расходы: ${getPercentChange(current.spend, previous.spend)}
- Лиды: ${getPercentChange(current.leads, previous.leads)}
- Продажи: ${getPercentChange(current.sales, previous.sales)}
- Выручка: ${getPercentChange(current.revenue, previous.revenue)}

Дай:
1. Главный вывод (1 предложение)
2. Что улучшилось/ухудшилось (1-2 предложения)
3. Одна конкретная рекомендация на следующую неделю`;

            const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [
                  { role: 'system', content: 'Ты краткий и конкретный аналитик. Пиши только суть, без воды.' },
                  { role: 'user', content: aiPrompt }
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              aiAnalysis = aiData.choices?.[0]?.message?.content || '';
            }
          } catch (aiError) {
            console.error('AI analysis error:', aiError);
          }
        }

        // Format date range
        const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
        const fromDate = lastMonday.toLocaleDateString('ru-RU', dateOptions);
        const toDate = lastSunday.toLocaleDateString('ru-RU', dateOptions);

        // Build Telegram message
        let message = `📊 *Еженедельный отчёт*\n`;
        message += `📁 Проект: *${project.name}*\n`;
        message += `📅 ${fromDate} — ${toDate}\n\n`;

        message += `━━━ 📈 ПОКАЗАТЕЛИ ━━━\n\n`;

        message += `💰 *Расход:* ${formatCurrency(current.spend)}\n`;
        message += `   ${getPlanFactEmoji(current.spend, plan.spend)} План: ${formatCurrency(plan.spend)} | ${getPercentChange(current.spend, previous.spend)} vs прошл.нед\n\n`;

        message += `👥 *Лиды:* ${current.leads}\n`;
        message += `   ${getPlanFactEmoji(current.leads, plan.leads)} План: ${Math.round(plan.leads)} | ${getPercentChange(current.leads, previous.leads)} vs прошл.нед\n\n`;

        message += `🛒 *Продажи:* ${current.sales}\n`;
        message += `   ${getPlanFactEmoji(current.sales, plan.sales)} План: ${Math.round(plan.sales)} | ${getPercentChange(current.sales, previous.sales)} vs прошл.нед\n\n`;

        message += `💵 *Выручка:* ${formatCurrency(current.revenue)}\n`;
        message += `   ${getPlanFactEmoji(current.revenue, plan.revenue)} План: ${formatCurrency(plan.revenue)} | ${getPercentChange(current.revenue, previous.revenue)} vs прошл.нед\n\n`;

        message += `━━━ 📊 МЕТРИКИ ━━━\n\n`;

        message += `📍 CPL: ${formatCurrency(cpl)}\n`;
        message += `📍 CAC: ${formatCurrency(cac)}\n`;
        message += `📍 AOV: ${formatCurrency(aov)}\n`;
        message += `📍 ROMI: ${romi >= 0 ? '📈' : '📉'} ${formatPercent(romi)}\n`;
        message += `📍 ROAS: ${roas.toFixed(2)}x\n`;
        message += `📍 Конверсия: ${formatPercent(convRate)}\n\n`;

        if (aiAnalysis) {
          message += `━━━ 🤖 AI-АНАЛИЗ ━━━\n\n`;
          message += aiAnalysis + '\n\n';
        }

        message += `_Сформировано автоматически в AdMetrics_`;

        // Send to Telegram
        const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
        
        if (TELEGRAM_BOT_TOKEN && project.telegram_chat_id) {
          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: project.telegram_chat_id,
                text: message,
                parse_mode: 'Markdown',
              }),
            }
          );

          if (!telegramResponse.ok) {
            const errorText = await telegramResponse.text();
            throw new Error(`Telegram error: ${errorText}`);
          }

          console.log(`Report sent to Telegram for project: ${project.name}`);
          results.push({ project: project.name, success: true });
        } else {
          console.log(`Telegram not configured for project: ${project.name}`);
          results.push({ project: project.name, success: false, error: 'Telegram bot token not configured' });
        }

      } catch (projectError) {
        const errorMsg = projectError instanceof Error ? projectError.message : 'Unknown error';
        console.error(`Error processing project ${project.name}:`, errorMsg);
        results.push({ project: project.name, success: false, error: errorMsg });
      }
    }

    console.log('Weekly report generation completed:', results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Weekly report error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
