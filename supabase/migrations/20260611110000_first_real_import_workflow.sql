alter table public.recommended_actions
  add column if not exists action_group_id text,
  add column if not exists parent_action_id uuid references public.recommended_actions(id) on delete set null,
  add column if not exists affected_items_count integer not null default 1,
  add column if not exists grouped_occurrences jsonb not null default '[]'::jsonb,
  add column if not exists effort_level text,
  add column if not exists decision_owner text,
  add column if not exists recommendation_type text,
  add column if not exists specialist_note text,
  add column if not exists final_decision text;

create unique index if not exists recommended_actions_action_group_idx
on public.recommended_actions (organization_id, action_group_id)
where action_group_id is not null;

create unique index if not exists import_batches_checksum_idx
on public.import_batches (organization_id, source_type, checksum)
where checksum is not null;

create unique index if not exists media_metrics_daily_import_identity_idx
on public.media_metrics_daily (
  organization_id,
  client_id,
  date,
  source_platform,
  channel,
  campaign_name
);

create table if not exists public.client_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  channel text not null,
  source_type text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id, channel)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  source_id uuid references public.data_sources(id) on delete set null,
  period_key text not null,
  report_type text not null,
  status text not null default 'draft',
  narrative text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id, period_key, report_type)
);

create table if not exists public.pdm_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  source_id uuid references public.data_sources(id) on delete set null,
  period_key text not null,
  cycle_objective text,
  channels text[] not null default array[]::text[],
  planned_action text,
  hypothesis text,
  expected_impact text,
  suggested_investment numeric,
  expected_benefit text,
  status text not null default 'specialist_review',
  specialist_note text,
  final_decision text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id, period_key, planned_action)
);

create table if not exists public.client_intelligence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  source_id uuid references public.data_sources(id) on delete set null,
  insight_type text not null default 'learning',
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists client_channels_client_idx on public.client_channels (client_id);
create index if not exists reports_client_period_idx on public.reports (client_id, period_key);
create index if not exists pdm_plans_client_period_idx on public.pdm_plans (client_id, period_key);
create index if not exists client_intelligence_client_idx on public.client_intelligence (client_id);

drop trigger if exists client_channels_updated_at on public.client_channels;
create trigger client_channels_updated_at
before update on public.client_channels
for each row execute function public.touch_updated_at();

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
before update on public.reports
for each row execute function public.touch_updated_at();

drop trigger if exists pdm_plans_updated_at on public.pdm_plans;
create trigger pdm_plans_updated_at
before update on public.pdm_plans
for each row execute function public.touch_updated_at();

alter table public.client_channels enable row level security;
alter table public.reports enable row level security;
alter table public.pdm_plans enable row level security;
alter table public.client_intelligence enable row level security;

drop policy if exists client_channels_select_client_access on public.client_channels;
drop policy if exists client_channels_manage_operator on public.client_channels;
create policy client_channels_select_client_access on public.client_channels
  for select to authenticated
  using (public.can_access_client(client_id));
create policy client_channels_manage_operator on public.client_channels
  for all to authenticated
  using (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists reports_select_client_access on public.reports;
drop policy if exists reports_manage_operator on public.reports;
create policy reports_select_client_access on public.reports
  for select to authenticated
  using (public.can_access_client(client_id));
create policy reports_manage_operator on public.reports
  for all to authenticated
  using (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists pdm_plans_select_client_access on public.pdm_plans;
drop policy if exists pdm_plans_manage_operator on public.pdm_plans;
create policy pdm_plans_select_client_access on public.pdm_plans
  for select to authenticated
  using (public.can_access_client(client_id));
create policy pdm_plans_manage_operator on public.pdm_plans
  for all to authenticated
  using (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists client_intelligence_select_client_access on public.client_intelligence;
drop policy if exists client_intelligence_manage_operator on public.client_intelligence;
create policy client_intelligence_select_client_access on public.client_intelligence
  for select to authenticated
  using (public.can_access_client(client_id));
create policy client_intelligence_manage_operator on public.client_intelligence
  for all to authenticated
  using (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));
