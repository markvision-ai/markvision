
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

async function testInsert() {
  console.log('Testing custom status insert...');
  const { data, error } = await supabase
    .from('ai_bridge_tasks')
    .insert({
      project_id: '64c94e87-630c-470e-8ab1-8f7c8c835efa',
      prompt: 'Test custom status',
      status: 'pending_local'
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert success:', data);
    // Cleanup
    await supabase.from('ai_bridge_tasks').delete().eq('id', data.id);
  }
}

testInsert();
