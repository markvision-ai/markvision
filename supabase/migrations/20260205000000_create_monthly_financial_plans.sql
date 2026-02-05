
create table if not exists public.monthly_financial_plans (
    id uuid default gen_random_uuid() primary key,
    project_id uuid not null references public.projects(id) on delete cascade,
    month_date date not null, -- First day of the month (YYYY-MM-01)
    revenue_goal numeric not null default 0,
    avg_check numeric not null default 0,
    cr_lead_visit numeric not null default 0,
    cr_visit_sale numeric not null default 0,
    cpl_best numeric not null default 0,
    cpl_avg numeric not null default 0,
    cpl_worst numeric not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(project_id, month_date)
);

alter table public.monthly_financial_plans enable row level security;

create policy "Users can view monthly_financial_plans for their project"
    on public.monthly_financial_plans for select
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

create policy "Users can insert/update monthly_financial_plans for their project"
    on public.monthly_financial_plans for all
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
