#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

const args = new Map();
process.argv.slice(2).forEach((arg, index, list) => {
  if (arg.startsWith("--")) args.set(arg, list[index + 1]?.startsWith("--") ? true : list[index + 1] ?? true);
});

const inputPath = resolve(String(args.get("--input") ?? "local-imports/v1-export-real-small.json"));
const outputPath = resolve(String(args.get("--output") ?? "local-imports/v1-export-full-staging.json"));
const reportPath = resolve(String(args.get("--report") ?? "local-imports/v1-export-full-staging.report.json"));

function stableId(value, fallback = "item") {
  return String(value ?? fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || fallback;
}

function normalizeChannel(value) {
  const key = String(value ?? "").toLowerCase();
  if (key.includes("google")) return "Google Ads";
  if (key.includes("meta") || key.includes("facebook") || key.includes("instagram")) return "Meta Ads";
  if (key.includes("linkedin")) return "LinkedIn Ads";
  if (key.includes("ga4") || key.includes("analytics")) return "GA4";
  return String(value ?? "Canal a validar").trim() || "Canal a validar";
}

function numberValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "0").replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasRealMetric(row) {
  return ["cost", "clicks", "impressions", "conversions", "revenue"].some((key) => numberValue(row[key]) > 0);
}

function normalizeClient(client, index) {
  const clientId = stableId(client.id ?? client.client_id ?? client.name, `client_${index + 1}`);
  return {
    id: clientId,
    name: String(client.name ?? client.cliente ?? `Cliente ${index + 1}`).trim(),
    status: client.status ?? "active",
    objective: client.objective ?? "lead_generation",
    business_model: client.business_model ?? client.client_type ?? null,
    currency: String(client.currency ?? "BRL").toUpperCase(),
    channels: Array.from(new Set((client.channels ?? []).map(normalizeChannel))),
  };
}

function normalizeCampaign(campaign, clientId, index) {
  const channel = normalizeChannel(campaign.channel);
  const campaignName = String(campaign.campaign_name ?? campaign.name ?? campaign.campanha ?? `Campanha ${index + 1}`).trim();
  return {
    id: stableId(campaign.id ?? campaign.external_campaign_id ?? `${clientId}_${channel}_${campaignName}`, `campaign_${index + 1}`),
    client_id: clientId,
    channel,
    campaign_name: campaignName,
    status: campaign.status ?? "active",
  };
}

function campaignKey(campaign) {
  return [campaign.client_id, normalizeChannel(campaign.channel), campaign.campaign_name].join("::").toLowerCase();
}

function normalizeMetric(row, clientId, campaignById, index) {
  const channel = normalizeChannel(row.channel);
  const campaignName = String(row.campaign_name ?? row.campaign ?? row.campanha ?? `Campanha ${index + 1}`).trim();
  const campaignId = stableId(row.campaign_id ?? row.external_campaign_id ?? `${clientId}_${channel}_${campaignName}`, `campaign_${index + 1}`);
  if (!campaignById.has(campaignId)) {
    campaignById.set(campaignId, normalizeCampaign({
      id: campaignId,
      client_id: clientId,
      channel,
      campaign_name: campaignName,
      status: row.status ?? "active",
    }, clientId, campaignById.size));
  }
  return {
    client_id: clientId,
    campaign_id: campaignId,
    channel,
    campaign_name: campaignName,
    date: row.date,
    cost: numberValue(row.cost),
    clicks: numberValue(row.clicks),
    impressions: numberValue(row.impressions),
    conversions: numberValue(row.conversions),
    revenue: numberValue(row.revenue),
  };
}

