create table if not exists ai_commands (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null, -- Assuming projects table might be in public or referenced differently, keep it simple or verify FK if possible. 
  -- Safest is just UUID. If projects table is known, references projects(id) is better.
  -- Based on existing code, project_id is widely used.
  user_id uuid references auth.users(id) on delete set null,
  command text not null,
  payload jsonb,
  status text default 'pending',
  result jsonb,
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table ai_commands enable row level security;

create policy "Users can view commands for their project"
  on ai_commands for select
  using (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );

create policy "Users can insert commands for their project"
  on ai_commands for insert
  with check (
    project_id in (
      select project_id from project_members where user_id = auth.uid()
    )
  );
