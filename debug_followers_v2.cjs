const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFollowers() {
  console.log('--- Checking Followers Data ---');

  // 1. Get all projects
  // const { data: projects, error: projectsError } = await supabase
  //   .from('projects')
  //   .select('id, name');

  // Hardcode project ID for debugging if list fails due to RLS
  const projects = [{ id: '64c94e87-630c-470e-8ab1-8f7c8c835efa', name: 'Target Project' }];
  const projectsError = null;

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('No projects found');
    return;
  }

  console.log(`Found ${projects.length} projects`);

  for (const project of projects) {
    console.log(`\nProject: ${project.name} (${project.id})`);

    // 2. Check daily_data (latest 5)
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_data')
      .select('date, followers, followers_total, followers_today, followers_yesterday')
      .eq('project_id', project.id)
      .order('date', { ascending: false })
      .limit(5);

    if (dailyError) {
      console.error('  Error fetching daily_data:', dailyError.message);
    } else if (dailyData && dailyData.length > 0) {
      console.log('  Latest daily_data entries:');
      console.table(dailyData);
    } else {
      console.log('  No daily_data found');
    }

    // 3. Check plan_data (all entries for this project)
    const { data: planData, error: planError } = await supabase
      .from('plan_data')
      .select('month, followers')
      .eq('project_id', project.id)
      .order('month', { ascending: false });

    if (planError) {
      console.error('  Error fetching plan_data:', planError.message);
    } else if (planData && planData.length > 0) {
      console.log('  Plan data entries:');
      console.table(planData);
    } else {
      console.log('  No plan_data found');
    }
  }
}

checkFollowers();
