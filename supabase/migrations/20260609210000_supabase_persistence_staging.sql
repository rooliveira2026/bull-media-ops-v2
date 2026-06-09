alter table public.recommended_actions
  add column if not exists executed_by uuid references public.profiles(id) on delete set null,
  add column if not exists executed_at timestamptz,
  add column if not exists recheck_at timestamptz,
  add column if not exists impact_assessment text;

update public.modules
set status = 'active'
where key = 'social_ops';

create table if not exists public.social_calendar_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  post_id uuid references public.social_posts(id) on delete cascade,
  scheduled_date date not null,
  status text not null default 'scheduled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_calendar_items_org_idx on public.social_calendar_items (organization_id);
create index if not exists social_calendar_items_client_idx on public.social_calendar_items (client_id);
create index if not exists social_calendar_items_post_idx on public.social_calendar_items (post_id);
create index if not exists social_calendar_items_date_idx on public.social_calendar_items (scheduled_date);

drop trigger if exists social_calendar_items_updated_at on public.social_calendar_items;
create trigger social_calendar_items_updated_at
before update on public.social_calendar_items
for each row execute function public.touch_updated_at();

alter table public.social_calendar_items enable row level security;

create or replace view public.social_content_pillars as
select * from public.social_pillars;

create or replace view public.social_approvals as
select * from public.social_post_approvals;
