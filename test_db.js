import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'))

const supabase = createClient(
    envConfig.VITE_SUPABASE_URL,
    envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function runSQL() {
    const { data: configs, error: configErr } = await supabase.from('clients_config').select('*').limit(1);
    console.log("Configs columns present:", configs ? Object.keys(configs[0]) : "None", "Error:", configErr);
}
runSQL();
