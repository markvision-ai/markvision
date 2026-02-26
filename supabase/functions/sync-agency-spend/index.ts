import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper: Fetch KZT rate from National Bank XML
async function fetchKZTRate(): Promise<number> {
    try {
        // We use today's date or yesterday depending on when bank updates. Today is usually fine.
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const fdate = `${dd}.${mm}.${yyyy}`;

        const url = `https://nationalbank.kz/rss/get_rates.cfm?fdate=${fdate}`;
        console.log(`Fetching rates from: ${url}`);

        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");

        const text = await response.text();

        // Simple regex to find USD rate block
        const usdMatch = text.match(/<title>USD<\/title>[\s\S]*?<description>([\d.]+)<\/description>/i);
        if (usdMatch && usdMatch[1]) {
            const rate = parseFloat(usdMatch[1]);
            console.log(`Parsed USD/KZT Rate: ${rate}`);
            return rate > 0 ? rate : 480;
        }
    } catch (error) {
        console.error("Error fetching KZT rate, using fallback 480:", error);
    }
    return 480; // Fallback
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch Exchange Rate
        const exchangeRate = await fetchKZTRate();

        // 2. Fetch all active accounts from clients_config
        const { data: accounts, error: fetchError } = await supabaseClient
            .from('clients_config')
            .select('id, ad_account_id, fb_token')

        if (fetchError) throw fetchError;
        if (!accounts || accounts.length === 0) {
            return new Response(JSON.stringify({ message: "No accounts found" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        let successCount = 0;
        let errorCount = 0;

        // 3. Loop through each account
        for (const account of accounts) {
            if (!account.ad_account_id || !account.fb_token) {
                errorCount++;
                continue;
            }

            try {
                // Clean the ID so we don't end up with act_act_
                const plainAccountId = account.ad_account_id.replace('act_', '');

                // Fetch Meta Graph API v19.0 for current month spend and actions
                const insightsUrl = `https://graph.facebook.com/v19.0/act_${plainAccountId}/insights?fields=spend,actions&date_preset=this_month&access_token=${account.fb_token}`;

                const response = await fetch(insightsUrl);
                const data = await response.json();

                let spendVal = 0;
                let metaLeads = 0;

                if (data.data && data.data.length > 0) {
                    const row = data.data[0];

                    // User requested to STOP KZT conversion. Save raw USD spend.
                    const spendUSD = parseFloat(row.spend || '0');
                    spendVal = spendUSD;

                    // Parse Actions
                    if (row.actions) {
                        let totalLeads = 0;
                        for (const action of row.actions) {
                            const type = action.action_type || '';
                            if (
                                type.includes('lead') ||
                                type.includes('messaging_conversation_started') ||
                                type.includes('messaging_connection') ||
                                type.includes('omni_') ||
                                type === 'onsite_conversion.lead_grouped' ||
                                type === 'offsite_conversion.fb_pixel_lead'
                            ) {
                                totalLeads += parseInt(action.value || '0', 10);
                            }
                        }
                        metaLeads = totalLeads;
                    }
                } else if (data.error) {
                    console.error(`FB API Error for account ${account.ad_account_id}:`, data.error.message);
                }

                // 4. Update clients_config synchronously
                const { error: updateError } = await supabaseClient
                    .from('clients_config')
                    .update({
                        spend: spendVal,
                        meta_leads: metaLeads
                    })
                    .eq('id', account.id);

                if (updateError) {
                    console.error(`Error updating account ${account.ad_account_id}:`, updateError);
                    errorCount++;
                } else {
                    console.log(`Account ${account.ad_account_id} | Spend USD: ${spendVal} | Leads: ${metaLeads}`);
                    successCount++;
                }
            } catch (err) {
                console.error(`Exception processing account ${account.ad_account_id}:`, err);
                errorCount++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${accounts.length} accounts. Exchange Rate: ${exchangeRate}`,
            details: { successful: successCount, failed: errorCount }
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
