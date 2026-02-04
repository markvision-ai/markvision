-- Create ai_bridge_tasks table
create table if not exists public.ai_bridge_tasks (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    project_id uuid references public.projects(id) on delete cascade not null,
    prompt text not null,
    status text default 'pending' not null,
    execution_logs jsonb default '[]'::jsonb,
    response jsonb,
    
    constraint status_check check (status in ('pending', 'processing', 'completed', 'error'))
);

-- Add RLS policies
alter table public.ai_bridge_tasks enable row level security;

create policy "Users can view tasks for their projects"
    on public.ai_bridge_tasks for select
    using (
        project_id in (
            select project_id from public.project_members
            where user_id = auth.uid()
        )
    );

create policy "Users can insert tasks for their projects"
    on public.ai_bridge_tasks for insert
    with check (
        project_id in (
            select project_id from public.project_members
            where user_id = auth.uid()
        )
    );

create policy "Users can update their tasks"
    on public.ai_bridge_tasks for update
    using (
        project_id in (
            select project_id from public.project_members
            where user_id = auth.uid()
        )
    );

-- Enable realtime for this table
alter publication supabase_realtime add table ai_bridge_tasks;

-- Create index for faster queries
create index if not exists idx_ai_bridge_tasks_project_id on public.ai_bridge_tasks(project_id);
create index if not exists idx_ai_bridge_tasks_created_at on public.ai_bridge_tasks(created_at desc);

-- Grant permissions
grant select, insert, update on public.ai_bridge_tasks to authenticated;
grant select, insert, update on public.ai_bridge_tasks to service_role;
