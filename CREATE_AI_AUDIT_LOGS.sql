-- Create ai_audit_logs table
create table if not exists public.ai_audit_logs (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    project_id uuid references public.projects(id) on delete cascade,
    action text not null,
    initiator text not null, -- 'system' | 'user' | 'ai'
    initiator_name text, -- 'Mark', 'Yuri', 'System'
    status_before jsonb,
    status_after jsonb,
    details text,
    result_status text default 'success', -- 'success' | 'warning' | 'error'
    metadata jsonb
);

-- Add RLS policies
alter table public.ai_audit_logs enable row level security;

create policy "Users can view audit logs for their projects"
    on public.ai_audit_logs for select
    using (
        project_id in (
            select project_id from public.project_members
            where user_id = auth.uid()
        )
    );

create policy "Service role and authenticated users can insert logs"
    on public.ai_audit_logs for insert
    with check (true);

-- Create index for faster queries
create index if not exists idx_ai_audit_logs_project_id on public.ai_audit_logs(project_id);
create index if not exists idx_ai_audit_logs_created_at on public.ai_audit_logs(created_at desc);

-- Grant permissions
grant select, insert on public.ai_audit_logs to authenticated;
grant select, insert on public.ai_audit_logs to service_role;
