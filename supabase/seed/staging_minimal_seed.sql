-- Bull Media Ops V2 - staging minimal seed
-- Safe to run more than once. It never deletes existing data.

begin;

insert into public.organizations (id, name, slug, status)
values ('11111111-1111-4111-8111-111111111111', 'Bull Digital', 'bull-digital', 'active')
on conflict (slug) do update set
  name = excluded.name,
  status = excluded.status,
  updated_at = now();

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
)
insert into public.clients (
  id,
  organization_id,
  client_id,
  name,
  status,
  primary_objective,
  business_model
)
select
  '22222222-2222-4222-8222-222222222222',
  org.id,
  'client_bull_digital',
  'Bull Digital',
  'active',
  'Validar a Bull Media Ops V2 com dados operacionais controlados.',
  'Marketing Operations'
from org
on conflict (organization_id, client_id) do update set
  name = excluded.name,
  status = excluded.status,
  primary_objective = excluded.primary_objective,
  business_model = excluded.business_model,
  updated_at = now();

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
),
client as (
  select c.id, c.organization_id
  from public.clients c
  join org on org.id = c.organization_id
  where c.client_id = 'client_bull_digital'
  limit 1
)
insert into public.client_channels (id, organization_id, client_id, channel, source_type, status, metadata)
select *
from (
  values
    (
      '33333333-3333-4333-8333-333333333331'::uuid,
      (select organization_id from client),
      (select id from client),
      'Google Ads',
      'google_ads_api',
      'active',
      '{"stage":"staging_seed","external_integration":"not_connected"}'::jsonb
    ),
    (
      '33333333-3333-4333-8333-333333333332'::uuid,
      (select organization_id from client),
      (select id from client),
      'Meta Ads',
      'meta_ads_api',
      'active',
      '{"stage":"staging_seed","external_integration":"not_connected"}'::jsonb
    ),
    (
      '33333333-3333-4333-8333-333333333333'::uuid,
      (select organization_id from client),
      (select id from client),
      'LinkedIn Ads',
      'linkedin_ads_api',
      'active',
      '{"stage":"staging_seed","external_integration":"not_connected"}'::jsonb
    )
) as seed(id, organization_id, client_id, channel, source_type, status, metadata)
where seed.organization_id is not null
on conflict (organization_id, client_id, channel) do update set
  source_type = excluded.source_type,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
),
client as (
  select c.id, c.organization_id
  from public.clients c
  join org on org.id = c.organization_id
  where c.client_id = 'client_bull_digital'
  limit 1
)
insert into public.media_campaigns (
  id,
  organization_id,
  client_id,
  external_campaign_id,
  source_platform,
  channel,
  campaign_name,
  status
)
select *
from (
  values
    (
      '44444444-4444-4444-8444-444444444441'::uuid,
      (select organization_id from client),
      (select id from client),
      'seed-google-brand',
      'google_ads',
      'Google Ads',
      'Brand Search - Staging',
      'active'
    ),
    (
      '44444444-4444-4444-8444-444444444442'::uuid,
      (select organization_id from client),
      (select id from client),
      'seed-meta-demand',
      'meta_ads',
      'Meta Ads',
      'Demand Gen - Staging',
      'active'
    ),
    (
      '44444444-4444-4444-8444-444444444443'::uuid,
      (select organization_id from client),
      (select id from client),
      'seed-linkedin-b2b',
      'linkedin_ads',
      'LinkedIn Ads',
      'B2B Leads - Staging',
      'active'
    )
) as seed(id, organization_id, client_id, external_campaign_id, source_platform, channel, campaign_name, status)
where seed.organization_id is not null
on conflict (id) do update set
  external_campaign_id = excluded.external_campaign_id,
  source_platform = excluded.source_platform,
  channel = excluded.channel,
  campaign_name = excluded.campaign_name,
  status = excluded.status,
  updated_at = now();

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
),
client as (
  select c.id, c.organization_id
  from public.clients c
  join org on org.id = c.organization_id
  where c.client_id = 'client_bull_digital'
  limit 1
),
campaigns as (
  select *
  from (
    values
      (
        '44444444-4444-4444-8444-444444444441'::uuid,
        'google_ads',
        'Google Ads',
        'Brand Search - Staging',
        5200::numeric,
        245::numeric,
        8::numeric,
        7200::numeric
      ),
      (
        '44444444-4444-4444-8444-444444444442'::uuid,
        'meta_ads',
        'Meta Ads',
        'Demand Gen - Staging',
        9800::numeric,
        310::numeric,
        11::numeric,
        6400::numeric
      ),
      (
        '44444444-4444-4444-8444-444444444443'::uuid,
        'linkedin_ads',
        'LinkedIn Ads',
        'B2B Leads - Staging',
        4100::numeric,
        96::numeric,
        4::numeric,
        5600::numeric
      )
  ) as c(campaign_id, source_platform, channel, campaign_name, base_cost, base_clicks, base_conversions, base_revenue)
),
days as (
  select generate_series(0, 6) as day_offset
),
metrics as (
  select
    (select organization_id from client) as organization_id,
    (select id from client) as client_id,
    campaigns.campaign_id,
    current_date - days.day_offset as date,
    'last_30d' as period_key,
    campaigns.source_platform,
    campaigns.channel,
    campaigns.campaign_name,
    round(campaigns.base_clicks * (22 + days.day_offset) / 2) as impressions,
    round(campaigns.base_clicks + (days.day_offset * 3)) as clicks,
    round(campaigns.base_cost / 7 + (days.day_offset * 8), 2) as cost,
    round(campaigns.base_conversions / 7 + (days.day_offset * 0.12), 2) as conversions,
    round(campaigns.base_revenue / 7 + (days.day_offset * 35), 2) as revenue
  from campaigns
  cross join days
)
insert into public.media_metrics_daily (
  organization_id,
  client_id,
  campaign_id,
  date,
  period_key,
  source_platform,
  channel,
  campaign_name,
  impressions,
  clicks,
  cost,
  conversions,
  conversion_value,
  revenue,
  cpc,
  cpa,
  ctr,
  roas,
  raw_source
)
select
  organization_id,
  client_id,
  campaign_id,
  date,
  period_key,
  source_platform,
  channel,
  campaign_name,
  impressions,
  clicks,
  cost,
  conversions,
  revenue,
  revenue,
  round(cost / nullif(clicks, 0), 2),
  round(cost / nullif(conversions, 0), 2),
  round(clicks / nullif(impressions, 0), 4),
  round(revenue / nullif(cost, 0), 2),
  'staging_minimal_seed'
