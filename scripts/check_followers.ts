
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envConfig = {};

try {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      // Remove quotes if present
      const cleanValue = value.trim().replace(/^["'](.*)["']$/, '$1');
      envConfig[key.trim()] = cleanValue;
    }
  });
} catch (e) {
  console.error('Error reading .env file:', e);
}

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFollowers() {
  console.log('Checking followers data for project: 64c94e87-630c-470e-8ab1-8f7c8c835efa');

  // 3. Check projects table
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', '64c94e87-630c-470e-8ab1-8f7c8c835efa')
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
  } else {
    console.log('Project data (columns):');
    if (projectData) {
      console.log(Object.keys(projectData));
      console.log('Project Data:', projectData);
    }
  }
}

checkFollowers();
