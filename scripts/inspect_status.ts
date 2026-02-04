
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('--- Checking system_health (Worker target) ---');
  const { data: health, error: healthError } = await supabase
    .from('system_health')
    .select('*')
    .eq('service_name', 'ai_worker');
  
  if (healthError) console.error('Health Error:', healthError);
  else console.log('Health Data:', health);

  console.log('\n--- Checking system_status (Frontend target) ---');
  const { data: status, error: statusError } = await supabase
    .from('system_status')
    .select('*')
    .limit(5);

  if (statusError) console.error('Status Error:', statusError);
  else console.log('Status Data:', status);
}

inspect();