from metrics
where organization_id is not null
on conflict (organization_id, client_id, date, source_platform, channel, campaign_name) do update set
  campaign_id = excluded.campaign_id,
  period_key = excluded.period_key,
  impressions = excluded.impressions,
  clicks = excluded.clicks,
  cost = excluded.cost,
  conversions = excluded.conversions,
  conversion_value = excluded.conversion_value,
  revenue = excluded.revenue,
  cpc = excluded.cpc,
  cpa = excluded.cpa,
  ctr = excluded.ctr,
  roas = excluded.roas,
  raw_source = excluded.raw_source,
  updated_at = now();

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
),
client as (
  select c.id, c.organization_id
  from public.clients c
  join org on org.id = c.organization_id
  where c.client_id = 'client_bull_digital'
  limit 1
)
insert into public.recommended_actions (
  organization_id,
  client_id,
  module_key,
  source_platform,
  channel,
  campaign_name,
  title,
  description,
  priority,
  status,
  expected_impact,
  confidence,
  metric_impacted,
  before_value,
  action_group_id,
  affected_items_count,
  grouped_occurrences,
  effort_level,
  decision_owner,
  recommendation_type,
  metadata
)
select *
from (
  values
    (
      (select organization_id from client),
      (select id from client),
      'media_ops',
      'google_ads',
      'Google Ads',
      'Brand Search - Staging',
      'Refinar cobertura de termos de alta intenção',
      'Validar termos com maior sinal comercial antes de ampliar verba no ciclo.',
      'high',
      'suggested',
      'Aumentar eficiência de aquisição mantendo CPA controlado.',
      0.84::numeric,
      'CPA',
      138.5::numeric,
      'seed_bull_google_intent',
      3,
      '["Termos de marca", "Variações de serviço", "Consultas com intenção executiva"]'::jsonb,
      'baixo',
      'Gestor de Mídia',
      'Oportunidade de eficiência',
      '{"stage":"staging_seed"}'::jsonb
    ),
    (
      (select organization_id from client),
      (select id from client),
      'media_ops',
      'meta_ads',
      'Meta Ads',
      'Demand Gen - Staging',
      'Validar qualidade dos sinais pós-clique',
      'Comparar públicos e criativos com base em engajamento qualificado antes de escalar.',
      'medium',
      'in_review',
      'Melhorar leitura de qualidade e reduzir dispersão de leads.',
      0.76::numeric,
      'Taxa de conversão',
      0.032::numeric,
      'seed_bull_meta_quality',
      4,
      '["Público lookalike", "Criativo consultivo", "Landing page V2"]'::jsonb,
      'médio',
      'Estratégia',
      'Ponto a validar',
      '{"stage":"staging_seed"}'::jsonb
    ),
    (
      (select organization_id from client),
      (select id from client),
      'media_ops',
      'linkedin_ads',
      'LinkedIn Ads',
      'B2B Leads - Staging',
      'Priorizar audiência executiva com maior fit',
      'Separar leituras por senioridade e função para preparar próximo ciclo de investimento.',
      'medium',
      'approved',
      'Gerar oportunidade de evolução com maior previsibilidade comercial.',
      0.72::numeric,
      'ROAS',
      2.68::numeric,
      'seed_bull_linkedin_fit',
      2,
      '["Founders", "Heads de Marketing"]'::jsonb,
      'médio',
      'Direção',
      'Escala controlada',
      '{"stage":"staging_seed"}'::jsonb
    )
) as seed(
  organization_id,
  client_id,
  module_key,
  source_platform,
  channel,
  campaign_name,
  title,
  description,
  priority,
  status,
  expected_impact,
  confidence,
  metric_impacted,
  before_value,
  action_group_id,
  affected_items_count,
  grouped_occurrences,
  effort_level,
  decision_owner,
  recommendation_type,
  metadata
)
where seed.organization_id is not null
on conflict (organization_id, action_group_id) where action_group_id is not null do update set
  source_platform = excluded.source_platform,
  channel = excluded.channel,
  campaign_name = excluded.campaign_name,
  title = excluded.title,
  description = excluded.description,
  priority = excluded.priority,
  status = excluded.status,
  expected_impact = excluded.expected_impact,
  confidence = excluded.confidence,
  metric_impacted = excluded.metric_impacted,
  before_value = excluded.before_value,
  affected_items_count = excluded.affected_items_count,
  grouped_occurrences = excluded.grouped_occurrences,
  effort_level = excluded.effort_level,
  decision_owner = excluded.decision_owner,
  recommendation_type = excluded.recommendation_type,
  metadata = excluded.metadata,
  updated_at = now();

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
),
client as (
  select c.id, c.organization_id
  from public.clients c
  join org on org.id = c.organization_id
  where c.client_id = 'client_bull_digital'
  limit 1
)
insert into public.data_sources (
  id,
  key,
  name,
  category,
  status,
  organization_id,
  client_id,
  source_type,
  source_name,
  account_id,
  account_name,
  currency,
  timezone,
  last_synced_at,
  metadata
)
select
  '55555555-5555-4555-8555-555555555555',
  'staging_v1_controlled_export',
  'Exportação controlada V1',
  'temporary_import',
  'validating',
  client.organization_id,
  client.id,
  'legacy_v1_export',
  'Exportação controlada V1',
  'staging-v1',
  'Google Sheets operacional',
  'BRL',
  'America/Sao_Paulo',
  now(),
  '{"stage":"staging_seed","external_integration":"not_connected"}'::jsonb
