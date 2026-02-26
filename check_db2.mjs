import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envStr = fs.readFileSync('.env', 'utf8');
const lines = envStr.split('\n');

let url = '';
let key = '';

for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) url = line.substring(line.indexOf('=') + 1).replace(/"/g, '').trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.substring(line.indexOf('=') + 1).replace(/"/g, '').trim();
}

console.log("URL:", url);
console.log("KEY LENGTH:", key.length);

const supabase = createClient(url, key);

async function run() {
    console.log("=== DAILY AD METRICS ===");
    const { data: daily, error: dailyErr } = await supabase
        .from('daily_ad_metrics')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);

    if (dailyErr) console.error("Error fetching daily:", dailyErr.message);
    else console.log(daily);

    console.log("\n=== AGENCY METRICS VIEW ===");
    const { data: viewData, error: viewErr } = await supabase
        .from('agency_metrics_view')
        .select('account_name, spend, meta_leads');

    if (viewErr) console.error("Error fetching view:", viewErr.message);
    else console.log(viewData);
}

run();
