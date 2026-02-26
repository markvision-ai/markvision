import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'))

const supabase = createClient(
    envConfig.VITE_SUPABASE_URL,
    envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function runSQL() {
    // Let's see what's actually in clients_config
    const { data: configs, error: configErr } = await supabase.from('clients_config').select('*');
    console.log("Raw clients_config count:", configs?.length, "Error:", configErr);
    
    // Now let's see what the view returns for this specific project
    // Project ID from the screenshot looks like we should just fetch all from view to see
    const { data: viewData, error: viewErr } = await supabase.from('agency_metrics_view').select('*');
    console.log("Raw agency_metrics_view count:", viewData?.length, "Error:", viewErr);
    
    if (configs && configs.length > 0) {
        console.log("Sample config project_id:", configs[0].project_id);
    }
}
runSQL();
