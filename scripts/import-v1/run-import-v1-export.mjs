#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const args = new Map();
process.argv.slice(2).forEach((arg, index, list) => {
  if (arg.startsWith("--")) args.set(arg, list[index + 1]?.startsWith("--") ? true : list[index + 1] ?? true);
});

const filePath = args.get("--file");
const dryRun = args.has("--dry-run");

if (!filePath) {
  console.error("Uso: node scripts/import-v1/run-import-v1-export.mjs --file ./export.json [--dry-run]");
  process.exit(1);
}

const sourceTypes = new Set([
  "legacy_v1_export",
  "google_ads_api",
  "meta_ads_api",
  "ga4_api",
  "linkedin_ads_api",
  "clickup_api",
  "manual_input",
]);

const languageMap = [
  [/conta crítica/gi, "em acompanhamento"],
  [/crítico|crítica/gi, "atenção estratégica"],
  [/problema/gi, "ponto de atenção"],
  [/falha/gi, "ponto a validar"],
  [/desperdício/gi, "oportunidade de eficiência"],
  [/tráfego irrelevante/gi, "tráfego com menor aderência ao perfil ideal"],
];

function sanitize(text) {
  return languageMap.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), String(text ?? ""));
}

function normalizeChannel(value) {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("google")) return "Google Ads";
  if (key.includes("meta") || key.includes("facebook") || key.includes("instagram")) return "Meta Ads";
  if (key.includes("linkedin")) return "LinkedIn Ads";
  if (key.includes("ga4") || key.includes("analytics")) return "GA4";
  if (key.includes("clickup")) return "ClickUp";
  return "Canal a validar";
}

function normalizeObjective(value) {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("booking") || key.includes("reserva")) return "booking";
  if (key.includes("receita") || key.includes("revenue")) return "revenue";
  if (key.includes("awareness") || key.includes("alcance")) return "awareness";
  if (key.includes("traffic") || key.includes("tráfego")) return "traffic";
  if (key.includes("whatsapp") || key.includes("conversa")) return "whatsapp";
  return "lead_generation";
}

function normalizePriority(value) {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("alta") || key.includes("high")) return "high";
  if (key.includes("baixa") || key.includes("low")) return "low";
  return "medium";
}

function normalizeStatus(value) {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("aprov")) return "approved";
  if (key.includes("exec")) return "executed";
  if (key.includes("monitor")) return "monitoring";
  if (key.includes("descart")) return "dismissed";
  if (key.includes("avalia") || key.includes("review")) return "in_review";
  return "suggested";
}

function metric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "0").replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function platformKey(channel) {
  return normalizeChannel(channel).toLowerCase().replaceAll(" ", "_");
}

function campaignKey(clientId, sourcePlatform, channel, campaignName) {
  return [clientId, sourcePlatform, normalizeChannel(channel), campaignName || "Consolidado"].join("::");
}

function sourceType(value) {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("v1") || key.includes("sheet") || key.includes("planilha")) return "legacy_v1_export";
  if (key.includes("google")) return "google_ads_api";
  if (key.includes("meta")) return "meta_ads_api";
  if (key.includes("ga4") || key.includes("analytics")) return "ga4_api";
  if (key.includes("linkedin")) return "linkedin_ads_api";
  if (key.includes("clickup")) return "clickup_api";
  return "manual_input";
}

function groupActions(actions) {
  const groups = new Map();
  actions.forEach((action) => {
    const key = [
      action.client_id,
      normalizeChannel(action.channel),
      action.recommendation_type ?? "recomendação",
      action.theme ?? action.title,
    ].join("::").toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), action]);
  });

  return Array.from(groups.entries()).map(([key, items], index) => {
    const first = items[0];
    return {
      action_group_id: key,
      client_id: first.client_id,
      client_name: first.client_name,
      channel: normalizeChannel(first.channel),
      source_platform: normalizeChannel(first.channel).toLowerCase().replaceAll(" ", "_"),
      recommendation_type: sanitize(first.recommendation_type ?? "Recomendação estratégica"),
      title: sanitize(first.title),
      description: sanitize(first.description),
      priority: normalizePriority(first.priority),
      status: normalizeStatus(first.status),
      affected_items_count: items.length,
      grouped_occurrences: items.map((item) => sanitize(item.occurrence ?? item.title)),
      expected_impact: sanitize(first.expected_impact ?? "Oportunidade de eficiência com validação do especialista."),
      effort_level: first.effort_level ?? "médio",
      decision_owner: first.decision_owner ?? "Especialista responsável",
      specialist_note: first.specialist_note ?? "Revisar agrupamento antes da curadoria.",
      final_decision: first.final_decision ?? "Aguardando decisão",
      sort_index: index,
    };
  });
}