from client
on conflict (key) do update set
  name = excluded.name,
  category = excluded.category,
  status = excluded.status,
  organization_id = excluded.organization_id,
  client_id = excluded.client_id,
  source_type = excluded.source_type,
  source_name = excluded.source_name,
  account_id = excluded.account_id,
  account_name = excluded.account_name,
  currency = excluded.currency,
  timezone = excluded.timezone,
  last_synced_at = excluded.last_synced_at,
  metadata = excluded.metadata,
  updated_at = now();

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
),
source as (
  select id, organization_id
  from public.data_sources
  where key = 'staging_v1_controlled_export'
  limit 1
)
insert into public.import_batches (
  organization_id,
  source_id,
  source_type,
  status,
  started_at,
  finished_at,
  records_received,
  records_imported,
  records_skipped,
  warnings,
  errors,
  checksum,
  created_at
)
select
  org.id,
  source.id,
  'legacy_v1_export',
  'completed_with_warnings',
  now() - interval '20 minutes',
  now() - interval '18 minutes',
  28,
  24,
  4,
  '["Dados usados apenas para validação visual em staging."]'::jsonb,
  '[]'::jsonb,
  'staging-minimal-seed-bull-digital-v1',
  now() - interval '20 minutes'
from org
left join source on source.organization_id = org.id
where not exists (
  select 1
  from public.import_batches existing
  where existing.organization_id = org.id
    and existing.source_type = 'legacy_v1_export'
    and existing.checksum = 'staging-minimal-seed-bull-digital-v1'
);

