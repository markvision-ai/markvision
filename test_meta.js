import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // need fetch for node
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
        .select('id, ad_account_id, fb_token')
        .limit(1);

    if (fetchError || !accounts || accounts.length === 0) {
        console.error("Failed to fetch configs", fetchError);
        return;
    }
    
    const account = accounts[0];
    console.log("Testing with account:", account.ad_account_id);
    
    const insightsUrl = `https://graph.facebook.com/v19.0/act_${account.ad_account_id}/insights?fields=spend,actions&date_preset=this_month&access_token=${account.fb_token}`;
    
    console.log("Hitting Meta API length:", insightsUrl.length);
    const response = await fetch(insightsUrl);
    const data = await response.json();
    console.log("Response:", data);
}
run();
