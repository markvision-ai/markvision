
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

async function main() {
  console.log('🔍 Inspecting daily_data for project:', PROJECT_ID);

  const { data, error } = await supabase
    .from('daily_data')
    .select('date, followers, followers_total, ig_followers_total, ig_followers_new, new_followers')
    .eq('project_id', PROJECT_ID)
    .order('date', { ascending: true });

  if (error) {
    console.error('❌ Error fetching data:', error);
    return;
  }

  console.log(`📊 Found ${data.length} records`);
  
  let followersSum = 0;
  let newFollowersSum = 0;
  let igFollowersNewSum = 0;

  console.table(data);

  data.forEach(d => {
    followersSum += (d.followers || 0);
    newFollowersSum += (d.new_followers || 0);
    igFollowersNewSum += (d.ig_followers_new || 0);
  });

  console.log('--- Summary ---');
  console.log('Sum of "followers" (delta):', followersSum);
  console.log('Sum of "new_followers":', newFollowersSum);
  console.log('Sum of "ig_followers_new":', igFollowersNewSum);
  
  const latest = data[data.length - 1];
  console.log('Latest record:', latest);
  
  if (latest) {
    console.log('Latest "followers_total":', latest.followers_total);
    console.log('Latest "ig_followers_total":', latest.ig_followers_total);
  }

  // Check for "19"
  if (followersSum === 19) console.log('🎯 FOUND: Sum of "followers" is 19!');
  if (latest?.followers_total === 19) console.log('🎯 FOUND: Latest "followers_total" is 19!');
}

main();
