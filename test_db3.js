import fs from 'fs';

const envStr = fs.readFileSync('.env', 'utf8');
const lines = envStr.split('\n');

let url = '';
let key = '';

for(const line of lines) {
  if(line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].replace(/"/g, '').trim();
  if(line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].replace(/"/g, '').trim();
}

async function run() {
    const res = await fetch(`${url}/rest/v1/clients_config?select=ad_account_id,client_name,spend,meta_leads`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
    });
    const data = await res.json();
    console.table(data);
}
run();
