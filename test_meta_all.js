import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'))

const supabaseClient = createClient(
    envConfig.VITE_SUPABASE_URL,
    envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const { data: accounts, error: fetchError } = await supabaseClient
        .from('clients_config')
        .select('id, ad_account_id, fb_token, client_name');

    if (fetchError || !accounts) {
        console.error("Failed to fetch configs", fetchError);
        return;
    }
    
    console.log(`Found ${accounts.length} accounts. Testing API...`);
    
    for (const account of accounts) {
        if (!account.ad_account_id || !account.fb_token) {
            console.log(`[${account.client_name}] Missing ID or Token`);
            continue;
        }

        // Meta API requires 'act_' prefix. Ensure we don't double it.
        const cleanAccountId = account.ad_account_id.replace('act_', '');
        const insightsUrl = `https://graph.facebook.com/v19.0/act_${cleanAccountId}/insights?fields=spend,actions&date_preset=this_month&access_token=${account.fb_token}`;
        
        try {
            const response = await fetch(insightsUrl);
            const data = await response.json();
            
            if (data.error) {
                console.log(`[${account.client_name}] Error:`, data.error.message);
            } else if (data.data && data.data.length > 0) {
                const row = data.data[0];
                const actionsStr = JSON.stringify(row.actions || []).substring(0, 100);
                console.log(`[${account.client_name}] Spend: ${row.spend} | Actions preview: ${actionsStr}...`);
            } else {
                console.log(`[${account.client_name}] No data for this month`);
            }
        } catch (e) {
            console.error(`[${account.client_name}] Network/parse error:`, e.message);
        }
    }
}
run();
