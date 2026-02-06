const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://pyscczcuersdjvpmkiec.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5c2NjemN1ZXJzZGp2cG1raWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyODUsImV4cCI6MjA4MjIzNDI4NX0.a2aHw_RwTj1_aLA-r-wOhE2Wn3Jcx8rLgFJyEQJ018k";
const PROJECT_ID = '64c94e87-630c-470e-8ab1-8f7c8c835efa';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFollowers() {
  console.log('Checking followers for project:', PROJECT_ID);

  const { data, error } = await supabase
    .from('daily_data')
    .select('date, followers, followers_total, project_id')
    .eq('project_id', PROJECT_ID)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  console.log(`Found ${data.length} records.`);
  
  if (data.length === 0) {
    console.log('No data found.');
    return;
  }

  console.table(data);

  const sumFollowers = data.reduce((acc, row) => acc + (row.followers || 0), 0);
  const lastRecord = data[data.length - 1];
  const lastTotal = lastRecord.followers_total;

  console.log('-----------------------------------');
  console.log('Sum of "followers" (deltas):', sumFollowers);
  console.log('Last "followers_total" (snapshot):', lastTotal);
  console.log('-----------------------------------');
}

checkFollowers();
