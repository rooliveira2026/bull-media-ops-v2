create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_membership_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.memberships
  where profile_id = auth.uid()
    and status = 'active';
$$;

create or replace function public.current_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.memberships
  where profile_id = auth.uid()
    and status = 'active';
$$;

create or replace function public.current_client_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select ca.client_id
  from public.client_access ca
  join public.memberships m on m.id = ca.membership_id
  where m.profile_id = auth.uid()
    and m.status = 'active';
$$;

create or replace function public.has_app_role(role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.roles r on r.id = mr.role_id
    where m.profile_id = auth.uid()
      and m.status = 'active'
      and r.key = role_key
  );
$$;

create or replace function public.has_any_app_role(role_keys text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.roles r on r.id = mr.role_id
    where m.profile_id = auth.uid()
      and m.status = 'active'
      and r.key = any(role_keys)
  );
$$;

create or replace function public.can_access_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_app_role('admin')
    or exists (
      select 1
      from public.client_access ca
      join public.memberships m on m.id = ca.membership_id
      where m.profile_id = auth.uid()
        and m.status = 'active'
        and ca.client_id = target_client_id
    );
$$;

create or replace function public.can_access_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_app_role('admin')
    or exists (
      select 1
      from public.memberships m
      where m.profile_id = auth.uid()
        and m.status = 'active'
        and m.organization_id = target_organization_id
    );
$$;

create or replace function public.bootstrap_staging_admin(admin_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile_id uuid;
  target_org_id uuid;
  target_membership_id uuid;
  admin_role_id uuid;
begin
  select id into target_profile_id
  from public.profiles
  where lower(email) = lower(admin_email)
  limit 1;

  if target_profile_id is null then
    raise exception 'Profile not found for email %. Create the auth user first.', admin_email;
  end if;

  insert into public.organizations (name, slug, status)
  values ('Bull Digital', 'bull-digital', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    status = excluded.status,
    updated_at = now()
  returning id into target_org_id;

  select id into admin_role_id
  from public.roles
  where key = 'admin'
  limit 1;

  insert into public.memberships (organization_id, profile_id, status)
  values (target_org_id, target_profile_id, 'active')
  on conflict (organization_id, profile_id) do update set
    status = 'active',
    updated_at = now()
  returning id into target_membership_id;

  insert into public.membership_roles (membership_id, role_id)
  values (target_membership_id, admin_role_id)
  on conflict do nothing;

  insert into public.client_access (membership_id, client_id, access_level)
  select target_membership_id, c.id, 'manage'
  from public.clients c
  where c.organization_id = target_org_id
  on conflict (membership_id, client_id) do update set
    access_level = excluded.access_level;
end;
$$;

revoke execute on function public.bootstrap_staging_admin(text) from anon, authenticated;

drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid());
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.has_app_role('admin'));
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists organizations_select_member on public.organizations;
drop policy if exists organizations_manage_admin on public.organizations;
create policy organizations_select_member on public.organizations
  for select to authenticated
  using (id in (select public.current_organization_ids()));
create policy organizations_manage_admin on public.organizations
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists memberships_select_member_org on public.memberships;
drop policy if exists memberships_manage_admin on public.memberships;
create policy memberships_select_member_org on public.memberships
  for select to authenticated
  using (organization_id in (select public.current_organization_ids()));
create policy memberships_manage_admin on public.memberships
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists membership_roles_select_member_org on public.membership_roles;
drop policy if exists membership_roles_manage_admin on public.membership_roles;
create policy membership_roles_select_member_org on public.membership_roles
  for select to authenticated
  using (
    membership_id in (
      select m.id
      from public.memberships m
      where m.organization_id in (select public.current_organization_ids())
    )
  );
create policy membership_roles_manage_admin on public.membership_roles
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists client_access_select_member_org on public.client_access;
drop policy if exists client_access_manage_admin on public.client_access;
create policy client_access_select_member_org on public.client_access
  for select to authenticated
  using (
    membership_id in (
      select m.id
      from public.memberships m
      where m.organization_id in (select public.current_organization_ids())
    )
  );
create policy client_access_manage_admin on public.client_access
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists clients_select_by_access on public.clients;
drop policy if exists clients_manage_admin on public.clients;
create policy clients_select_by_access on public.clients
  for select to authenticated
  using (public.can_access_client(id));
create policy clients_manage_admin on public.clients
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists roles_select_authenticated on public.roles;
drop policy if exists roles_manage_admin on public.roles;
create policy roles_select_authenticated on public.roles
  for select to authenticated
  using (auth.uid() is not null);
create policy roles_manage_admin on public.roles
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists modules_select_authenticated on public.modules;
drop policy if exists modules_manage_admin on public.modules;
create policy modules_select_authenticated on public.modules
  for select to authenticated
  using (auth.uid() is not null);
create policy modules_manage_admin on public.modules
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists module_access_select_authenticated on public.module_access;
drop policy if exists module_access_manage_admin on public.module_access;
create policy module_access_select_authenticated on public.module_access
  for select to authenticated
  using (auth.uid() is not null);
