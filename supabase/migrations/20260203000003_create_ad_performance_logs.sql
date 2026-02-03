drop table if exists public.ad_performance_logs;

create table public.ad_performance_logs (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.projects(id) on delete cascade,
    entity_id text not null,
    entity_name text,
    entity_type text, -- 'campaign', 'adset', 'ad', 'account'
    date_start date not null,
    date_stop date not null,
    spend numeric default 0,
    impressions bigint default 0,
    clicks bigint default 0,
    inline_link_clicks bigint default 0,
    leads bigint default 0,
    actions jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint ad_performance_logs_unique_entry unique (project_id, entity_id, date_start)
);

-- Add indexes for faster querying
create index idx_ad_performance_logs_project_date 
    on public.ad_performance_logs(project_id, date_start);
create index idx_ad_performance_logs_entity_date 
    on public.ad_performance_logs(entity_id, date_start);

-- Add RLS policies
alter table public.ad_performance_logs enable row level security;

create policy "Users can view ad logs for their projects"
    on public.ad_performance_logs for select
    using (
        project_id in (
            select project_id from public.project_members
            where user_id = auth.uid()
        )
    );

create policy "Users can insert ad logs for their projects"
    on public.ad_performance_logs for insert
    with check (
        project_id in (
            select project_id from public.project_members
            where user_id = auth.uid()
        )
    );
