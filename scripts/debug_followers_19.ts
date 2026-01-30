
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env manually
const envPath = path.resolve(__dirname, '../.env');
let envConfig: Record<string, string> = {};
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

async function run() {
  console.log('Searching for "19" in database...');

  // 1. Get all projects
  const { data: projects, error: pError } = await supabase.from('projects').select('id, name');
  if (pError) {
    console.error('Error fetching projects:', pError);
    return;
  }

  console.log(`Found ${projects.length} projects.`);

  for (const p of projects) {
    console.log(`\nProject: ${p.name} (${p.id})`);

    // 2. Check daily_data
    const { data: dailyData, error: dError } = await supabase
      .from('daily_data')
      .select('date, followers, followers_total, leads')
      .eq('project_id', p.id)
      .order('date', { ascending: false })
      .limit(10);

    if (dError) console.error('  Error fetching daily_data:', dError);
    else {
      if (dailyData.length === 0) console.log('  daily_data: NO DATA');
      else {
        dailyData.forEach(d => {
          if (d.followers === 19) console.log(`  MATCH: daily_data.followers = 19 on ${d.date}`);
          if (d.followers_total === 19) console.log(`  MATCH: daily_data.followers_total = 19 on ${d.date}`);
          if (d.leads === 19) console.log(`  MATCH: daily_data.leads = 19 on ${d.date}`);
        });
        const totalFollowersSum = dailyData.reduce((sum, d) => sum + (d.followers || 0), 0);
        console.log(`  Sum of recent followers deltas: ${totalFollowersSum}`);
        if (totalFollowersSum === 19) console.log('  MATCH: Sum of recent followers deltas = 19');
      }
    }

    // 3. Check leads count
    const { count: leadsCount, error: lError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', p.id);
    
    if (lError) console.error('  Error fetching leads count:', lError);
    else {
      console.log(`  Total leads count: ${leadsCount}`);
      if (leadsCount === 19) console.log('  MATCH: Total leads count = 19');
    }

    // 4. Check plan_data
    const { data: planData, error: plError } = await supabase
      .from('plan_data')
      .select('*')
      .eq('project_id', p.id);
    
    if (plError) console.error('  Error fetching plan_data:', plError);
    else if (planData) {
       planData.forEach(pd => {
           // check if any field is 19
           Object.entries(pd).forEach(([k, v]) => {
               if (v === 19) console.log(`  MATCH: plan_data.${k} = 19 for month ${pd.month}`);
           });
       });
    }
  }
}

run();
