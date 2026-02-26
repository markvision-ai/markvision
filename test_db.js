import fs from 'fs';
const envStr = fs.readFileSync('.env', 'utf8');

// The keys might be wrapped in quotes
function extractEnv(key) {
    const match = envStr.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim().replace(/^"|"$/g, '') : null;
}

const url = extractEnv('VITE_SUPABASE_URL');
const key = extractEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

async function run() {
    const res = await fetch(`${url}/rest/v1/clients_config?select=ad_account_id,client_name,spend,meta_leads`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}
run();