with org as (
  select id from public.organizations where slug = 'bull-digital' limit 1
),
client as (
  select c.id, c.organization_id
  from public.clients c
  join org on org.id = c.organization_id
  where c.client_id = 'client_bull_digital'
  limit 1
),
source as (
  select id from public.data_sources where key = 'staging_v1_controlled_export' limit 1
)
insert into public.data_quality_logs (
  id,
  organization_id,
  client_id,
  source_id,
  severity,
  entity_type,
  entity_id,
  message,
  metadata
)
select *
from (
  values
    (
      '66666666-6666-4666-8666-666666666661'::uuid,
      (select organization_id from client),
      (select id from client),
      (select id from source),
      'info',
      'media_metrics_daily',
      'staging_seed_metrics',
      'Métricas fictícias criadas para validação operacional do staging.',
      '{"stage":"staging_seed","records":"7_days"}'::jsonb
    ),
    (
      '66666666-6666-4666-8666-666666666662'::uuid,
      (select organization_id from client),
      (select id from client),
      (select id from source),
      'attention',
      'recommended_action',
      'seed_bull_meta_quality',
      'Recomendações agrupadas por tema antes da primeira importação real.',
      '{"stage":"staging_seed","grouped_actions":3}'::jsonb
    )
) as seed(id, organization_id, client_id, source_id, severity, entity_type, entity_id, message, metadata)
where seed.organization_id is not null
on conflict (id) do update set
  severity = excluded.severity,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  message = excluded.message,
  metadata = excluded.metadata;

do $$
declare
  v_org_id uuid;
  v_client_id uuid;
  v_pillar_id uuid := '77777777-7777-4777-8777-777777777771';
begin
  if to_regclass('public.social_posts') is null then
    return;
  end if;

  select o.id into v_org_id
  from public.organizations o
  where o.slug = 'bull-digital'
  limit 1;

  select c.id into v_client_id
  from public.clients c
  where c.organization_id = v_org_id
    and c.client_id = 'client_bull_digital'
  limit 1;

  if v_org_id is null or v_client_id is null then
    return;
  end if;

  insert into public.social_pillars (id, organization_id, name, description, status)
  values (
    v_pillar_id,
    v_org_id,
    'Marketing Operations',
    'Conteúdos sobre governança, mídia, dados e inteligência aplicada.',
    'active'
  )
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    updated_at = now();

  insert into public.social_posts (
    id,
    organization_id,
    client_id,
    pillar_id,
    title,
    channel,
    format,
    scheduled_date,
    status,
    approval_status,
    copy,
    metadata
  )
  values
    (
      '88888888-8888-4888-8888-888888888881',
      v_org_id,
      v_client_id,
      v_pillar_id,
      'Como transformar mídia em rotina de decisão',
      'linkedin',
      'post',
      current_date + 2,
      'scheduled',
      'approved',
      'Uma operação de mídia madura não depende apenas de campanha. Ela depende de leitura, priorização e execução auditável.',
      '{"stage":"staging_seed"}'::jsonb
    ),
    (
      '88888888-8888-4888-8888-888888888882',
      v_org_id,
      v_client_id,
      v_pillar_id,
      'Central de ações para ciclos de performance',
      'instagram',
      'carousel',
      current_date + 5,
      'in_production',
      'submitted',
      'A Central de Ações organiza oportunidades de evolução por prioridade, impacto esperado e status operacional.',
      '{"stage":"staging_seed"}'::jsonb
    )
  on conflict (id) do update set
    pillar_id = excluded.pillar_id,
    title = excluded.title,
    channel = excluded.channel,
    format = excluded.format,
    scheduled_date = excluded.scheduled_date,
    status = excluded.status,
    approval_status = excluded.approval_status,
    copy = excluded.copy,
    metadata = excluded.metadata,
    updated_at = now();
