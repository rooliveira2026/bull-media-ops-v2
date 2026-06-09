alter table public.recommended_actions
  add column if not exists curation_note text,
  add column if not exists dismissed_reason text,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists campaign_name text,
  add column if not exists metric_impacted text,
  add column if not exists before_value numeric,
  add column if not exists after_value numeric,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.action_executions
  add column if not exists executed_by uuid references public.profiles(id) on delete set null,
  add column if not exists impact_assessment text;

create index if not exists recommended_actions_priority_idx on public.recommended_actions (priority);
create index if not exists recommended_actions_source_platform_idx on public.recommended_actions (source_platform);
create index if not exists action_executions_executed_at_idx on public.action_executions (executed_at desc);
