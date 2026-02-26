source .env

node -e "
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseClient = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: accounts, error: fetchError } = await supabaseClient
        .from('clients_config')
        .select('id, ad_account_id, fb_token, client_name');

    if (fetchError || !accounts) return;
    
    for (const account of accounts) {
        if (!account.ad_account_id || !account.fb_token) continue;
        const cleanAccountId = account.ad_account_id.replace('act_', '');
        const insightsUrl = \`https://graph.facebook.com/v19.0/act_\${cleanAccountId}/insights?fields=spend,actions&date_preset=this_month&access_token=\${account.fb_token}\`;
        
        try {
            const response = await fetch(insightsUrl);
            const data = await response.json();
            
            if (data.error) {
                console.log(\`[\${account.client_name}] Error:\`, data.error.message);
            } else if (data.data && data.data.length > 0) {
                const row = data.data[0];
                let types = [];
                if (row.actions) {
                   types = row.actions.map(a => \`\${a.action_type}:\${a.value}\`);
                }
                console.log(\`[\${account.client_name}] Spend USD: \${row.spend} | Actions: \${types.join(', ')}\`);
            } else {
                console.log(\`[\${account.client_name}] No spend/data for this month\`);
            }
        } catch (e) {
            console.error(\`Error \${account.client_name}\`, e.message);
        }
    }
}
run();
"