end $$;

do $$
declare
  v_org_id uuid;
  v_client_id uuid;
  v_source_id uuid;
begin
  select o.id into v_org_id
  from public.organizations o
  where o.slug = 'bull-digital'
  limit 1;

  select c.id into v_client_id
  from public.clients c
  where c.organization_id = v_org_id
    and c.client_id = 'client_bull_digital'
  limit 1;

  select ds.id into v_source_id
  from public.data_sources ds
  where ds.key = 'staging_v1_controlled_export'
  limit 1;

  if v_org_id is null or v_client_id is null then
    return;
  end if;

  if to_regclass('public.reports') is not null then
    insert into public.reports (
      id,
      organization_id,
      client_id,
      source_id,
      period_key,
      report_type,
      status,
      narrative,
      metadata
    )
    values (
      '99999999-9999-4999-8999-999999999991',
      v_org_id,
      v_client_id,
      v_source_id,
      to_char(current_date, 'YYYY-MM'),
      'executive_summary',
      'draft',
      'Resumo controlado para validar o módulo de relatórios em staging.',
      '{"stage":"staging_seed"}'::jsonb
    )
    on conflict (organization_id, client_id, period_key, report_type) do update set
      source_id = excluded.source_id,
      status = excluded.status,
      narrative = excluded.narrative,
      metadata = excluded.metadata,
      updated_at = now();
  end if;

  if to_regclass('public.pdm_plans') is not null then
    insert into public.pdm_plans (
      id,
      organization_id,
      client_id,
      source_id,
      period_key,
      cycle_objective,
      channels,
      planned_action,
      hypothesis,
      expected_impact,
      suggested_investment,
      expected_benefit,
      status,
      specialist_note,
      metadata
    )
    values (
      '99999999-9999-4999-8999-999999999992',
      v_org_id,
      v_client_id,
      v_source_id,
      to_char(current_date, 'YYYY-MM'),
      'Validar mídia, ações e governança da V2 em staging.',
      array['Google Ads', 'Meta Ads', 'LinkedIn Ads'],
      'Executar ciclo controlado de recomendações estratégicas.',
      'Com dados mínimos persistidos, a operação consegue validar fluxo sem depender da importação real.',
      'Aumentar confiança operacional antes da primeira carga real da V1.',
      8500,
      'Base para revisão executiva e próximos módulos.',
      'specialist_review',
      'Seed fictício para validação, sem conexão com plataformas externas.',
      '{"stage":"staging_seed"}'::jsonb
    )
    on conflict (organization_id, client_id, period_key, planned_action) do update set
      source_id = excluded.source_id,
      cycle_objective = excluded.cycle_objective,
      channels = excluded.channels,
      hypothesis = excluded.hypothesis,
      expected_impact = excluded.expected_impact,
      suggested_investment = excluded.suggested_investment,
      expected_benefit = excluded.expected_benefit,
      status = excluded.status,
      specialist_note = excluded.specialist_note,
      metadata = excluded.metadata,
      updated_at = now();
  end if;

  if to_regclass('public.client_intelligence') is not null then
    insert into public.client_intelligence (
      id,
      organization_id,
      client_id,
      source_id,
      insight_type,
      content,
      metadata
    )
    values
      (
        '99999999-9999-4999-8999-999999999993',
        v_org_id,
        v_client_id,
        v_source_id,
        'learning',
        'A Bull Media Ops V2 deve priorizar ciclos pequenos, auditáveis e separados por domínio.',
        '{"stage":"staging_seed"}'::jsonb
      ),
      (
        '99999999-9999-4999-8999-999999999994',
        v_org_id,
        v_client_id,
        v_source_id,
        'strategic_note',
        'A primeira validação operacional deve confirmar overview, ações, integrações e Social Ops sem payload gigante.',
        '{"stage":"staging_seed"}'::jsonb
      )
    on conflict (id) do update set
      insight_type = excluded.insight_type,
      content = excluded.content,
      metadata = excluded.metadata;
  end if;
end $$;

commit;
