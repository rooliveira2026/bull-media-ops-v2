export type ClientObjective = "lead_generation" | "revenue" | "awareness" | "traffic" | "booking" | "whatsapp";

export interface ClientConfig {
  clientId: string;
  objective: ClientObjective;
  clientType: string;
  activeChannels: string[];
  currency: "BRL" | "USD";
  owner: string;
  generatesReport: boolean;
  generatesPdm: boolean;
  notes: string;
}

export const objectiveLabels: Record<ClientObjective, string> = {
  lead_generation: "Geração de leads",
  revenue: "Receita",
  awareness: "Reconhecimento",
  traffic: "Tráfego qualificado",
  booking: "Reservas",
  whatsapp: "Conversas WhatsApp",
};

export const clientConfigs: ClientConfig[] = [
  {
    clientId: "client_intercity",
    objective: "booking",
    clientType: "Hotelaria",
    activeChannels: ["Google Ads", "Meta Ads"],
    currency: "BRL",
    owner: "Time de Mídia",
    generatesReport: true,
    generatesPdm: true,
    notes: "Priorizar reservas diretas, taxa de conversão e eficiência de CPA.",
  },
  {
    clientId: "client_about",
    objective: "lead_generation",
    clientType: "Eventos corporativos",
    activeChannels: ["Google Ads", "Meta Ads", "LinkedIn Ads"],
    currency: "BRL",
    owner: "Time de Mídia",
    generatesReport: true,
    generatesPdm: true,
    notes: "Qualificar leads por intenção comercial e reduzir dispersão de captação.",
  },
  {
    clientId: "client_bull",
    objective: "revenue",
    clientType: "Marketing Operations",
    activeChannels: ["LinkedIn Ads", "Google Ads"],
    currency: "BRL",
    owner: "Rodrigo Oliveira",
    generatesReport: true,
    generatesPdm: false,
    notes: "Acompanhar demanda, receita potencial e oportunidades de produto.",
  },
];

export function getClientConfig(clientId: string) {
  return clientConfigs.find((config) => config.clientId === clientId) ?? clientConfigs[0];
}

export function detectClientObjective(clientConfig: Pick<ClientConfig, "objective">): ClientObjective {
  return clientConfig.objective;
}

export function metricLabelsForObjective(objective: ClientObjective) {
  const labels: Record<ClientObjective, string[]> = {
    lead_generation: ["Investimento", "Leads", "CPL/CPA", "Cliques", "CTR", "CPC"],
    revenue: ["Receita", "ROAS", "Conversões", "CPA", "Ticket médio"],
    awareness: ["Alcance", "Impressões", "Frequência", "CPM", "CTR"],
    traffic: ["Cliques", "CPC", "CTR", "Sessões", "Engajamento"],
    booking: ["Reservas", "Custo por reserva", "Receita", "Taxa de conversão", "ROAS"],
    whatsapp: ["Conversas iniciadas", "Custo por conversa", "Taxa de qualificação", "Cliques"],
  };
  return labels[objective];
}
