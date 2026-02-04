
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

async function testHeartbeat() {
  const nowIso = new Date().toISOString();
  console.log('Testing Heartbeat at:', nowIso);

  // 1. Legacy system_status
  console.log('1. Testing system_status upsert...');
  const { data: statusData, error: statusError } = await supabase
    .from('system_status')
    .upsert({ 
      id: 'mark-ai-worker', 
      last_seen: nowIso 
    })
    .select();
    
  if (statusError) {
    console.error('❌ system_status failed:', statusError);
  } else {
    console.log('✅ system_status success:', statusData);
  }

  // 2. New system_health
  console.log('2. Testing system_health insert/update...');
  const payload = {
    service_name: 'ai_worker',
    service_type: 'worker',
    status: 'operational',
    last_check_at: nowIso,
    updated_at: nowIso,
    project_id: '64c94e87-630c-470e-8ab1-8f7c8c835efa'
  };

  // Try insert directly to see if it works or fails with constraint
  // We use upsert on a unique constraint if possible, or just insert
  // Let's check if we can select first
  const { data: existing } = await supabase
    .from('system_health')
    .select('id')
    .eq('service_name', 'ai_worker')
    .single();

  if (existing) {
    console.log('Found existing health record, updating...');
    const { error: updateError } = await supabase
        .from('system_health')
        .update(payload)
        .eq('id', existing.id);
    if (updateError) console.error('❌ system_health update failed:', updateError);
    else console.log('✅ system_health update success');
  } else {
    console.log('No existing health record, inserting...');
    const { error: insertError } = await supabase
        .from('system_health')
        .insert(payload);
    if (insertError) console.error('❌ system_health insert failed:', insertError);
    else console.log('✅ system_health insert success');
  }
}

testHeartbeat();
