import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const VITE_SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const VITE_SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.XEqBMKnpDsbrOIGz8VEcCkL0-ABzV8a7LxMrVNT7ATU";

const supabaseClient = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Fetching accounts from Supabase...");
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

        const cleanAccountId = account.ad_account_id.replace('act_', '');
        const insightsUrl = `https://graph.facebook.com/v19.0/act_${cleanAccountId}/insights?fields=spend,actions&date_preset=this_month&access_token=${account.fb_token}`;

        try {
            const response = await fetch(insightsUrl);
            const data = await response.json();

            if (data.error) {
                console.log(`[${account.client_name}] Error:`, data.error.message);
            } else if (data.data && data.data.length > 0) {
                const row = data.data[0];
                let types = [];
                if (row.actions) {
                    types = row.actions.map(a => `${a.action_type}:${a.value}`);
                }
                console.log(`[${account.client_name}] Spend USD: ${row.spend} | Actions:`, types.join(', '));
            } else {
                console.log(`[${account.client_name}] No spend/data for this month`);
            }
        } catch (e) {
            console.error(`Error ${account.client_name}`, e.message);
        }
    }
}
run();
