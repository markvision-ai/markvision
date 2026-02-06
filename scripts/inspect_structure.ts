
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function inspectTables() {
  console.log('--- Inspecting system_health columns ---');
  // We can't easily get table structure via JS client without admin API or inferring from a select
  // Let's try to select * limit 1 and see keys
  const { data: healthData, error: healthError } = await supabase
    .from('system_health')
    .select('*')
    .limit(1);

  if (healthError) console.error('Error fetching system_health:', healthError);
  else if (healthData && healthData.length > 0) {
    console.log('system_health columns:', Object.keys(healthData[0]));
  } else {
    console.log('system_health is empty, trying to insert dummy to see error...');
    const { error } = await supabase.from('system_health').insert({}).select();
    if (error) console.log('Insert error (might reveal columns):', error);
  }

  console.log('\n--- Inspecting ai_bridge_tasks status constraint ---');
  // Try to insert an invalid status to see the constraint definition in error message if possible
  const { error: taskError } = await supabase.from('ai_bridge_tasks').insert({
    project_id: '64c94e87-630c-470e-8ab1-8f7c8c835efa',
    prompt: 'test',
    status: 'INVALID_STATUS_CHECK'
  });
  if (taskError) {
    console.log('Task Insert Error:', taskError.message);
    if (taskError.details) console.log('Details:', taskError.details);
  }
}

inspectTables();
