import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=([^\n]+)/);
const keyMatch = envFile.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=([^\n]+)/);

const supabase = createClient(
    urlMatch ? urlMatch[1] : '',
    keyMatch ? keyMatch[1] : ''
);

async function inspectDB() {
    try {
        let { data: tables, error } = await supabase.from('clients_config').select('*').limit(1);
        console.log("clients_config:", tables, error);

        let { data: t2, error: e2 } = await supabase.from('client_config').select('*').limit(1);
        console.log("client_config:", t2, e2);
    } catch (e) {
        console.log(e);
    }
}

inspectDB();
