
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

async function inspectTasks() {
  console.log('--- Inspecting Last 5 AI Bridge Tasks ---');
  const { data, error } = await supabase
    .from('ai_bridge_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching tasks:', error);
    return;
  }

  data.forEach(task => {
    console.log(`\nID: ${task.id}`);
    console.log(`Status: ${task.status}`);
    console.log(`Created: ${task.created_at}`);
    console.log(`Updated: ${task.updated_at}`);
    console.log(`Prompt: ${task.prompt.substring(0, 50)}...`);
    console.log('Full Task Object Keys:', Object.keys(task));
    console.log('Full Task Object:', JSON.stringify(task, null, 2));
  });
}

inspectTasks();