function assertShape(payload) {
  const required = ["export_id", "source", "organization_id", "period", "clients", "metrics", "recommended_actions"];
  const missing = required.filter((key) => payload[key] === undefined);
  if (missing.length) throw new Error(`Export V1 inválido. Campos ausentes: ${missing.join(", ")}`);
  const detected = sourceType(payload.source);
  if (!sourceTypes.has(detected) || detected !== "legacy_v1_export") {
    throw new Error(`source_type esperado legacy_v1_export, recebido ${detected}`);
  }
}

function normalize(payload, checksum) {
  assertShape(payload);
  const groupedActions = groupActions(payload.recommended_actions ?? []);
  const explicitCampaigns = payload.campaigns ?? [];
  const derivedCampaigns = new Map();
  (payload.metrics ?? []).forEach((row) => {
    const campaignName = row.campaign_name ?? row.campaign ?? "Consolidado";
    const channel = normalizeChannel(row.channel);
    const sourcePlatform = platformKey(row.channel);
    const key = campaignKey(row.client_id, sourcePlatform, channel, campaignName);
    if (!derivedCampaigns.has(key)) {
      derivedCampaigns.set(key, {
        client_id: row.client_id,
        external_campaign_id: row.campaign_id ?? row.external_campaign_id ?? key,
        source_platform: sourcePlatform,
        channel,
        campaign_name: campaignName,
        status: row.status ?? "active",
      });
    }
  });
  const warnings = [];
  if ((payload.recommended_actions ?? []).length !== groupedActions.length) {
    warnings.push(`${payload.recommended_actions.length} ocorrências técnicas agrupadas em ${groupedActions.length} recomendações-mãe.`);
  }

  const received = payload.clients.length +
    explicitCampaigns.length +
    payload.metrics.length +
    (payload.recommended_actions ?? []).length +
    (payload.reports ?? []).length +
    (payload.pdm ?? []).length +
    (payload.client_intelligence ?? []).length;

  return {
    checksum,
    sourceType: "legacy_v1_export",
    organizationId: payload.organization_id,
    periodKey: `${payload.period.start}_${payload.period.end}`,
    recordsReceived: received,
    warnings,
    clients: payload.clients.map((client) => ({
      client_id: client.id,
      name: sanitize(client.name),
      status: client.status ?? "active",
      primary_objective: normalizeObjective(client.objective),
      business_model: client.business_model ?? client.client_type ?? null,
      currency: String(client.currency ?? "BRL").toUpperCase(),
      channels: (client.channels ?? []).map(normalizeChannel),
    })),
    campaigns: [
      ...explicitCampaigns.map((campaign) => ({
        client_id: campaign.client_id,
        external_campaign_id: campaign.external_campaign_id ?? campaign.id ?? null,
        source_platform: platformKey(campaign.channel ?? campaign.source_platform),
        channel: normalizeChannel(campaign.channel ?? campaign.source_platform),
        campaign_name: campaign.campaign_name ?? campaign.name ?? "Consolidado",
        status: campaign.status ?? "active",
      })),
      ...Array.from(derivedCampaigns.values()),
    ].filter((campaign, index, list) => {
      const key = campaignKey(campaign.client_id, campaign.source_platform, campaign.channel, campaign.campaign_name);
      return list.findIndex((item) => campaignKey(item.client_id, item.source_platform, item.channel, item.campaign_name) === key) === index;
    }),
    metrics: payload.metrics.map((row) => ({
      client_id: row.client_id,
      external_campaign_id: row.campaign_id ?? row.external_campaign_id ?? null,
      date: row.date ?? payload.period.end,
      period_key: "current_month",
      source_platform: platformKey(row.channel),
      channel: normalizeChannel(row.channel),
      campaign_name: row.campaign_name ?? "Consolidado",
      impressions: metric(row.impressions),
      clicks: metric(row.clicks),
      cost: metric(row.cost),
      conversions: metric(row.conversions),
      conversion_value: metric(row.revenue),
      revenue: metric(row.revenue),
      cpc: metric(row.clicks) ? metric(row.cost) / metric(row.clicks) : 0,
      cpa: metric(row.conversions) ? metric(row.cost) / metric(row.conversions) : 0,
      ctr: metric(row.impressions) ? metric(row.clicks) / metric(row.impressions) : 0,
      roas: metric(row.cost) ? metric(row.revenue) / metric(row.cost) : 0,
      raw_source: "legacy_v1_export",
    })),
    actions: groupedActions,
    reports: payload.reports ?? [],
    pdm: payload.pdm ?? [],
    intelligence: payload.client_intelligence ?? [],
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

async function main() {
  const raw = await readFile(filePath, "utf8");
  const checksum = createHash("sha256").update(raw).digest("hex");
  const payload = JSON.parse(raw);
  const normalized = normalize(payload, checksum);

  if (dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run",
      checksum,
      recordsReceived: normalized.recordsReceived,
      clients: normalized.clients.length,
      campaigns: normalized.campaigns.length,
      metrics: normalized.metrics.length,
      groupedActions: normalized.actions.length,
      reports: normalized.reports.length,
      pdm: normalized.pdm.length,
      intelligence: normalized.intelligence.length,
      warnings: normalized.warnings,
    }, null, 2));
    return;
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const startedAt = new Date().toISOString();
  const { data: existingBatch, error: existingBatchError } = await supabase
    .from("import_batches")
    .select("id,status")
    .eq("organization_id", normalized.organizationId)
    .eq("source_type", normalized.sourceType)
    .eq("checksum", checksum)
    .maybeSingle();
  if (existingBatchError) throw existingBatchError;
  if (existingBatch?.status === "completed" || existingBatch?.status === "completed_with_warnings") {
    console.log(JSON.stringify({ status: "skipped", reason: "checksum already imported", checksum, batchId: existingBatch.id }, null, 2));
    return;
  }

  const dataSourceKey = `legacy_v1_export_${normalized.organizationId}`;
  const { data: source, error: sourceError } = await supabase
    .from("data_sources")
    .upsert({
      key: dataSourceKey,
      name: "Exportação controlada V1",
      category: "temporary_import",
      status: "validating",
      organization_id: normalized.organizationId,
      source_type: normalized.sourceType,
      source_name: "Exportação controlada V1",
      account_id: payload.export_id,
      account_name: "V1 Google Sheets",
      currency: normalized.clients[0]?.currency ?? "BRL",
      timezone: "America/Sao_Paulo",
      last_synced_at: startedAt,
      metadata: { checksum, period: payload.period },
    }, { onConflict: "key" })
    .select("*")
    .single();
  if (sourceError) throw sourceError;

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      organization_id: normalized.organizationId,
      source_id: source.id,
      source_type: normalized.sourceType,
      status: "running",
      started_at: startedAt,
      records_received: normalized.recordsReceived,
      warnings: normalized.warnings,
      checksum,
    })
    .select("*")
    .single();
  if (batchError) throw batchError;

  let imported = 0;
  const skipped = [];

  const clientIdMap = new Map();
  const campaignIdMap = new Map();
  for (const client of normalized.clients) {
    const { data, error } = await supabase
      .from("clients")
      .upsert({
        organization_id: normalized.organizationId,
        client_id: client.client_id,
        name: client.name,
        status: client.status,
        primary_objective: client.primary_objective,
        business_model: client.business_model,
      }, { onConflict: "organization_id,client_id" })
      .select("*")
      .single();
    if (error) throw error;
    clientIdMap.set(client.client_id, data.id);
    imported += 1;

    for (const channel of client.channels) {
      const { error: channelError } = await supabase.from("client_channels").upsert({
        organization_id: normalized.organizationId,
        client_id: data.id,
        channel,
        source_type: normalized.sourceType,
        status: "active",
        metadata: { source_id: source.id },
      }, { onConflict: "organization_id,client_id,channel" });
      if (channelError) throw channelError;
    }
  }

  for (const campaign of normalized.campaigns) {
    const clientUuid = clientIdMap.get(campaign.client_id);
    if (!clientUuid) {
      skipped.push(`campaign_without_client:${campaign.client_id}`);
      continue;
    }
    const campaignMatch = {
      organization_id: normalized.organizationId,
      client_id: clientUuid,
      source_platform: campaign.source_platform,
      channel: campaign.channel,
      campaign_name: campaign.campaign_name,
    };
    const { data: existingCampaign, error: existingCampaignError } = await supabase
      .from("media_campaigns")
      .select("id")
      .match(campaignMatch)
      .maybeSingle();
    if (existingCampaignError) throw existingCampaignError;

    const campaignPayload = {
      ...campaignMatch,
      external_campaign_id: campaign.external_campaign_id,
      status: campaign.status,
    };
    const { data, error } = existingCampaign
      ? await supabase
        .from("media_campaigns")
        .update(campaignPayload)
        .eq("id", existingCampaign.id)
        .select("*")
        .single()
      : await supabase
        .from("media_campaigns")
        .insert(campaignPayload)
        .select("*")
        .single();
    if (error) throw error;
    if (data?.id) {
      campaignIdMap.set(campaignKey(campaign.client_id, campaign.source_platform, campaign.channel, campaign.campaign_name), data.id);
      if (campaign.external_campaign_id) campaignIdMap.set(`${campaign.client_id}::${campaign.external_campaign_id}`, data.id);
    }
    imported += 1;
  }

  for (const row of normalized.metrics) {
    const clientUuid = clientIdMap.get(row.client_id);
    if (!clientUuid) {
      skipped.push(`metric_without_client:${row.client_id}`);
      continue;
    }
    const campaignUuid = campaignIdMap.get(`${row.client_id}::${row.external_campaign_id}`) ??
      campaignIdMap.get(campaignKey(row.client_id, row.source_platform, row.channel, row.campaign_name)) ??
      null;
    const { error } = await supabase.from("media_metrics_daily").upsert({
      organization_id: normalized.organizationId,
      client_id: clientUuid,
      campaign_id: campaignUuid,
      date: row.date,
      period_key: row.period_key,
      source_platform: row.source_platform,
      channel: row.channel,
      campaign_name: row.campaign_name || "Consolidado",
      impressions: row.impressions,
      clicks: row.clicks,
      cost: row.cost,
      conversions: row.conversions,
      conversion_value: row.conversion_value,
      revenue: row.revenue,
      cpc: row.cpc,
      cpa: row.cpa,
      ctr: row.ctr,
      roas: row.roas,
      raw_source: row.raw_source,
    }, { onConflict: "organization_id,client_id,date,source_platform,channel,campaign_name" });
    if (error) throw error;
    imported += 1;
  }

  for (const action of normalized.actions) {
    const clientUuid = clientIdMap.get(action.client_id);
    if (!clientUuid) {
      skipped.push(`action_without_client:${action.client_id}`);
      continue;
    }
    const { error } = await supabase.from("recommended_actions").upsert({
      organization_id: normalized.organizationId,
      client_id: clientUuid,
      module_key: "media_ops",
      source_platform: action.source_platform,
      channel: action.channel,
      title: action.title,
      description: action.description,
      priority: action.priority,
      status: action.status,
      expected_impact: action.expected_impact,
      action_group_id: action.action_group_id,
      affected_items_count: action.affected_items_count,
      grouped_occurrences: action.grouped_occurrences,
      effort_level: action.effort_level,
      decision_owner: action.decision_owner,
      recommendation_type: action.recommendation_type,
      specialist_note: action.specialist_note,
      final_decision: action.final_decision,
      metadata: { source_id: source.id, checksum },
    }, { onConflict: "organization_id,action_group_id" });
    if (error) throw error;
    imported += 1;
  }

  for (const report of normalized.reports) {
    const clientUuid = clientIdMap.get(report.client_id);
    if (!clientUuid) continue;
    const { error } = await supabase.from("reports").upsert({
      organization_id: normalized.organizationId,
      client_id: clientUuid,
      source_id: source.id,
      period_key: report.period ?? normalized.periodKey,
      report_type: report.type ?? "executivo",
      status: report.status ?? "draft",
      narrative: report.narrative ?? null,
      metadata: { checksum },
    }, { onConflict: "organization_id,client_id,period_key,report_type" });
    if (error) throw error;
    imported += 1;
  }

  for (const item of normalized.pdm) {
    const clientUuid = clientIdMap.get(item.client_id);
    if (!clientUuid) continue;
    const { error } = await supabase.from("pdm_plans").upsert({
      organization_id: normalized.organizationId,
      client_id: clientUuid,
      source_id: source.id,
      period_key: item.period ?? normalized.periodKey,
      cycle_objective: item.cycle_objective ?? null,
      planned_action: item.planned_action ?? item.cycle_objective ?? "Plano em validação",
      status: item.status ?? "specialist_review",
      metadata: { checksum },
    }, { onConflict: "organization_id,client_id,period_key,planned_action" });
    if (error) throw error;
    imported += 1;
  }

  for (const item of normalized.intelligence) {
    const clientUuid = clientIdMap.get(item.client_id);
    if (!clientUuid) continue;
    const content = item.learning ?? item.content ?? "Aprendizado importado da V1.";
    const insightType = item.insight_type ?? "learning";
    const { data: existingInsight, error: existingInsightError } = await supabase
      .from("client_intelligence")
      .select("id")
      .eq("organization_id", normalized.organizationId)
      .eq("client_id", clientUuid)
      .eq("source_id", source.id)
      .eq("insight_type", insightType)
      .eq("content", content)
      .maybeSingle();
    if (existingInsightError) throw existingInsightError;
    if (existingInsight) continue;
    const { error } = await supabase.from("client_intelligence").insert({
      organization_id: normalized.organizationId,
      client_id: clientUuid,
      source_id: source.id,
      insight_type: insightType,
      content,
      metadata: { checksum },
    });
    if (error) throw error;
    imported += 1;
  }

  const qualityLogs = [
    ...normalized.warnings.map((message) => ({ severity: "attention", entity_type: "import_batch", message })),
    ...skipped.map((message) => ({ severity: "warning", entity_type: "skipped_record", message })),
  ];

  for (const log of qualityLogs) {
    const { error } = await supabase.from("data_quality_logs").insert({
      organization_id: normalized.organizationId,
      source_id: source.id,
      severity: log.severity,
      entity_type: log.entity_type,
      message: log.message,
      metadata: { checksum },
    });
    if (error) throw error;
  }

  const finishedAt = new Date().toISOString();
  const status = skipped.length || normalized.warnings.length ? "completed_with_warnings" : "completed";
  const { error: finishError } = await supabase.from("import_batches").update({
    status,
    finished_at: finishedAt,
    records_imported: imported,
    records_skipped: skipped.length,
    warnings: normalized.warnings,
    errors: [],
  }).eq("id", batch.id);
  if (finishError) throw finishError;

  console.log(JSON.stringify({
    status,
    checksum,
    batchId: batch.id,
    recordsReceived: normalized.recordsReceived,
    recordsImported: imported,
    recordsSkipped: skipped.length,
    clientsImported: normalized.clients.length,
    channelsImported: normalized.clients.reduce((total, client) => total + client.channels.length, 0),
    campaignsImported: normalized.campaigns.length - skipped.filter((item) => item.startsWith("campaign_without_client")).length,
    metricsImported: normalized.metrics.length - skipped.filter((item) => item.startsWith("metric_without_client")).length,
    groupedActions: normalized.actions.length,
    reportsImported: normalized.reports.length,
    pdmImported: normalized.pdm.length,
    qualityLogsGenerated: qualityLogs.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
