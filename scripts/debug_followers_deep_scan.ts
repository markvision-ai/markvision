
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
const ADMIN_FALLBACK_ID = '11111111-1111-1111-1111-111111111111';

async function run() {
  console.log('Scanning ALL projects for "19" in daily_data...');

  // 1. Get all projects
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('id, name');

  if (pError) {
    console.error('Error fetching projects:', pError);
    // Continue with fallbacks even if list fails
  }

  const projectList = projects || [];
  // Add fallbacks if not present
  if (!projectList.find(p => p.id === FALLBACK_PROJECT_ID)) {
    projectList.push({ id: FALLBACK_PROJECT_ID, name: 'FALLBACK_PROJECT' });
  }
  if (!projectList.find(p => p.id === ADMIN_FALLBACK_ID)) {
    projectList.push({ id: ADMIN_FALLBACK_ID, name: 'ADMIN_FALLBACK' });
  }

  console.log(`Found ${projectList.length} projects to check.`);

  for (const project of projectList) {
    console.log(`Checking project: ${project.name} (${project.id})`);
    
    const { data: dailyData, error: dError } = await supabase
      .from('daily_data')
      .select('date, followers, followers_total')
      .eq('project_id', project.id)
      .order('date', { ascending: false });

    if (dError) {
      console.error(`  Error fetching daily_data for project ${project.id}:`, dError);
      continue;
    }

    if (!dailyData || dailyData.length === 0) {
      console.log('  daily_data: NO DATA');
      continue;
    }

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

    if (calculatedSum === 19) {
        console.log('  MATCH: Sum of all followers deltas = 19');
        found19 = true;
    }

    if (found19) {
        console.log('  !!! FOUND SOURCE OF "19" !!!');
    }
  }
}

run();