function normalizeAction(action, client) {
  return {
    client_id: client.id,
    client_name: client.name,
    channel: normalizeChannel(action.channel),
    recommendation_type: action.recommendation_type ?? "Recomendação estratégica",
    theme: stableId(action.theme ?? action.title ?? "acao_importada", "acao_importada"),
    title: action.title ?? "Ação importada para curadoria",
    description: action.description ?? "Descrição pendente de revisão.",
    priority: action.priority ?? "média",
    status: action.status ?? "avaliação",
    expected_impact: action.expected_impact ?? "Impacto esperado pendente de revisão.",
    occurrence: action.occurrence ?? action.title ?? "Ocorrência importada.",
    effort_level: action.effort_level ?? "médio",
    decision_owner: action.decision_owner ?? "Especialista responsável",
  };
}

function firstClient(payload) {
  const rawClient = payload.clients?.[0];
  if (rawClient) return normalizeClient(rawClient, 0);
  const inferredName = payload.metrics?.[0]?.client_name ?? payload.recommended_actions?.[0]?.client_name ?? "Cliente importado";
  return normalizeClient({ id: stableId(inferredName, "client_imported"), name: inferredName }, 0);
}

async function main() {
  const raw = await readFile(inputPath, "utf8");
  const source = JSON.parse(raw);
  const warnings = [];
  const found = {};
  const missing = [];

  const client = firstClient(source);
  found.clients = source.clients?.length ?? 0;

  const campaignById = new Map();
  (source.campaigns ?? []).forEach((campaign, index) => {
    const normalized = normalizeCampaign(campaign, stableId(campaign.client_id ?? client.id), index);
    campaignById.set(normalized.id, normalized);
  });
  found.campaigns = source.campaigns?.length ?? 0;

  const sourceMetrics = source.metrics ?? [];
  const zeroMetrics = sourceMetrics.filter((row) => !hasRealMetric(row));
  const metrics = sourceMetrics
    .filter(hasRealMetric)
    .map((row, index) => normalizeMetric(row, client.id, campaignById, index));
  found.metrics = sourceMetrics.length;
  if (zeroMetrics.length) {
    warnings.push(`${zeroMetrics.length} métricas zeradas foram removidas do export gerado.`);
  }
  if (!metrics.length) {
    missing.push("metricas_reais");
    warnings.push("Nenhuma métrica real positiva foi encontrada nos arquivos locais. Exporte ou cole métricas da V1 antes do import real.");
  }

  const campaigns = Array.from(campaignById.values())
    .filter((campaign, index, list) => list.findIndex((item) => campaignKey(item) === campaignKey(campaign)) === index);

  const actions = (source.recommended_actions ?? []).map((action) => normalizeAction(action, client));
  found.recommended_actions = source.recommended_actions?.length ?? 0;
  if (!actions.length) missing.push("recommended_actions");

  const output = {
    export_id: `v1-full-staging-${new Date().toISOString().slice(0, 10)}`,
    source: "legacy_v1_export",
    organization_id: source.organization_id,
    period: source.period ?? {
      start: new Date().toISOString().slice(0, 10),
      end: new Date().toISOString().slice(0, 10),
    },
    clients: [client],
    campaigns,
    metrics,
    recommended_actions: actions,
    reports: (source.reports ?? []).map((report) => ({ ...report, client_id: client.id })),
    pdm: (source.pdm ?? []).map((item) => ({ ...item, client_id: client.id })),
    client_intelligence: (source.client_intelligence ?? []).map((item) => ({ ...item, client_id: client.id })),
  };

  found.reports = source.reports?.length ?? 0;
  found.pdm = source.pdm?.length ?? 0;
  found.client_intelligence = source.client_intelligence?.length ?? 0;

  for (const key of ["organization_id", "period"]) {
    if (!source[key]) missing.push(key);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    input: basename(inputPath),
    output: basename(outputPath),
    found,
    generated: {
      clients: output.clients.length,
      campaigns: output.campaigns.length,
      metrics: output.metrics.length,
      recommended_actions: output.recommended_actions.length,
      reports: output.reports.length,
      pdm: output.pdm.length,
      client_intelligence: output.client_intelligence.length,
    },
    removed: {
      zero_metrics: zeroMetrics.length,
    },
    missing,
    warnings,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
