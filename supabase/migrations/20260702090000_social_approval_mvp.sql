create extension if not exists pgcrypto with schema extensions;

alter table public.social_posts
  add column if not exists asset_url text,
  add column if not exists version integer not null default 1,
  add column if not exists sent_for_approval_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by_name text,
  add column if not exists approved_by_email text;

create table if not exists public.social_approval_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'active',
  expires_at timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.social_approval_batch_posts (
  batch_id uuid not null references public.social_approval_batches(id) on delete cascade,
  post_id uuid not null references public.social_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (batch_id, post_id)
);

create table if not exists public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  post_id uuid not null references public.social_posts(id) on delete cascade,
  approval_batch_id uuid references public.social_approval_batches(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  author_name text,
  author_email text,
  visibility text not null default 'internal',
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.social_post_approvals
  add column if not exists approval_batch_id uuid references public.social_approval_batches(id) on delete set null,
  add column if not exists approver_name text,
  add column if not exists approver_email text,
  add column if not exists decision text,
  add column if not exists approved_version integer,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists social_approval_batches_client_idx on public.social_approval_batches (client_id);
create index if not exists social_approval_batches_expires_idx on public.social_approval_batches (expires_at);
create index if not exists social_approval_batches_status_idx on public.social_approval_batches (status);
create unique index if not exists social_approval_batches_token_hash_idx on public.social_approval_batches (token_hash);
create index if not exists social_approval_batch_posts_post_idx on public.social_approval_batch_posts (post_id);
create index if not exists social_post_comments_post_idx on public.social_post_comments (post_id);
create index if not exists social_post_comments_client_idx on public.social_post_comments (client_id);
create index if not exists social_post_comments_batch_idx on public.social_post_comments (approval_batch_id);

alter table public.social_approval_batches enable row level security;
alter table public.social_approval_batch_posts enable row level security;
alter table public.social_post_comments enable row level security;

create or replace function public.hash_social_approval_token(p_token text)
returns text
language sql
stable
set search_path = pg_catalog, public
as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

drop policy if exists social_approval_batches_select_client_access on public.social_approval_batches;
drop policy if exists social_approval_batches_insert_operator on public.social_approval_batches;
drop policy if exists social_approval_batches_update_operator on public.social_approval_batches;
create policy social_approval_batches_select_client_access on public.social_approval_batches
  for select to authenticated
  using (public.can_access_client(client_id));
create policy social_approval_batches_insert_operator on public.social_approval_batches
  for insert to authenticated
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));
create policy social_approval_batches_update_operator on public.social_approval_batches
  for update to authenticated
  using (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists social_approval_batch_posts_select_client_access on public.social_approval_batch_posts;
drop policy if exists social_approval_batch_posts_insert_operator on public.social_approval_batch_posts;
create policy social_approval_batch_posts_select_client_access on public.social_approval_batch_posts
  for select to authenticated
  using (
    exists (
      select 1
      from public.social_approval_batches sab
      where sab.id = batch_id
        and public.can_access_client(sab.client_id)
    )
  );
create policy social_approval_batch_posts_insert_operator on public.social_approval_batch_posts
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.social_approval_batches sab
      where sab.id = batch_id
        and public.can_access_client(sab.client_id)
        and public.has_any_app_role(array['admin', 'gestor', 'analista'])
    )
    and exists (
      select 1
      from public.social_posts sp
      where sp.id = post_id
        and sp.client_id = (
          select sab.client_id
          from public.social_approval_batches sab
          where sab.id = batch_id
        )
    )
  );

drop policy if exists social_post_comments_select_client_access on public.social_post_comments;
drop policy if exists social_post_comments_insert_operator on public.social_post_comments;
create policy social_post_comments_select_client_access on public.social_post_comments
  for select to authenticated
  using (public.can_access_client(client_id));
create policy social_post_comments_insert_operator on public.social_post_comments
  for insert to authenticated
  with check (
    public.can_access_client(client_id)
    and public.has_any_app_role(array['admin', 'gestor', 'analista'])
    and visibility = 'internal'
  );

