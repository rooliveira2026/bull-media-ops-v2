import { getSupabaseClient } from "../../../shared/api/supabase-client";
import { isSupabaseMode } from "../../../shared/config/env";

export interface PdmItem {
  id: string;
  clientName: string;
  block: string;
  objective: string;
  channels: string;
  action: string;
  hypothesis: string;
  impact: string;
  investment: number;
  benefit: string;
  status: string;
  note: string;
  decision: string;
}

const mockPdmItems: PdmItem[] = [
  { id: "pdm_001", clientName: "Intercity Batel", block: "Plano recorrente mensal", objective: "Ampliar reservas diretas", channels: "Google Ads, Meta Ads", action: "Escalar campanhas de alta intenção", hypothesis: "Reservas diretas crescem mantendo CPA controlado.", impact: "Maior volume com eficiência preservada.", investment: 8200, benefit: "Incremento estimado de reservas", status: "especialista aprova", note: "Validar disponibilidade comercial antes de enviar ao cliente.", decision: "Aguardando aprovação interna" },
  { id: "pdm_002", clientName: "About Events", block: "Oportunidades de evolução", objective: "Qualificar demanda B2B", channels: "LinkedIn Ads, Google Ads", action: "Criar segmentação por cargo e intenção", hypothesis: "Públicos mais específicos elevam qualidade comercial.", impact: "Mais previsibilidade no funil.", investment: 6400, benefit: "Leads com maior aderência", status: "especialista edita", note: "Ajustar narrativa e volume esperado.", decision: "Em validação" },
  { id: "pdm_003", clientName: "Bull Digital", block: "Itens aprovados para execução", objective: "Validar demanda de produto", channels: "LinkedIn Ads", action: "Testar oferta de diagnóstico executivo", hypothesis: "Mensagem orientada a operação melhora qualidade pós-clique.", impact: "Aprendizado de posicionamento.", investment: 3200, benefit: "Sinal comercial mais claro", status: "em execução", note: "Acompanhar sinais de reunião qualificada.", decision: "Aprovado" },
];

function blockForStatus(status: string) {
  if (status.includes("approved") || status.includes("execution") || status.includes("exec")) return "Itens aprovados para execução";
  if (status.includes("edit") || status.includes("review") || status.includes("validation")) return "Oportunidades de evolução";
  return "Plano recorrente mensal";
}

function mapPdm(row: Record<string, any>): PdmItem {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  const channels = Array.isArray(row.channels) && row.channels.length ? row.channels.join(", ") : "Canais a validar";
  return {
    id: row.id,
    clientName: client?.name ?? row.client_name ?? "Cliente",
    block: blockForStatus(String(row.status ?? "")),
    objective: row.cycle_objective ?? "Objetivo em validação",
    channels,
    action: row.planned_action ?? "Ação em planejamento",
    hypothesis: row.hypothesis ?? "Hipótese em validação.",
    impact: row.expected_impact ?? "Impacto esperado em validação.",
    investment: Number(row.suggested_investment ?? 0),
    benefit: row.expected_benefit ?? "Benefício esperado em validação.",
    status: row.status ?? "specialist_review",
    note: row.specialist_note ?? "",
    decision: row.final_decision ?? "Aguardando decisão",
  };
}

export async function listPdmPlans(): Promise<PdmItem[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return isSupabaseMode() ? [] : mockPdmItems;

  try {
    const { data, error } = await supabase
      .from("pdm_plans")
      .select("*, clients(name, client_id)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapPdm);
  } catch (error) {
    if (isSupabaseMode()) {
      console.warn("[supabase:pdm] leitura indisponível; retornando vazio:", error);
      return [];
    }
    return mockPdmItems;
  }
}
