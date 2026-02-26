// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getExchangeRate(dateStr: string): Promise<number> {
    const [y, m, d] = dateStr.split('-');
    const formattedDate = `${d}.${m}.${y}`;
    const url = `https://nationalbank.kz/rss/get_rates.cfm?fdate=${formattedDate}`;

    try {
        const response = await fetch(url);
        const xml = await response.text();

        const itemRegex = /<item>[\s\S]*?<title>USD<\/title>[\s\S]*?<description>([\d.]+)<\/description>[\s\S]*?<\/item>/i;
        const match = xml.match(itemRegex);

        if (match && match[1]) {
            return parseFloat(match[1]);
        }
        return 480;
    } catch (e) {
        console.error("Error fetching rate from NBK:", e);
        return 480;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json().catch(() => ({}));

        // Default to yesterday
        let targetDate = payload.date;
        if (!targetDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            targetDate = yesterday.toISOString().split('T')[0];
        }

        const exchangeRate = await getExchangeRate(targetDate);
        console.log(`Syncing for ${targetDate}, exchange rate: ${exchangeRate}`);

        const { data: accounts, error: fetchError } = await supabaseClient
            .from('clients_config')
            .select('id, ad_account_id, fb_token, project_id')

        if (fetchError) throw fetchError;

        let successCount = 0;
        let errorCount = 0;
        const results = [];
        const errors = [];

        for (const account of accounts) {
            try {
                const plainAccountId = account.ad_account_id.replace('act_', '');
                const timeRange = JSON.stringify({ since: targetDate, until: targetDate });
                const insightsUrl = `https://graph.facebook.com/v19.0/act_${plainAccountId}/insights?fields=spend,actions&time_range=${encodeURIComponent(timeRange)}&access_token=${account.fb_token}`;

                const response = await fetch(insightsUrl);
                const data = await response.json();

                let spendValKZT = 0;
                let metaLeads = 0;

                if (data.data && data.data.length > 0) {
                    const row = data.data[0];
                    const spendUSD = parseFloat(row.spend || '0');
                    spendValKZT = spendUSD * exchangeRate;

                    if (row.actions) {
                        for (const action of row.actions) {
                            const type = action.action_type || '';
                            if (
                                type === 'lead' ||
                                type === 'onsite_conversion.lead_grouped' ||
                                type === 'offsite_conversion.fb_pixel_lead' ||
                                type === 'onsite_conversion.messaging_conversation_started_7d' ||
                                type === 'omni_lead'
                            ) {
                                metaLeads += parseInt(action.value || '0', 10);
                            }
                        }
                    }
                }

                // 1. Upsert into daily_ad_metrics
                const { error: upsertError } = await supabaseClient
                    .from('daily_ad_metrics')
                    .upsert({
                        ad_account_id: account.ad_account_id,
                        date: targetDate,
                        spend: spendValKZT,
                        meta_leads: metaLeads
                    }, { onConflict: 'ad_account_id,date' });

                if (upsertError) throw upsertError;

                successCount++;
                results.push({ id: account.id, date: targetDate, spendKZT: spendValKZT, leads: metaLeads });
            } catch (err) {
                errors.push({ id: account.id, error: err.message });
                errorCount++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            date: targetDate,
            exchange_rate: exchangeRate,
            details: { successful: successCount, failed: errorCount, results, errors }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
