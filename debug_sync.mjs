import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
    console.log("Fetching accounts...");
    const { data: accounts, error: fetchError } = await supabase
        .from('clients_config')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }

    const account = accounts[0];
    console.log("Attempting update for:", account.client_name, account.id);

    const { error: updateError } = await supabase
        .from('clients_config')
        .update({
            spend: 123.45,
            meta_leads: 10
        })
        .eq('id', account.id);

    if (updateError) {
        console.error("Update Error:", updateError);
    } else {
        console.log("Update SUCCESS for", account.client_name);
    }
}

debug();
