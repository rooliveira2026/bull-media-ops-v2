import type { MediaMetricDaily } from "../types";

export interface V1MediaRow {
  client_id?: string;
  cliente?: string;
  canal?: string;
  campanha?: string;
  periodo?: string;
  data?: string;
  investimento?: number | string;
  cost?: number | string;
  impressoes?: number | string;
  impressions?: number | string;
  cliques?: number | string;
  clicks?: number | string;
  conversoes?: number | string;
  conversions?: number | string;
  receita?: number | string;
  revenue?: number | string;
  cpa?: number | string;
  cpc?: number | string;
  ctr?: number | string;
  roas?: number | string;
}

const organizationId = "org_bull";
const clientIdMap: Record<string, string> = {
  intercity_batel: "client_intercity",
  about_events: "client_about",
  bull_digital: "client_bull",
};

export const mockV1MediaRows: V1MediaRow[] = [
  {
    client_id: "intercity_batel",
    cliente: "Intercity Batel",
    canal: "Google Ads",
    campanha: "Brand Search",
    periodo: "last_30d",
    data: "2026-06-08",
    investimento: 26300,
    impressoes: 184000,
    cliques: 9200,
    conversoes: 282,
    receita: 138600,
  },
  {
    client_id: "about_events",
    cliente: "About Events",
    canal: "Meta Ads",
    campanha: "Leads Eventos",
    periodo: "last_30d",
    data: "2026-06-08",
    investimento: 34200,
    impressoes: 412000,
    cliques: 12800,
    conversoes: 176,
    receita: 98100,
  },
  {
    client_id: "bull_digital",
    cliente: "Bull Digital",
    canal: "LinkedIn Ads",
    campanha: "Demand Gen",
    periodo: "last_30d",
    data: "2026-06-08",
    investimento: 18900,
    impressoes: 76000,
    cliques: 2100,
    conversoes: 64,
    receita: 81200,
  },
];

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSourcePlatform(channel: string): string {
  const value = channel.toLowerCase();
  if (value.includes("google")) return "google_ads";
  if (value.includes("meta") || value.includes("facebook") || value.includes("instagram")) return "meta_ads";
  if (value.includes("linkedin")) return "linkedin_ads";
  if (value.includes("tiktok")) return "tiktok";
  return "unknown";
}

export function normalizeV1MediaRowsToV2(rows: V1MediaRow[]): MediaMetricDaily[] {
  const now = new Date().toISOString();

  return rows.map((row, index) => {
    const v1ClientId = String(row.client_id ?? "").trim();
    const clientId = clientIdMap[v1ClientId] ?? v1ClientId;
    const channel = String(row.canal ?? "Mídia").trim();
    const cost = toNumber(row.investimento ?? row.cost);
    const impressions = toNumber(row.impressoes ?? row.impressions);
    const clicks = toNumber(row.cliques ?? row.clicks);
    const conversions = toNumber(row.conversoes ?? row.conversions);
    const revenue = toNumber(row.receita ?? row.revenue);

    return {
      id: `metric_v1_${index + 1}`,
      organizationId,
      clientId,
      campaignId: null,
      date: String(row.data ?? "2026-06-08"),
      periodKey: String(row.periodo ?? "last_30d"),
      sourcePlatform: normalizeSourcePlatform(channel),
      channel,
      campaignName: String(row.campanha ?? "Campanha sem nome"),
      impressions,
      clicks,
      cost,
      conversions,
      conversionValue: revenue,
      revenue,
      cpc: clicks ? cost / clicks : toNumber(row.cpc),
      cpa: conversions ? cost / conversions : toNumber(row.cpa),
      ctr: impressions ? clicks / impressions : toNumber(row.ctr),
      roas: cost ? revenue / cost : toNumber(row.roas),
      rawSource: "v1_mock_fixture",
      createdAt: now,
      updatedAt: now,
    };
  });
}
