alter table public.data_sources
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists source_type text,
  add column if not exists source_name text,
  add column if not exists account_id text,
  add column if not exists account_name text,
  add column if not exists currency text,
  add column if not exists timezone text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.data_sources
set
  source_type = coalesce(
    source_type,
    case key
      when 'google_ads' then 'google_ads_api'
      when 'meta_ads' then 'meta_ads_api'
      when 'ga4' then 'ga4_api'
      when 'linkedin_ads' then 'linkedin_ads_api'
      when 'clickup' then 'clickup_api'
      when 'google_sheets' then 'legacy_v1_export'
      else 'manual_input'
    end
  ),
  source_name = coalesce(source_name, name),
  status = case
    when status = 'planned' then 'prepared'
    when status = 'active' then 'connected'
    when status = 'inactive' then 'not_connected'
    else status
  end
where source_type is null
   or source_name is null
   or status in ('planned', 'active', 'inactive');

drop trigger if exists data_sources_updated_at on public.data_sources;
create trigger data_sources_updated_at
before update on public.data_sources
for each row execute function public.touch_updated_at();

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_id uuid references public.data_sources(id) on delete set null,
  source_type text not null,
  status text not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  records_received integer not null default 0,
  records_imported integer not null default 0,
  records_skipped integer not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  checksum text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.data_quality_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  source_id uuid references public.data_sources(id) on delete set null,
  severity text not null default 'info',
  entity_type text,
  entity_id text,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists data_sources_org_idx on public.data_sources (organization_id);
create index if not exists data_sources_client_idx on public.data_sources (client_id);
create index if not exists data_sources_source_type_idx on public.data_sources (source_type);
create index if not exists data_sources_status_idx on public.data_sources (status);
create index if not exists import_batches_org_idx on public.import_batches (organization_id);
create index if not exists import_batches_source_idx on public.import_batches (source_id);
create index if not exists import_batches_status_idx on public.import_batches (status);
create index if not exists data_quality_logs_org_idx on public.data_quality_logs (organization_id);
create index if not exists data_quality_logs_source_idx on public.data_quality_logs (source_id);
create index if not exists data_quality_logs_client_idx on public.data_quality_logs (client_id);
create index if not exists data_quality_logs_severity_idx on public.data_quality_logs (severity);

alter table public.import_batches enable row level security;
alter table public.data_quality_logs enable row level security;

drop policy if exists data_sources_select_member_org on public.data_sources;
drop policy if exists data_sources_manage_operator on public.data_sources;
drop policy if exists data_sources_select_authenticated on public.data_sources;
drop policy if exists data_sources_manage_admin on public.data_sources;
create policy data_sources_select_member_org on public.data_sources
  for select to authenticated
  using (
    auth.uid() is not null
    and (
      organization_id is null
      or public.can_access_organization(organization_id)
    )
  );
create policy data_sources_manage_operator on public.data_sources
  for all to authenticated
  using (
    public.has_any_app_role(array['admin', 'gestor', 'analista'])
    and (
      organization_id is null
      or public.can_access_organization(organization_id)
    )
  )
  with check (
    public.has_any_app_role(array['admin', 'gestor', 'analista'])
    and (
      organization_id is null
      or public.can_access_organization(organization_id)
    )
  );

drop policy if exists import_batches_select_member_org on public.import_batches;
drop policy if exists import_batches_insert_operator on public.import_batches;
create policy import_batches_select_member_org on public.import_batches
  for select to authenticated
  using (public.can_access_organization(organization_id));
create policy import_batches_insert_operator on public.import_batches
  for insert to authenticated
  with check (
    public.can_access_organization(organization_id)
    and public.has_any_app_role(array['admin', 'gestor', 'analista'])
  );

drop policy if exists data_quality_logs_select_member_org on public.data_quality_logs;
drop policy if exists data_quality_logs_insert_operator on public.data_quality_logs;
create policy data_quality_logs_select_member_org on public.data_quality_logs
  for select to authenticated
  using (
    public.can_access_organization(organization_id)
    and (
      client_id is null
      or public.can_access_client(client_id)
    )
  );
create policy data_quality_logs_insert_operator on public.data_quality_logs
  for insert to authenticated
  with check (
    public.can_access_organization(organization_id)
    and public.has_any_app_role(array['admin', 'gestor', 'analista'])
    and (
      client_id is null
      or public.can_access_client(client_id)
    )
  );