drop policy if exists social_post_approvals_insert_approver on public.social_post_approvals;
create policy social_post_approvals_insert_approver on public.social_post_approvals
  for insert to authenticated
  with check (
    public.has_any_app_role(array['admin', 'gestor', 'analista'])
    and exists (
      select 1
      from public.social_posts sp
      where sp.id = post_id
        and public.can_access_client(sp.client_id)
    )
  );

create or replace function public.get_social_approval_batch(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_token_hash text := public.hash_social_approval_token(p_token);
  v_batch public.social_approval_batches%rowtype;
  v_posts jsonb := '[]'::jsonb;
  v_comments jsonb := '[]'::jsonb;
begin
  select *
  into v_batch
  from public.social_approval_batches
  where token_hash = v_token_hash
  limit 1;

  if not found then
    return jsonb_build_object('status', 'invalid', 'batch', null, 'posts', '[]'::jsonb, 'comments', '[]'::jsonb);
  end if;

  if v_batch.status = 'revoked' then
    return jsonb_build_object('status', 'revoked', 'batch', null, 'posts', '[]'::jsonb, 'comments', '[]'::jsonb);
  end if;

  if v_batch.status = 'used' then
    return jsonb_build_object('status', 'used', 'batch', null, 'posts', '[]'::jsonb, 'comments', '[]'::jsonb);
  end if;

  if v_batch.expires_at <= now() then
    return jsonb_build_object('status', 'expired', 'batch', jsonb_build_object('expires_at', v_batch.expires_at), 'posts', '[]'::jsonb, 'comments', '[]'::jsonb);
  end if;

  if v_batch.status <> 'active' then
    return jsonb_build_object('status', 'unavailable', 'batch', null, 'posts', '[]'::jsonb, 'comments', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'post_id', sp.id,
      'client_name', c.name,
      'title', sp.title,
      'channel', sp.channel,
      'format', sp.format,
      'scheduled_date', sp.scheduled_date,
      'status', sp.status,
      'approval_status', sp.approval_status,
      'copy', sp.copy,
      'asset_url', sp.asset_url,
      'version', sp.version
    )
    order by sp.scheduled_date, sp.title
  ), '[]'::jsonb)
  into v_posts
  from public.social_approval_batch_posts sabp
  join public.social_posts sp on sp.id = sabp.post_id
  join public.clients c on c.id = sp.client_id
  where sabp.batch_id = v_batch.id
    and sp.client_id = v_batch.client_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'post_id', spc.post_id,
      'author_name', spc.author_name,
      'body', spc.body,
      'created_at', spc.created_at
    )
    order by spc.created_at
  ), '[]'::jsonb)
  into v_comments
  from public.social_post_comments spc
  where spc.approval_batch_id = v_batch.id
    and spc.visibility = 'external';

  return jsonb_build_object(
    'status', v_batch.status,
    'batch',
      jsonb_build_object(
        'expires_at', v_batch.expires_at,
        'created_at', v_batch.created_at
      ),
    'posts', v_posts,
    'comments', v_comments
  );
end;
$$;

