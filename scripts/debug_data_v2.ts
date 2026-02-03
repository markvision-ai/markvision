
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

// Clean quotes if present
const cleanUrl = supabaseUrl.replace(/["']/g, '');
const cleanKey = supabaseKey.replace(/["']/g, '');

const supabase = createClient(cleanUrl, cleanKey);

const TARGET_PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

async function checkData() {
  console.log('--- Checking Daily Data (All Projects, Limit 5) ---');
  const { data: allDaily, error: dailyError } = await supabase
    .from('daily_data')
    .select('*')
    .limit(5);

  if (dailyError) {
    console.error('Error fetching daily_data:', dailyError);
  } else {
    console.log(`Found ${allDaily?.length} rows in daily_data.`);
    if (allDaily && allDaily.length > 0) {
        console.log('Sample row:', allDaily[0]);
    }
  }

  console.log('\n--- Checking Daily Data for Target Project ---');
  const { data: targetDaily, error: targetError } = await supabase
    .from('daily_data')
    .select('*')
    .eq('project_id', TARGET_PROJECT_ID);

  if (targetError) {
    console.error('Error fetching target daily_data:', targetError);
  } else {
    console.log(`Found ${targetDaily?.length} rows for target project.`);
    if (targetDaily?.length === 0) {
        console.log('WARNING: No daily_data for target project. This explains why aggregation might fallback or show 0.');
    } else {
        // Sort by date desc
        const sorted = targetDaily?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        console.log('Latest 3 rows:', sorted?.slice(0, 3));
    }
  }
  
  console.log('\n--- Checking Plan Data ---');
  const { data: planData, error: planError } = await supabase
    .from('plan_data')
    .select('*')
    .eq('project_id', TARGET_PROJECT_ID);

  if (planError) {
    console.error('Error fetching plan_data:', planError);
  } else {
    console.log(`Found ${planData?.length} rows in plan_data.`);
            if (planData && planData.length > 0) {
                console.log('Plan data:', planData);
            }
          }
          
          console.log('\\n--- Checking Leads Count ---');
          const { count: leadsCount, error: leadsError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', TARGET_PROJECT_ID);
            
          if (leadsError) {
             console.error('Error fetching leads count:', leadsError);
          } else {
             console.log(`Leads count for target project: ${leadsCount}`);
          }
          
          console.log('\\n--- Checking Webhook Logs ---');
          const { count: logsCount, error: logsError } = await supabase
            .from('webhook_logs')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', TARGET_PROJECT_ID);

          if (logsError) {
             console.error('Error fetching webhook_logs count:', logsError);
          } else {
             console.log(`Webhook logs count for target project: ${logsCount}`);
          }

}

checkData();
