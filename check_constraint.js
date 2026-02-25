import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envConfig = dotenv.parse(fs.readFileSync('.env'))

const supabase = createClient(
    envConfig.VITE_SUPABASE_URL,
    envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraint() {
    const { error } = await supabase
        .from('ad_accounts')
        .upsert({
            project_id: 'e69458ec-77d0-4afb-afb1-5828ed785eec', // Some dummy or real UUID
            platform: 'facebook',
            ad_account_id: 'test_123',
            ad_account_name: 'Test',
            selected_ad_account_name: 'Test',
            access_token: 'test',
            status: 'active'
        }, {
            onConflict: 'project_id,platform,ad_account_id'
        });

    console.log("Error:", error);
}

checkConstraint();
