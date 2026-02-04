
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env manually
const envPath = path.resolve(__dirname, '../.env');
const envConfig: Record<string, string> = {};

try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      envConfig[key] = value;
    }
  });
} catch (e) {
  console.error('Error reading .env file:', e);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const cleanUrl = supabaseUrl.replace(/["']/g, '');
const cleanKey = supabaseKey.replace(/["']/g, '');

const supabase = createClient(cleanUrl, cleanKey);

const BRIDGE_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

async function checkBridge() {
  console.log('--- Checking AI Bridge Connection ---');
  console.log('Project ID:', BRIDGE_PROJECT_ID);

  // 1. Check if table exists and has columns
  console.log('\n1. Checking table structure...');
  const { data: structure, error: structureError } = await supabase
    .from('ai_bridge_tasks')
    .select('id, project_id, status, prompt')
    .limit(1);

  if (structureError) {
    console.error('❌ Error checking table structure:', structureError.message);
    if (structureError.message.includes('does not exist')) {
        console.error('Hint: Table "ai_bridge_tasks" might be missing.');
    } else if (structureError.message.includes('column')) {
        console.error('Hint: A column might be missing (e.g., project_id).');
    }
    return;
  }
  console.log('✅ Table structure looks correct (select worked).');

  // 2. Check for pending tasks
  console.log('\n2. Checking for pending tasks...');
  const { data: pending, error: pendingError, count } = await supabase
    .from('ai_bridge_tasks')
    .select('id, created_at, status', { count: 'exact' })
    .eq('status', 'pending')
    .eq('project_id', BRIDGE_PROJECT_ID);

  if (pendingError) {
    console.error('❌ Error fetching pending tasks:', pendingError.message);
  } else {
    console.log(`✅ Pending tasks count: ${count}`);
    if (pending && pending.length > 0) {
        console.log('Latest pending task:', pending[0]);
    }
  }

  // 3. Test Insert (Simulate Bridge Task Creation)
  console.log('\n3. Testing Task Insertion...');
  const testId = crypto.randomUUID();
  const { data: insertData, error: insertError } = await supabase
    .from('ai_bridge_tasks')
    .insert({
        id: testId,
        project_id: BRIDGE_PROJECT_ID,
        prompt: 'TEST_CONNECTION_CHECK',
        status: 'pending'
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
  } else {
    console.log('✅ Insert successful:', insertData.id);
    
    // Cleanup
    const { error: deleteError } = await supabase
        .from('ai_bridge_tasks')
        .delete()
        .eq('id', testId);
        
    if (deleteError) {
        console.warn('⚠️ Failed to cleanup test task:', deleteError.message);
    } else {
        console.log('✅ Cleanup successful.');
    }
  }

  console.log('\n--- Diagnosis Complete ---');
}

checkBridge();
