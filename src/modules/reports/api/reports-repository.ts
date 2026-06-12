import { getSupabaseClient } from "../../../shared/api/supabase-client";
import { isSupabaseMode } from "../../../shared/config/env";

export interface ReportItem {
  id: string;
  clientId: string;
  clientName: string;
  clientObjective: string;
  period: string;
  type: string;
  status: string;
  narrative: string;
}

const mockReports: ReportItem[] = [
  { id: "report_001", clientId: "client_intercity", clientName: "Intercity Batel", clientObjective: "booking", status: "aprovado", period: "Maio/2026", type: "executivo", narrative: "Reservas diretas em evolução com oportunidade de ampliar campanhas de maior intenção." },
  { id: "report_002", clientId: "client_about", clientName: "About Events", clientObjective: "lead_generation", status: "em revisão", period: "Maio/2026", type: "mídia paga", narrative: "Captação com bons sinais de volume e pontos de qualificação comercial para validar." },
  { id: "report_003", clientId: "client_bull", clientName: "Bull Digital", clientObjective: "revenue", status: "rascunho", period: "Maio/2026", type: "executivo", narrative: "Demanda em acompanhamento com foco em qualidade pós-clique e leitura de produto." },
];

function mapReport(row: Record<string, any>): ReportItem {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: client?.name ?? row.client_name ?? "Cliente",
    clientObjective: client?.primary_objective ?? "lead_generation",
    period: row.period_key ?? "Período a validar",
    type: row.report_type ?? "executive_summary",
    status: row.status ?? "draft",
    narrative: row.narrative ?? "Narrativa em preparação.",
  };
}

export async function listReports(): Promise<ReportItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return isSupabaseMode() ? [] : mockReports;

  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*, clients(name, client_id, primary_objective)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReport);
  } catch (error) {
    if (isSupabaseMode()) {
      console.warn("[supabase:reports] leitura indisponível; retornando vazio:", error);
      return [];
    }
    return mockReports;
  }
}
