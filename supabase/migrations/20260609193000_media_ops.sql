create table public.media_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  external_campaign_id text,
  source_platform text not null,
  channel text not null,
  campaign_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.media_campaigns(id) on delete set null,
  date date not null,
  period_key text not null,
  source_platform text not null,
  channel text not null,
  campaign_name text,
  impressions numeric not null default 0,
  clicks numeric not null default 0,
  cost numeric not null default 0,
  conversions numeric not null default 0,
  conversion_value numeric not null default 0,
  revenue numeric not null default 0,
  cpc numeric not null default 0,
  cpa numeric not null default 0,
  ctr numeric not null default 0,
  roas numeric not null default 0,
  raw_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_import_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null,
  status text not null default 'pending',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_imported integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.recommended_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  module_key text not null default 'media_ops',
  source_platform text,
  channel text,
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'suggested',
  expected_impact text,
  confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.action_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action_id uuid not null references public.recommended_actions(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'executed',
  execution_note text,
  executed_at timestamptz not null default now(),
  recheck_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index media_campaigns_org_idx on public.media_campaigns (organization_id);
create index media_campaigns_client_idx on public.media_campaigns (client_id);
create index media_campaigns_channel_idx on public.media_campaigns (channel);
create index media_campaigns_status_idx on public.media_campaigns (status);

create index media_metrics_daily_org_idx on public.media_metrics_daily (organization_id);
create index media_metrics_daily_client_idx on public.media_metrics_daily (client_id);
create index media_metrics_daily_date_idx on public.media_metrics_daily (date);
create index media_metrics_daily_period_idx on public.media_metrics_daily (period_key);
create index media_metrics_daily_channel_idx on public.media_metrics_daily (channel);

create index media_import_runs_org_idx on public.media_import_runs (organization_id);
create index media_import_runs_status_idx on public.media_import_runs (status);

create index recommended_actions_org_idx on public.recommended_actions (organization_id);
create index recommended_actions_client_idx on public.recommended_actions (client_id);
create index recommended_actions_status_idx on public.recommended_actions (status);
create index recommended_actions_channel_idx on public.recommended_actions (channel);

create index action_executions_org_idx on public.action_executions (organization_id);
create index action_executions_client_idx on public.action_executions (client_id);
create index action_executions_action_idx on public.action_executions (action_id);
create index action_executions_status_idx on public.action_executions (status);

create trigger media_campaigns_updated_at
before update on public.media_campaigns
for each row execute function public.touch_updated_at();

create trigger media_metrics_daily_updated_at
before update on public.media_metrics_daily
for each row execute function public.touch_updated_at();

create trigger recommended_actions_updated_at
before update on public.recommended_actions
for each row execute function public.touch_updated_at();

alter table public.media_campaigns enable row level security;
alter table public.media_metrics_daily enable row level security;
alter table public.media_import_runs enable row level security;
alter table public.recommended_actions enable row level security;
alter table public.action_executions enable row level security;
