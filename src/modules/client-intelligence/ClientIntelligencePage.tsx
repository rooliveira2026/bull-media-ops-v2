import { useEffect, useMemo, useState } from "react";
import { objectiveLabels, type ClientObjective } from "../../shared/api/client-config";
import { PageHeader } from "../../shared/components/PageHeader";
import { listClientIntelligence, type ClientIntelligenceItem } from "./api/client-intelligence-repository";

function objectiveLabel(value: string) {
  return objectiveLabels[value as ClientObjective] ?? value ?? "Objetivo em validação";
}

export function ClientIntelligencePage() {
  const [items, setItems] = useState<ClientIntelligenceItem[]>([]);

  useEffect(() => {
    listClientIntelligence()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const clients = useMemo(() => {
    const grouped = new Map<string, ClientIntelligenceItem[]>();
    items.forEach((item) => {
      grouped.set(item.clientId, [...(grouped.get(item.clientId) ?? []), item]);
    });
    return Array.from(grouped.values()).map((clientItems) => ({
      client: clientItems[0],
      items: clientItems,
    }));
  }, [items]);

  return (
    <section>
      <PageHeader
        eyebrow="Inteligência do Cliente"
        title="Memória estratégica"
        description="Base de conhecimento por cliente para orientar mídia, relatórios, PDM e próximos ciclos de decisão."
        meta="Cliente"
      />
      <div className="client-intel-grid">
        {clients.map(({ client, items: clientItems }) => {
          return (
            <article className="section-card" key={client.clientId}>
              <div className="section-card__header">
                <div><span>{objectiveLabel(client.clientObjective)}</span><h2>{client.clientName}</h2></div>
                <p>Memória importada e aprendizados operacionais disponíveis para consulta.</p>
              </div>
              <div className="detail-grid">
                <Detail label="Registros" value={String(clientItems.length)} />
                <Detail label="Último tipo" value={client.insightType} />
                <Detail label="Última atualização" value={client.createdAt ? new Date(client.createdAt).toLocaleDateString("pt-BR") : "A validar"} />
              </div>
              <div className="knowledge-columns">
                <div><strong>Histórico de aprendizados</strong><ul className="compact-list">{clientItems.map((item) => <li key={item.id}>{item.content}</li>)}</ul></div>
                <div><strong>Próximas perguntas</strong><ul className="compact-list"><li>Validar próximos ciclos com base na memória importada.</li></ul></div>
              </div>
            </article>
          );
        })}
        {clients.length === 0 ? (
          <div className="empty-panel empty-panel--left">
            <strong>Nenhuma inteligência carregada</strong>
            <p>Importe aprendizados da V1 ou registre a primeira memória estratégica do cliente.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}
