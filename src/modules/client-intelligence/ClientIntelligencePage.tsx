import { useEffect, useState } from "react";
import { getClientConfig, objectiveLabels } from "../../shared/api/client-config";
import { PageHeader } from "../../shared/components/PageHeader";
import { listClients } from "../core/api/core-repository";
import type { Client } from "../../shared/types/core";

const intelligence = {
  client_intercity: {
    audience: "Viajantes corporativos e hóspedes com decisão rápida por localização.",
    offer: "Reserva direta com conveniência, localização e previsibilidade.",
    learnings: ["Busca de marca sustenta intenção direta.", "Criativos locais ajudam reconhecimento.", "Mobile concentra sinais de reserva."],
    salesFeedback: "Reservas diretas têm maior valor quando associadas a localização e agenda corporativa.",
    constraints: "Evitar promessas de disponibilidade sem validação comercial.",
    questions: ["Quais datas precisam de reforço?", "Há pacotes com margem superior?"],
    notes: "Priorizar clareza de oferta e calendário de ocupação.",
  },
  client_about: {
    audience: "Decisores de marketing, RH e eventos corporativos.",
    offer: "Planejamento de eventos com previsibilidade, experiência e execução especializada.",
    learnings: ["Leads precisam de qualificação por porte.", "LinkedIn tende a gerar melhor contexto B2B.", "Formulários curtos aumentam volume, mas pedem filtro comercial."],
    salesFeedback: "O time comercial valoriza informações sobre prazo, porte e objetivo do evento.",
    constraints: "Evitar volume sem contexto de qualificação.",
    questions: ["Quais segmentos têm maior taxa de fechamento?", "Qual ticket mínimo desejado?"],
    notes: "Usar narrativa de previsibilidade e consultoria.",
  },
  client_bull: {
    audience: "Fundadores e líderes de marketing que precisam de operação com leitura executiva.",
    offer: "Marketing Operations com mídia, inteligência e governança de ações.",
    learnings: ["Conteúdos de operação geram conversas mais qualificadas.", "Diagnóstico executivo é uma boa porta de entrada.", "Provas de processo ajudam confiança."],
    salesFeedback: "Oportunidades melhores chegam quando a dor operacional está explícita.",
    constraints: "Evitar comunicação genérica de agência.",
    questions: ["Qual oferta será priorizada no ciclo?", "Quais cases podem virar narrativa?"],
    notes: "Reforçar produto, método e tomada de decisão.",
  },
};

export function ClientIntelligencePage() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch(() => setClients([]));
  }, []);

  return (
    <section>
      <PageHeader
        eyebrow="Inteligência do Cliente"
        title="Memória estratégica"
        description="Base de conhecimento por cliente para orientar mídia, relatórios, PDM e próximos ciclos de decisão."
        meta="Cliente"
      />
      <div className="client-intel-grid">
        {clients.map((client) => {
          const config = getClientConfig(client.id);
          const item = intelligence[client.id as keyof typeof intelligence];
          if (!item) return null;
          return (
            <article className="section-card" key={client.id}>
              <div className="section-card__header">
                <div><span>{objectiveLabels[config.objective]}</span><h2>{client.name}</h2></div>
                <p>{client.primaryObjective}</p>
              </div>
              <div className="detail-grid">
                <Detail label="Público ideal" value={item.audience} />
                <Detail label="Oferta principal" value={item.offer} />
                <Detail label="Canais ativos" value={config.activeChannels.join(", ")} />
                <Detail label="Feedback comercial" value={item.salesFeedback} />
                <Detail label="Restrições e cuidados" value={item.constraints} />
                <Detail label="Observações internas" value={item.notes} />
              </div>
              <div className="knowledge-columns">
                <div><strong>Histórico de aprendizados</strong><ul className="compact-list">{item.learnings.map((text) => <li key={text}>{text}</li>)}</ul></div>
                <div><strong>Próximas perguntas</strong><ul className="compact-list">{item.questions.map((text) => <li key={text}>{text}</li>)}</ul></div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}
