create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id text not null,
  name text not null,
  status text not null default 'active',
  primary_objective text,
  business_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, client_id)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text
);

create table public.membership_roles (
  membership_id uuid not null references public.memberships(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (membership_id, role_id)
);

create table public.client_access (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  access_level text not null default 'read',
  created_at timestamptz not null default now(),
  unique (membership_id, client_id)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  status text not null default 'active'
);

create table public.module_access (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  module_key text not null references public.modules(key) on delete cascade,
  action_key text not null,
  allowed boolean not null default true,
  unique (role_id, module_key, action_key)
);

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category text not null,
  status text not null default 'planned'
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  data_source_key text not null references public.data_sources(key),
  external_account_id text,
  status text not null default 'not_connected',
  last_sync_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  module_key text not null,
  action_key text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index clients_organization_id_idx on public.clients (organization_id);
create index memberships_profile_id_idx on public.memberships (profile_id);
create index client_access_membership_id_idx on public.client_access (membership_id);
create index module_access_role_id_idx on public.module_access (role_id);
create index integration_connections_org_idx on public.integration_connections (organization_id);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

create trigger organizations_updated_at
before update on public.organizations
for each row execute function public.touch_updated_at();

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger clients_updated_at
before update on public.clients
for each row execute function public.touch_updated_at();

create trigger memberships_updated_at
before update on public.memberships
for each row execute function public.touch_updated_at();

create trigger integration_connections_updated_at
before update on public.integration_connections
for each row execute function public.touch_updated_at();

insert into public.roles (key, name, description) values
  ('admin', 'Admin', 'Acesso total à plataforma e configurações.'),
  ('gestor', 'Gestor', 'Gestão operacional e aprovações por módulo.'),
  ('analista', 'Analista', 'Execução e análise operacional.'),
  ('visualizador', 'Visualizador', 'Leitura de dados e relatórios permitidos.')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description;

insert into public.modules (key, name, description, status) values
  ('core', 'Core Platform', 'Organizações, clientes, usuários, roles e permissões.', 'active'),
  ('media_ops', 'Media Ops', 'Performance, diagnósticos e ações de mídia.', 'active'),
  ('social_ops', 'Social Ops', 'Calendário, posts, aprovação e métricas sociais.', 'planned'),
  ('creative_ops', 'Creative Ops', 'Criativos, testes, backlog e aprendizados.', 'planned'),
  ('reports', 'Reports', 'Relatórios, revisão, aprovação e histórico.', 'planned'),
  ('pdm', 'PDM', 'Planejamento mensal, cenários e aprovações.', 'planned'),
  ('client_intelligence', 'Client Intelligence', 'Memória, briefings, insights e preparação.', 'planned'),
  ('integrations', 'Integrations', 'Conexões, pipelines, sincronizações e logs.', 'planned'),
  ('ai_agents', 'AI Agents', 'Agentes, execuções, artefatos e auditoria.', 'planned')
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status;

insert into public.data_sources (key, name, category, status) values
  ('google_ads', 'Google Ads', 'paid_media', 'planned'),
  ('ga4', 'Google Analytics 4', 'analytics', 'planned'),
  ('meta_ads', 'Meta Ads', 'paid_media', 'planned'),
  ('instagram', 'Instagram', 'social', 'planned'),
  ('facebook', 'Facebook', 'social', 'planned'),
  ('linkedin_ads', 'LinkedIn Ads', 'paid_media', 'planned'),
  ('tiktok', 'TikTok', 'social', 'planned'),
  ('clickup', 'ClickUp', 'operations', 'planned'),
  ('google_sheets', 'Google Sheets', 'temporary_import', 'planned')
on conflict (key) do update set
  name = excluded.name,
  category = excluded.category,
  status = excluded.status;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.memberships enable row level security;
alter table public.roles enable row level security;
alter table public.membership_roles enable row level security;
alter table public.client_access enable row level security;
alter table public.modules enable row level security;
alter table public.module_access enable row level security;
alter table public.data_sources enable row level security;
alter table public.integration_connections enable row level security;
alter table public.audit_logs enable row level security;
