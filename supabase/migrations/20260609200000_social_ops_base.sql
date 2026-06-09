create table public.social_pillars (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  pillar_id uuid references public.social_pillars(id) on delete set null,
  title text not null,
  channel text not null,
  format text not null,
  scheduled_date date not null,
  status text not null default 'draft',
  approval_status text not null default 'not_submitted',
  copy text,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_post_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  post_id uuid not null references public.social_posts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.social_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  post_id uuid references public.social_posts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  action_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index social_pillars_org_idx on public.social_pillars (organization_id);
create index social_posts_org_idx on public.social_posts (organization_id);
create index social_posts_client_idx on public.social_posts (client_id);
create index social_posts_date_idx on public.social_posts (scheduled_date);
create index social_posts_status_idx on public.social_posts (status);
create index social_posts_approval_status_idx on public.social_posts (approval_status);
create index social_post_approvals_post_idx on public.social_post_approvals (post_id);
create index social_audit_events_post_idx on public.social_audit_events (post_id);

create trigger social_pillars_updated_at
before update on public.social_pillars
for each row execute function public.touch_updated_at();

create trigger social_posts_updated_at
before update on public.social_posts
for each row execute function public.touch_updated_at();

alter table public.social_pillars enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_approvals enable row level security;
alter table public.social_audit_events enable row level security;
