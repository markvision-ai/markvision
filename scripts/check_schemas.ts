
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

async function inspectSchemas() {
  console.log('--- Inspecting daily_data schema ---');
  const { data: dailyData, error: dailyError } = await supabase
    .from('daily_data')
    .select('*')
    .limit(1);

  if (dailyError) {
    console.error('Error fetching daily_data:', dailyError);
  } else if (dailyData && dailyData.length > 0) {
    console.log('daily_data columns:', Object.keys(dailyData[0]));
  } else {
    console.log('daily_data is empty or no access');
  }

  console.log('\n--- Inspecting instagram_content_stats schema ---');
  const { data: instaData, error: instaError } = await supabase
    .from('instagram_content_stats')
    .select('*')
    .limit(1);

  if (instaError) {
    console.error('Error fetching instagram_content_stats:', instaError);
  } else if (instaData && instaData.length > 0) {
    console.log('instagram_content_stats columns:', Object.keys(instaData[0]));
  } else {
    console.log('instagram_content_stats is empty or no access');
  }
}

inspectSchemas();
