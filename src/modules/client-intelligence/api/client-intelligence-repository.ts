import { getSupabaseClient } from "../../../shared/api/supabase-client";
import { isSupabaseMode } from "../../../shared/config/env";

export interface ClientIntelligenceItem {
  id: string;
  clientId: string;
  clientName: string;
  clientObjective: string;
  insightType: string;
  content: string;
  createdAt: string;
}

const mockIntelligence: ClientIntelligenceItem[] = [
  { id: "intel_intercity", clientId: "client_intercity", clientName: "Intercity Batel", clientObjective: "booking", insightType: "learning", content: "Busca de marca sustenta intenção direta.", createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "intel_about", clientId: "client_about", clientName: "About Events", clientObjective: "lead_generation", insightType: "learning", content: "Leads precisam de qualificação por porte.", createdAt: "2026-06-01T00:00:00.000Z" },
  { id: "intel_bull", clientId: "client_bull", clientName: "Bull Digital", clientObjective: "revenue", insightType: "learning", content: "Conteúdos de operação geram conversas mais qualificadas.", createdAt: "2026-06-01T00:00:00.000Z" },
];

function mapIntelligence(row: Record<string, any>): ClientIntelligenceItem {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: client?.name ?? row.client_name ?? "Cliente",
    clientObjective: client?.primary_objective ?? "lead_generation",
    insightType: row.insight_type ?? "learning",
    content: row.content ?? "",
    createdAt: row.created_at,
  };
}

export async function listClientIntelligence(): Promise<ClientIntelligenceItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return isSupabaseMode() ? [] : mockIntelligence;

  try {
    const { data, error } = await supabase
      .from("client_intelligence")
      .select("*, clients(name, client_id, primary_objective)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapIntelligence);
  } catch (error) {
    if (isSupabaseMode()) {
      console.warn("[supabase:client_intelligence] leitura indisponível; retornando vazio:", error);
      return [];
    }
    return mockIntelligence;
  }
}
