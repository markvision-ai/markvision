import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch all active accounts from clients_config
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

        // 2. Loop through each account and fetch data from Meta API
        for (const account of accounts) {
            if (!account.ad_account_id || !account.fb_token) {
                errorCount++;
                continue;
            }

            try {
                // Fetch Insights for the current month
                const insightsUrl = `https://graph.facebook.com/v18.0/act_${account.ad_account_id}/insights?fields=spend,clicks,impressions&date_preset=this_month&access_token=${account.fb_token}`;

                const insightsResponse = await fetch(insightsUrl);
                const insightsData = await insightsResponse.json();

                // Fetch Leads for the current month (or use total leads if insights isn't sufficient)
                // Meta doesn't return leads directly in basic insights without 'actions' breakdown, so we'll query action_breakdown if needed.
                // For simplicity, we just request actions as well.
                const insightsWithActionsUrl = `https://graph.facebook.com/v18.0/act_${account.ad_account_id}/insights?fields=spend,actions&date_preset=this_month&access_token=${account.fb_token}`;
                const actionsResponse = await fetch(insightsWithActionsUrl);
                const actionsData = await actionsResponse.json();

                let spend = 0;
                let metaLeads = 0;

                if (actionsData.data && actionsData.data.length > 0) {
                    const row = actionsData.data[0];
                    spend = parseFloat(row.spend || '0');

                    if (row.actions) {
                        const leadAction = row.actions.find((a: any) => a.action_type === 'lead');
                        metaLeads = leadAction ? parseInt(leadAction.value, 10) : 0;
                    }
                } else if (insightsData.data && insightsData.data.length > 0) {
                    // Backup fallback if actions fetch failed but spend is available
                    spend = parseFloat(insightsData.data[0].spend || '0');
                }

                // 3. Update the clients_config table
                const { error: updateError } = await supabaseClient
                    .from('clients_config')
                    .update({
                        spend: spend,
                        meta_leads: metaLeads,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', account.id);

                if (updateError) {
                    console.error(`Error updating account ${account.ad_account_id}:`, updateError);
                    errorCount++;
                } else {
                    successCount++;
                }
            } catch (err) {
                console.error(`Exception processing account ${account.ad_account_id}:`, err);
                errorCount++;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Processed ${accounts.length} accounts`,
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