create policy module_access_manage_admin on public.module_access
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists data_sources_select_authenticated on public.data_sources;
drop policy if exists data_sources_manage_admin on public.data_sources;
create policy data_sources_select_authenticated on public.data_sources
  for select to authenticated
  using (auth.uid() is not null);
create policy data_sources_manage_admin on public.data_sources
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists integration_connections_select_org on public.integration_connections;
drop policy if exists integration_connections_manage_admin on public.integration_connections;
create policy integration_connections_select_org on public.integration_connections
  for select to authenticated
  using (public.can_access_organization(organization_id));
create policy integration_connections_manage_admin on public.integration_connections
  for all to authenticated
  using (public.has_app_role('admin'))
  with check (public.has_app_role('admin'));

drop policy if exists recommended_actions_select_client_access on public.recommended_actions;
drop policy if exists recommended_actions_update_operator on public.recommended_actions;
drop policy if exists recommended_actions_insert_operator on public.recommended_actions;
create policy recommended_actions_select_client_access on public.recommended_actions
  for select to authenticated
  using (public.can_access_client(client_id));
create policy recommended_actions_update_operator on public.recommended_actions
  for update to authenticated
  using (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));
create policy recommended_actions_insert_operator on public.recommended_actions
  for insert to authenticated
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists action_executions_select_client_access on public.action_executions;
drop policy if exists action_executions_insert_operator on public.action_executions;
create policy action_executions_select_client_access on public.action_executions
  for select to authenticated
  using (public.can_access_client(client_id));
create policy action_executions_insert_operator on public.action_executions
  for insert to authenticated
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists social_pillars_select_org on public.social_pillars;
drop policy if exists social_pillars_manage_operator on public.social_pillars;
create policy social_pillars_select_org on public.social_pillars
  for select to authenticated
  using (public.can_access_organization(organization_id));
create policy social_pillars_manage_operator on public.social_pillars
  for all to authenticated
  using (public.can_access_organization(organization_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_organization(organization_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists social_posts_select_client_access on public.social_posts;
drop policy if exists social_posts_insert_operator on public.social_posts;
drop policy if exists social_posts_update_operator on public.social_posts;
create policy social_posts_select_client_access on public.social_posts
  for select to authenticated
  using (public.can_access_client(client_id));
create policy social_posts_insert_operator on public.social_posts
  for insert to authenticated
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));
create policy social_posts_update_operator on public.social_posts
  for update to authenticated
  using (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check (public.can_access_client(client_id) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists social_post_approvals_select_client_access on public.social_post_approvals;
drop policy if exists social_post_approvals_insert_approver on public.social_post_approvals;
create policy social_post_approvals_select_client_access on public.social_post_approvals
  for select to authenticated
  using (
    exists (
      select 1
      from public.social_posts sp
      where sp.id = post_id
        and public.can_access_client(sp.client_id)
    )
  );
create policy social_post_approvals_insert_approver on public.social_post_approvals
  for insert to authenticated
  with check (
    public.has_any_app_role(array['admin', 'gestor'])
    and exists (
      select 1
      from public.social_posts sp
      where sp.id = post_id
        and public.can_access_client(sp.client_id)
    )
  );

drop policy if exists social_calendar_items_select_client_access on public.social_calendar_items;
drop policy if exists social_calendar_items_manage_operator on public.social_calendar_items;
create policy social_calendar_items_select_client_access on public.social_calendar_items
  for select to authenticated
  using (client_id is null or public.can_access_client(client_id));
create policy social_calendar_items_manage_operator on public.social_calendar_items
  for all to authenticated
  using ((client_id is null or public.can_access_client(client_id)) and public.has_any_app_role(array['admin', 'gestor', 'analista']))
  with check ((client_id is null or public.can_access_client(client_id)) and public.has_any_app_role(array['admin', 'gestor', 'analista']));

drop policy if exists audit_logs_select_client_access on public.audit_logs;
drop policy if exists audit_logs_insert_authenticated on public.audit_logs;
create policy audit_logs_select_client_access on public.audit_logs
  for select to authenticated
  using (client_id is null or public.can_access_client(client_id));
create policy audit_logs_insert_authenticated on public.audit_logs
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.can_access_organization(organization_id)
    and (client_id is null or public.can_access_client(client_id))
  );

drop policy if exists social_audit_events_select_client_access on public.social_audit_events;
drop policy if exists social_audit_events_insert_authenticated on public.social_audit_events;
create policy social_audit_events_select_client_access on public.social_audit_events
  for select to authenticated
  using (client_id is null or public.can_access_client(client_id));
create policy social_audit_events_insert_authenticated on public.social_audit_events
  for insert to authenticated
  with check (
    profile_id = auth.uid()
    and public.can_access_organization(organization_id)
    and (client_id is null or public.can_access_client(client_id))
  );