create or replace function public.submit_social_approval_decision(
  p_token text,
  p_post_id uuid,
  p_decision text,
  p_author_name text,
  p_author_email text,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_token_hash text := public.hash_social_approval_token(p_token);
  v_batch public.social_approval_batches%rowtype;
  v_post public.social_posts%rowtype;
  v_next_status text;
  v_next_approval_status text;
  v_remaining integer;
begin
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'Decisão de aprovação inválida.';
  end if;

  select *
  into v_batch
  from public.social_approval_batches
  where token_hash = v_token_hash
  limit 1;

  if not found then
    raise exception 'Solicitação de aprovação inválida.';
  end if;

  if v_batch.status <> 'active' then
    raise exception 'Solicitação de aprovação não está ativa.';
  end if;

  if v_batch.expires_at <= now() then
    update public.social_approval_batches
    set status = 'expired'
    where id = v_batch.id;
    raise exception 'Solicitação de aprovação expirada.';
  end if;

  select sp.*
  into v_post
  from public.social_approval_batch_posts sabp
  join public.social_posts sp on sp.id = sabp.post_id
  where sabp.batch_id = v_batch.id
    and sp.id = p_post_id
    and sp.client_id = v_batch.client_id
  limit 1;

  if not found then
    raise exception 'Post não pertence a esta solicitação de aprovação.';
  end if;

  if v_post.status in ('approved', 'changes_requested', 'scheduled', 'published', 'cancelled') then
    raise exception 'Este post já possui decisão registrada ou está encerrado.';
  end if;

  v_next_status := case when p_decision = 'approved' then 'approved' else 'changes_requested' end;
  v_next_approval_status := case when p_decision = 'approved' then 'approved' else 'adjustments_requested' end;

  update public.social_posts
  set status = v_next_status,
      approval_status = v_next_approval_status,
      approved_at = case when p_decision = 'approved' then now() else approved_at end,
      approved_by_name = case when p_decision = 'approved' then nullif(trim(p_author_name), '') else approved_by_name end,
      approved_by_email = case when p_decision = 'approved' then nullif(trim(p_author_email), '') else approved_by_email end
  where id = v_post.id;

  insert into public.social_post_comments (
    organization_id,
    client_id,
    post_id,
    approval_batch_id,
    author_name,
    author_email,
    visibility,
    body
  )
  values (
    v_post.organization_id,
    v_post.client_id,
    v_post.id,
    v_batch.id,
    nullif(trim(p_author_name), ''),
    nullif(trim(p_author_email), ''),
    'external',
    coalesce(nullif(trim(p_note), ''), case when p_decision = 'approved' then 'Aprovado pelo cliente.' else 'Ajustes solicitados pelo cliente.' end)
  );

  insert into public.social_post_approvals (
    organization_id,
    post_id,
    status,
    note,
    approval_batch_id,
    approver_name,
    approver_email,
    decision,
    approved_version,
    metadata
  )
  values (
    v_post.organization_id,
    v_post.id,
    v_next_approval_status,
    nullif(trim(p_note), ''),
    v_batch.id,
    nullif(trim(p_author_name), ''),
    nullif(trim(p_author_email), ''),
    p_decision,
    v_post.version,
    jsonb_build_object(
      'source', 'external_approval_link',
      'identity_assertion', 'declared_by_external_approver'
    )
  );

  insert into public.social_audit_events (
    organization_id,
    client_id,
    post_id,
    action_key,
    metadata
  )
  values (
    v_post.organization_id,
    v_post.client_id,
    v_post.id,
    case when p_decision = 'approved' then 'client_approved_social_post' else 'client_requested_social_adjustments' end,
    jsonb_build_object(
      'approval_batch_id', v_batch.id,
      'decision', p_decision,
      'approver_name', nullif(trim(p_author_name), ''),
      'approver_email', nullif(trim(p_author_email), ''),
      'identity_assertion', 'declared_by_external_approver',
      'post_version', v_post.version,
      'note', nullif(trim(p_note), '')
    )
  );

  select count(*)
  into v_remaining
  from public.social_approval_batch_posts sabp
  join public.social_posts sp on sp.id = sabp.post_id
  where sabp.batch_id = v_batch.id
    and sp.status not in ('approved', 'changes_requested', 'scheduled', 'published', 'cancelled');

  if v_remaining = 0 then
    update public.social_approval_batches
    set status = 'used',
        used_at = now()
    where id = v_batch.id;
  end if;

  return public.get_social_approval_batch(p_token);
end;
$$;

revoke all on function public.hash_social_approval_token(text) from public;
revoke all on function public.hash_social_approval_token(text) from anon;
revoke all on function public.hash_social_approval_token(text) from authenticated;
revoke all on function public.get_social_approval_batch(text) from public;
revoke all on function public.get_social_approval_batch(text) from anon;
revoke all on function public.get_social_approval_batch(text) from authenticated;
revoke all on function public.submit_social_approval_decision(text, uuid, text, text, text, text) from public;
revoke all on function public.submit_social_approval_decision(text, uuid, text, text, text, text) from anon;
revoke all on function public.submit_social_approval_decision(text, uuid, text, text, text, text) from authenticated;

grant execute on function public.get_social_approval_batch(text) to anon, authenticated;
grant execute on function public.submit_social_approval_decision(text, uuid, text, text, text, text) to anon, authenticated;
