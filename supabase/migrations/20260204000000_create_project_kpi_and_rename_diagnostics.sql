-- Create project_kpi table
create table if not exists public.project_kpi (
    id uuid default gen_random_uuid() primary key,
    project_id uuid not null references public.projects(id) on delete cascade,
    revenue_goal numeric not null default 0,
    avg_check numeric not null default 0,
    conv_visit_sale numeric not null default 0,
    conv_lead_visit numeric not null default 0,
    cpl_forecast numeric not null default 0,
    fixed_costs numeric not null default 0,
    budget_needed numeric not null default 0,
    sales_plan numeric not null default 0,
    visits_plan numeric not null default 0,
    leads_plan numeric not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint project_kpi_project_id_key unique (project_id)
);

-- RLS for project_kpi
alter table public.project_kpi enable row level security;

create policy "Users can view project_kpi for their project"
    on public.project_kpi for select
    using (
        project_id in (
            select id from public.projects 
            where user_id = auth.uid()
        )
        or
        project_id in (
            select project_id from public.project_members 
            where user_id = auth.uid()
        )
    );

create policy "Users can insert/update project_kpi for their project"
    on public.project_kpi for all
    using (
        project_id in (
            select id from public.projects 
            where user_id = auth.uid()
        )
        or
        project_id in (
            select project_id from public.project_members 
            where user_id = auth.uid()
        )
    )
    with check (
        project_id in (
            select id from public.projects 
            where user_id = auth.uid()
        )
        or
        project_id in (
            select project_id from public.project_members 
            where user_id = auth.uid()
        )
    );

-- Rename diagnostic_results to visit_results if it exists
do $$
begin
    if exists (select from pg_tables where schemaname = 'public' and tablename = 'diagnostic_results') then
        alter table public.diagnostic_results rename to visit_results;
    end if;
end $$;

-- Rename diagnostic_type column to visit_type if it exists in visit_results
do $$
begin
    if exists (select from information_schema.columns where table_schema = 'public' and table_name = 'visit_results' and column_name = 'diagnostic_type') then
        alter table public.visit_results rename column diagnostic_type to visit_type;
    end if;
end $$;

-- Update leads status from diagnostics_completed to visit_completed
update public.leads 
set status = 'visit_completed' 
where status = 'diagnostics_completed';
