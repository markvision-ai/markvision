-- Генерация видео через kie.ai: учёт задач и постоянное хранилище результатов.
-- kie.ai удаляет сгенерированные файлы через 14 дней, поэтому готовый ролик
-- перекладывается в бакет generated-videos, а в задаче остаётся обе ссылки:
-- временная source_url от kie.ai и постоянная stored_url.

create table if not exists kie_video_tasks (
  id uuid primary key default gen_random_uuid(),
  task_id text not null unique,
  project_id text,
  content_factory_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  model text not null,
  prompt text,
  input jsonb not null default '{}'::jsonb,
  state text not null default 'pending'
    check (state in ('pending', 'running', 'success', 'failed')),
  source_url text,
  stored_url text,
  error text,
  auto_publish boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kie_video_tasks_state_idx on kie_video_tasks (state);
create index if not exists kie_video_tasks_project_idx on kie_video_tasks (project_id);
create index if not exists kie_video_tasks_created_idx on kie_video_tasks (created_at desc);

-- Незавершённые задачи, которые пора опросить: колбэк мог не дойти.
create index if not exists kie_video_tasks_pending_idx
  on kie_video_tasks (updated_at)
  where state in ('pending', 'running');

create or replace function set_kie_video_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kie_video_tasks_updated_at on kie_video_tasks;
create trigger kie_video_tasks_updated_at
  before update on kie_video_tasks
  for each row execute function set_kie_video_tasks_updated_at();

alter table kie_video_tasks enable row level security;

do $$
begin
  drop policy if exists "Service role full access" on kie_video_tasks;
  drop policy if exists "Users read own tasks" on kie_video_tasks;
  drop policy if exists "Users insert own tasks" on kie_video_tasks;
end $$;

-- Пишут только edge-функции (service role); пользователь видит свои задачи.
create policy "Service role full access" on kie_video_tasks
  for all to service_role using (true) with check (true);

create policy "Users read own tasks" on kie_video_tasks
  for select to authenticated using (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table kie_video_tasks;
exception when duplicate_object then
  null;
end $$;

-- Постоянное хранилище готовых роликов.
insert into storage.buckets (id, name, public)
values ('generated-videos', 'generated-videos', true)
on conflict (id) do nothing;

do $$
begin
  drop policy if exists "Public read generated videos" on storage.objects;
  drop policy if exists "Service role writes generated videos" on storage.objects;
end $$;

create policy "Public read generated videos"
  on storage.objects for select
  to public
  using (bucket_id = 'generated-videos');

-- Заливает только edge-функция, у браузера прав на запись нет.
create policy "Service role writes generated videos"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'generated-videos');
