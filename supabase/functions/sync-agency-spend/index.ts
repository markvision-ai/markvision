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

function getDatesInRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
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

        // Default to yesterday and today
        let startDate = payload.startDate;
        let endDate = payload.endDate;

        if (!startDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = yesterday.toISOString().split('T')[0];
        }
        if (!endDate) {
            endDate = new Date().toISOString().split('T')[0];
        }

        const datesToSync = getDatesInRange(startDate, endDate);
        console.log(`Syncing for range ${startDate} to ${endDate}, dates:`, datesToSync);

        const { data: accounts, error: fetchError } = await supabaseClient
            .from('clients_config')
            .select('id, ad_account_id, fb_token, project_id')

        if (fetchError) throw fetchError;

        let totalSuccess = 0;
        const syncDetails = [];

        for (const date of datesToSync) {
            const exchangeRate = await getExchangeRate(date);
            console.log(`Processing date: ${date}, rate: ${exchangeRate}`);

            for (const account of accounts) {
                try {
                    const plainAccountId = account.ad_account_id.replace('act_', '');
                    const timeRange = JSON.stringify({ since: date, until: date });
                    const insightsUrl = `https://graph.facebook.com/v19.0/act_${plainAccountId}/insights?fields=spend,actions&time_range=${encodeURIComponent(timeRange)}&access_token=${account.fb_token}`;

                    const response = await fetch(insightsUrl);
                    const data = await response.json();

                    if (data.error) {
                        console.error(`FB Error for ${account.ad_account_id} on ${date}:`, data.error);
                        continue;
                    }

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

                    // Upsert into daily_ad_metrics
                    const { error: upsertError } = await supabaseClient
                        .from('daily_ad_metrics')
                        .upsert({
                            ad_account_id: account.ad_account_id,
                            date: date,
                            spend: spendValKZT,
                            meta_leads: metaLeads
                        }, { onConflict: 'ad_account_id,date' });

                    if (upsertError) throw upsertError;

                    totalSuccess++;
                    syncDetails.push({ id: account.id, date, spendKZT: spendValKZT, leads: metaLeads });
                } catch (err) {
                    console.error(`Failed to sync ${account.ad_account_id} on ${date}:`, err.message);
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            synced_count: totalSuccess,
            details: syncDetails
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
