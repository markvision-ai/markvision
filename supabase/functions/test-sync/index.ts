import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    // We use service role key for backend tasks
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all accounts
    const { data: accounts, error: fetchError } = await supabaseClient
        .from('clients_config')
        .select('id, ad_account_id, fb_token, client_name')

    if (fetchError || !accounts) return new Response(JSON.stringify({ error: fetchError }));

    const results = [];
    for (const account of accounts) {
        if (!account.ad_account_id || !account.fb_token) continue;

        // Meta API requires 'act_' prefix, so we ensure no double prefix here
        const cleanAccountId = account.ad_account_id.replace('act_', '');
        const insightsUrl = `https://graph.facebook.com/v19.0/act_${cleanAccountId}/insights?fields=spend,actions&date_preset=this_month&access_token=${account.fb_token}`;

        try {
            const response = await fetch(insightsUrl);
            const data = await response.json();

            if (data.error) {
                results.push(`[${account.client_name}] Error: ${data.error.message}`);
            } else if (data.data && data.data.length > 0) {
                const row = data.data[0];
                let types = [];
                if (row.actions) {
                    types = row.actions.map((a: any) => `${a.action_type}:${a.value}`);
                }
                results.push(`[${account.client_name}] Spend USD: ${row.spend} \n  Actions: ${types.join(', ')}`);
            } else {
                results.push(`[${account.client_name}] No spend/data for this month`);
            }
        } catch (e: any) {
            results.push(`Error ${account.client_name}: ${e.message}`);
        }
    }

    return new Response(results.join('\n\n'), { headers: { "Content-Type": "text/plain" } });
})
