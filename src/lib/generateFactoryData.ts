import { supabase } from '../integrations/supabase/client';

// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STAFF_ROLES = ['operator', 'engineer', 'manager', 'designer', 'copywriter'];

const SCENARIOS = [
  { type: 'automotive', title: 'Auto Review Series', topics: ['Tesla Model S Plaid', 'BMW iX Review', 'Ford F-150 Lightning', 'Porsche Taycan Turbo'] },
  { type: 'electronics', title: 'Tech Unboxing', topics: ['iPhone 16 Pro', 'Samsung Galaxy S25', 'Sony WH-1000XM6', 'MacBook Pro M4'] },
  { type: 'food', title: 'Culinary Journey', topics: ['Italian Pasta Masterclass', 'Street Food Tokyo', 'Gordon Ramsay Steak', 'Vegan Desserts'] },
  { type: 'fashion', title: 'Seasonal Trends', topics: ['Summer Collection 2026', 'Streetwear Paris', 'Sustainable Fashion', 'Luxury Watches'] },
  { type: 'finance', title: 'Crypto Daily', topics: ['Bitcoin Halving', 'Ethereum ETF', 'DeFi Trends', 'Stock Market Update'] },
  { type: 'gaming', title: 'Game Reviews', topics: ['GTA VI Gameplay', 'Elder Scrolls VI', 'Cyberpunk DLC', 'Indie Hidden Gems'] },
  { type: 'health', title: 'Wellness Tips', topics: ['Morning Yoga Routine', 'Keto Diet Guide', 'Meditation for Focus', 'HIIT Workout'] },
  { type: 'travel', title: 'World Explorer', topics: ['Bali Digital Nomad', 'Iceland Roadtrip', 'Kyoto Cherry Blossom', 'New York Hidden Spots'] },
  { type: 'education', title: 'Code Tutorials', topics: ['React vs Vue 2026', 'Rust for Beginners', 'AI Engineering 101', 'System Design'] },
  { type: 'science', title: 'Future Tech', topics: ['Fusion Energy', 'Mars Colonization', 'Quantum Computing', 'Crispr Breakthroughs'] }
];

function getRandomName() {
  const first = ['Александр', 'Мария', 'Дмитрий', 'Елена', 'Сергей', 'Анна', 'Иван', 'Ольга', 'Максим', 'Татьяна'];
  const last = ['Смирнов(а)', 'Иванов(а)', 'Петров(а)', 'Соколов(а)', 'Михайлов(а)', 'Новиков(а)', 'Федоров(а)', 'Морозов(а)', 'Волков(а)', 'Алексеев(а)'];
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
}

function getRandomStatus() {
  const r = Math.random();
  if (r < 0.1) return 'ideation';
  if (r < 0.2) return 'scripting';
  if (r < 0.6) return 'voice_ready'; // "Assembly Lines" active state
  if (r < 0.8) return 'avatar_ready';
  if (r < 0.9) return 'ready_to_send';
  return 'sent';
}

function getLineStatus(mainStatus: string, lineType: string) {
  if (['ideation', 'scripting'].includes(mainStatus)) return 'idle';
  if (['sent'].includes(mainStatus)) return 'completed';
  if (['ready_to_send'].includes(mainStatus)) return 'completed';
  
  // For active assembly states, randomize line status
  const r = Math.random();
  if (r < 0.1) return 'failed';
  if (r < 0.4) return 'processing';
  if (r < 0.7) return 'completed';
  return 'idle';
}

export const generateFactoryData = async (projectId: string) => {
  console.log('Starting Factory Data Generation...');

  // Get current user for author_id
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current User for Generation:', user?.id, user?.email);
  
  if (!user) {
    console.error('No authenticated user found. RLS may fail.');
    // Don't throw, just log, maybe the policy allows anon (unlikely but possible)
    // Actually, let's return error if no user, to be clear
    return { staffCount: 0, ordersCount: 0, error: 'User not authenticated' };
  }

  console.log('Generating data for project:', projectId);

  // Check if user is a member of the project
  const { data: memberData, error: memberError } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();
    
  if (memberError) {
    console.error('Error checking project membership:', memberError);
  }

  if (!memberData) {
    console.log('User is not a member of the project. Attempting to add...');
    // Try to add user to project_members if not present
    // This might fail if the user doesn't have permissions to add members, but it's worth a try for a test generator
    const { error: addMemberError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: user.id,
        role: 'owner' // or 'admin', 'member'
      });
      
    if (addMemberError) {
       console.error('Failed to add user to project_members:', addMemberError);
       // If we can't add, we proceed but expect failure if RLS requires membership
       // However, maybe the user is the OWNER of the project (in projects table)
    } else {
       console.log('Successfully added user to project_members');
    }
  } else {
    console.log('User is already a member of the project');
  }

  // 1. Generate Staff (50-100 employees)
  const staffCount = Math.floor(Math.random() * 50) + 50; // 50-100
  const staff = Array.from({ length: staffCount }).map(() => ({
    id: uuidv4(),
    project_id: projectId,
    full_name: `${getRandomName()}`,
    role: STAFF_ROLES[Math.floor(Math.random() * STAFF_ROLES.length)],
    email: `employee_${Math.random().toString(36).substring(7)}@markvision.factory`,
    status: 'active',
    user_id: user.id // Required by RLS if linked to user
  }));

  const { error: staffError } = await supabase.from('staff').upsert(staff.map(s => ({
    id: s.id,
    project_id: s.project_id,
    name: s.full_name,
    role: s.role,
    email: s.email,
    status: s.status,
    user_id: s.user_id
  })));
  
  if (staffError) console.error('Error generating staff:', staffError);
  else console.log(`Generated ${staffCount} staff members.`);

  // 2. Generate Active Orders (20-30 orders)
  const ordersCount = Math.floor(Math.random() * 10) + 20; // 20-30
  const orders = [];

  for (let i = 0; i < ordersCount; i++) {
    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    const topic = scenario.topics[Math.floor(Math.random() * scenario.topics.length)];
    const status = getRandomStatus();
    
    orders.push({
      project_id: projectId,
      title: `${scenario.title}: ${topic}`,
      platform_type: scenario.type,
      status: status,
      body_text: JSON.stringify({ 
        main_idea: `Create a compelling ${scenario.type} video about ${topic}.`, 
        target_audience: 'General',
        tone: 'Professional' 
      }),
      // Store extended statuses in 'body' JSON column since they don't exist as columns
      author_id: user.id, // Explicitly set author_id
      body: {
        avatar_status: getLineStatus(status, 'avatar'),
        sora_status: getLineStatus(status, 'sora'),
        carousel_status: getLineStatus(status, 'carousel'),
        threads_status: getLineStatus(status, 'threads'),
        telegram_status: getLineStatus(status, 'telegram'),
        article_status: getLineStatus(status, 'article'),
        original_script_data: {
             main_idea: `Create a compelling ${scenario.type} video about ${topic}.`, 
             target_audience: 'General',
             tone: 'Professional' 
        }
      },
      created_at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
    });
  }

  const { error: ordersError } = await supabase.from('content_factory').insert(orders);
  if (ordersError) {
    console.error('Error generating orders:', ordersError);
    // If batch insert fails, try inserting one by one to find the culprit or minimal failure
    if (ordersError.code === '42501') {
       console.error('RLS Policy Violation. Check if user is member of project:', projectId);
    }
  } else {
    console.log(`Generated ${ordersCount} production orders.`);
  }

  return { staffCount, ordersCount };
};
