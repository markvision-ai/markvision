
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

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
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envConfig[key] = value;
    }
  });
} catch (e) {
  console.error('Error reading .env file:', e);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const FALLBACK_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

async function run() {
  console.log(`Searching for "19" in daily_data for project ${FALLBACK_PROJECT_ID}...`);

  // 1. Check daily_data directly
  const { data: dailyData, error: dError } = await supabase
    .from('daily_data')
    .select('date, followers, followers_total')
    .eq('project_id', FALLBACK_PROJECT_ID)
    .order('date', { ascending: false });

  if (dError) {
    console.error('  Error fetching daily_data:', dError);
  } else {
    if (!dailyData || dailyData.length === 0) {
      console.log('  daily_data: NO DATA');
    } else {
      console.log(`  Found ${dailyData.length} records in daily_data.`);
      
      let found19 = false;
      let calculatedSum = 0;

      dailyData.forEach(d => {
        calculatedSum += (d.followers || 0);

        if (d.followers === 19) {
            console.log(`  MATCH: daily_data.followers = 19 on ${d.date}`);
            found19 = true;
        }
        if (d.followers_total === 19) {
            console.log(`  MATCH: daily_data.followers_total = 19 on ${d.date}`);
            found19 = true;
        }
      });
      
      console.log(`  Sum of all followers deltas: ${calculatedSum}`);
      if (calculatedSum === 19) {
          console.log('  MATCH: Sum of all followers deltas = 19');
          found19 = true;
      }
      
      if (!found19) {
          console.log('  No "19" found in followers or followers_total columns.');
          // Log the most recent record to see what it is
          console.log('  Most recent record:', dailyData[0]);
      }
    }
  }
}

run();
