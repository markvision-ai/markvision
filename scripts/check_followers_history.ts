
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual env loading
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/['"]/g, '');
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.replace(/['"]/g, '');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFollowersHistory() {
  console.log('--- Checking followers_history ---');
  
  // Check schema first (limit 1)
  const { data: sample, error: sampleError } = await supabase
    .from('followers_history')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Error fetching followers_history sample:', sampleError);
  } else {
    console.log('followers_history columns:', sample && sample.length > 0 ? Object.keys(sample[0]) : 'No records found');
  }

  // Check for value 19
  const { data: matches, error: matchError } = await supabase
    .from('followers_history')
    .select('*')
    .eq('followers_count', 19);

  if (matchError) {
    console.error('Error searching for 19:', matchError);
  } else {
    console.log(`Found ${matches?.length || 0} records with followers_count = 19`);
    if (matches && matches.length > 0) {
      console.log('Sample match:', matches[0]);
    }
  }
}

checkFollowersHistory();
