alter table public.leads
add column if not exists fb_ad_account_id text;

comment on column public.leads.fb_ad_account_id is 'ID рекламного кабинета Meta (act_xxx), если известен';

create index if not exists idx_leads_fb_ad_account_id on public.leads (fb_ad_account_id);

create or replace view public.connected_ad_accounts as
select
  id,
  project_id,
  ad_account_id as fb_ad_account_id,
  coalesce(selected_ad_account_name, ad_account_name) as account_name,
  access_token,
  (status = 'active') as status
from public.ad_accounts;
