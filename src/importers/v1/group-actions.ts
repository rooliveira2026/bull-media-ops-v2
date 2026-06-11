import {
  normalizeChannel,
  normalizePriority,
  normalizeStatus,
  sanitizeClientLanguage,
} from "./normalizers";

interface RawAction {
  client_id: string;
  client_name: string;
  channel: string;
  recommendation_type: string;
  theme: string;
  title: string;
  description: string;
  priority?: string;
  status?: string;
  expected_impact?: string;
  occurrence?: string;
  effort_level?: "baixo" | "médio" | "alto";
  decision_owner?: string;
}

export function groupRecommendedActions(rawActions: RawAction[]) {
  const groups = new Map<string, RawAction[]>();

  rawActions.forEach((action) => {
    const key = [
      action.client_id,
      normalizeChannel(action.channel),
      action.recommendation_type,
      action.theme,
    ].join("::").toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), action]);
  });

  return Array.from(groups.entries()).map(([key, items], index) => {
    const first = items[0];
    const channel = normalizeChannel(first.channel);
    return {
      id: `v1_group_${index + 1}`,
      action_group_id: key,
      parent_action_id: null,
      client_id: first.client_id,
      client_name: first.client_name,
      channel,
      recommendation_type: sanitizeClientLanguage(first.recommendation_type),
      title: sanitizeClientLanguage(first.title),
      description: sanitizeClientLanguage(first.description),
      priority: normalizePriority(first.priority),
      status: normalizeStatus(first.status),
      affected_items_count: items.length,
      grouped_occurrences: items.map((item) => sanitizeClientLanguage(item.occurrence ?? item.title)),
      expected_impact: sanitizeClientLanguage(first.expected_impact ?? "Oportunidade de eficiência com validação do especialista."),
      effort_level: first.effort_level ?? "médio",
      decision_owner: first.decision_owner ?? "Especialista responsável",
      specialist_note: "Revisar agrupamento antes de enviar para curadoria.",
      final_decision: "Aguardando decisão",
    };
  });
}
