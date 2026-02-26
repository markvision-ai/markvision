import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'))

const supabase = createClient(
    envConfig.VITE_SUPABASE_URL,
    envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const { data: configs, error: configError } = await supabase.from('clients_config').select('*').limit(5);
    console.log("Configs:", configs, "Error:", configError);
    
    // We can't query agency_metrics_view safely here yet because we just defined the migration but haven't applied it!
}

run();
