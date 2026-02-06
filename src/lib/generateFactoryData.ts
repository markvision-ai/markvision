import { supabase } from '../integrations/supabase/client';

// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STAFF_ROLES = ['operator', 'engineer', 'manager', 'designer', 'copywriter'];

const SCENARIOS = [
  { 
    type: 'dental_implants', 
    title: 'Имплантация Зубов', 
    topics: [
      'Все на 4 (All-on-4): Полное восстановление зубов за 1 день',
      'Одномоментная имплантация: Удаление и установка сразу',
      'Синус-лифтинг: Когда кости недостаточно для импланта',
      'Циркониевые или Титановые импланты: Сравнение материалов',
      'Имплантация при полном отсутствии зубов: Современные протоколы'
    ] 
  }
];

function getRandomName() {
  const first = ['Александр', 'Мария', 'Дмитрий', 'Елена', 'Сергей', 'Анна', 'Иван', 'Ольга', 'Максим', 'Татьяна'];
  const last = ['Смирнов(а)', 'Иванов(а)', 'Петров(а)', 'Соколов(а)', 'Михайлов(а)', 'Новиков(а)', 'Федоров(а)', 'Морозов(а)', 'Волков(а)', 'Алексеев(а)'];
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
}

function getRandomStatus(index: number, total: number) {
  // First 5 items are always 'ideation' (Idea Workshop)
  if (index < 5) return 'ideation';
  
  // Next 3 items are in production
  if (index < 8) return 'voice_ready';
  
  // Last 2 items are ready for review
  return 'ready_to_send';
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

  let user;
  try {
    // Get current user for author_id
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    user = data.user;
  } catch (e) {
    console.error('Auth check failed:', e);
    return { staffCount: 0, ordersCount: 0, error: 'Auth check failed: ' + (e as any).message };
  }

  console.log('Current User for Generation:', user?.id, user?.email);
  
  if (!user) {
    console.error('No authenticated user found. RLS may fail.');
    return { staffCount: 0, ordersCount: 0, error: 'User not authenticated' };
  }

  console.log('Generating data for project:', projectId);

  // 0. Fetch Project Details to get Organization ID (needed for membership)
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, organization_id')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Error fetching project details:', projectError);
    // If we can't find the project, we can't add membership correctly
  }

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
    
    const memberPayload: any = {
        project_id: projectId,
        user_id: user.id,
        role: 'owner' // or 'admin'
    };
    
    if (projectData?.organization_id) {
        memberPayload.organization_id = projectData.organization_id;
    }

    const { error: addMemberError } = await supabase
      .from('project_members')
      .insert(memberPayload);
      
    if (addMemberError) {
       console.error('Failed to add user to project_members:', addMemberError);
    } else {
       console.log('Successfully added user to project_members');
    }
  } else {
    console.log('User is already a member of the project');
  }

  // 1. Generate Staff (10-20 employees)
  const staffCount = Math.floor(Math.random() * 10) + 10; 
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

  // CLEAR OLD DATA FIRST to ensure clean slate
  console.log('Clearing old factory data...');
  const { error: deleteError } = await supabase
    .from('content_factory')
    .delete()
    .eq('project_id', projectId);
    
  if (deleteError) {
      console.error('Error clearing old data:', deleteError);
  } else {
      console.log('Old data cleared successfully.');
  }

  // 2. Generate Active Orders (Exactly 10 total: 5 ideas + 3 production + 2 shipping)
  const ordersCount = 10; 
  const orders = [];
  
  // Specific list of topics for the 5 ideas
  const ideaTopics = SCENARIOS[0].topics;

  for (let i = 0; i < ordersCount; i++) {
    const scenario = SCENARIOS[0];
    // Use specific topics for first 5, random for others
    const topic = i < 5 ? ideaTopics[i] : ideaTopics[Math.floor(Math.random() * ideaTopics.length)];
    const status = getRandomStatus(i, ordersCount);
    
    orders.push({
      project_id: projectId,
      title: `${topic}`,
      platform_type: 'dental_video',
      status: status,
      body_text: JSON.stringify({ 
        main_idea: `Создать профессиональный образовательный контент на тему: ${topic}. Целевая аудитория: пациенты, рассматривающие имплантацию. Тон: Доверительный, Экспертный, Успокаивающий.`, 
        target_audience: 'Пациенты 30-65 лет',
        tone: 'Expert' 
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
             main_idea: `Создать профессиональный образовательный контент на тему: ${topic}. Целевая аудитория: пациенты, рассматривающие имплантацию. Тон: Доверительный, Экспертный, Успокаивающий.`, 
             target_audience: 'Пациенты 30-65 лет',
             tone: 'Expert' 
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

  // 3. Generate Competitors (Mock Data - Dental Focused)
  const COMPETITORS = [
    { handle: 'dr.smile.kz', platform: 'instagram', followers: 15400, engagement: 5.2, posts: 420 },
    { handle: 'dental_implants_expert', platform: 'instagram', followers: 8900, engagement: 3.8, posts: 150 },
    { handle: 'stomatology.almaty', platform: 'instagram', followers: 45000, engagement: 2.1, posts: 1200 },
    { handle: 'smile_design_lab', platform: 'instagram', followers: 21000, engagement: 6.5, posts: 340 },
    { handle: 'healthy.teeth.pro', platform: 'instagram', followers: 5500, engagement: 4.7, posts: 85 }
  ];

  const competitors = COMPETITORS.map(c => ({
    project_id: projectId,
    handle: c.handle,
    platform: c.platform,
    avatar_url: `https://ui-avatars.com/api/?name=${c.handle}&background=random`,
    followers_count: c.followers,
    engagement_rate: c.engagement,
    posts_count: c.posts,
    stories_count: Math.floor(Math.random() * 10),
    last_post_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    status: 'active',
    created_at: new Date().toISOString()
  }));

  // Upsert based on handle to avoid duplicates
  const { error: compError } = await supabase
    .from('competitor_monitoring')
    .upsert(competitors, { onConflict: 'handle, project_id' });

  if (compError) {
      console.error('Error generating competitors:', compError);
  } else {
      console.log(`Generated ${competitors.length} competitors.`);
  }

  return { staffCount, ordersCount, competitorsCount: competitors.length };
};
