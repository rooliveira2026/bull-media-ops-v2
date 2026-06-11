import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, DollarSign, Layers3, Target, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { currency, decimal, number } from "../../shared/utils/format";
import { getMediaOverview } from "./api/media-ops-repository";
import type { ClientMediaSummary, MediaOverview } from "./types";

function statusLabel(status: ClientMediaSummary["status"]) {
  const labels = {
    healthy: "Saudável",
    strategic_attention: "Atenção estratégica",
    review: "Em acompanhamento",
    evolution_opportunity: "Oportunidade de evolução",
  };
  return labels[status];
}

export function ExecutiveOverview() {
  const [overview, setOverview] = useState<MediaOverview | null>(null);

  useEffect(() => {
    getMediaOverview({ period: "last_30d" }).then(setOverview);
  }, []);

  if (!overview) {
    return (
      <section>
        <PageHeader
          eyebrow="Media Ops"
          title="Visão Executiva"
          description="Carregando visão consolidada da operação."
        />
      </section>
    );
  }

  const { summary } = overview;

  return (
    <section>
      <PageHeader
        eyebrow="Media Ops"
        title="Visão Executiva"
        description="Visão consolidada de performance, prioridades e oportunidades de evolução por cliente."
        meta="Últimos 30 dias"
      />

      <div className="kpi-grid">
        <KpiCard label="Clientes monitorados" value={number(summary.monitoredClients)} icon={Users} tone="primary" />
        <KpiCard label="Canais ativos" value={number(summary.activeChannels)} icon={Layers3} tone="primary" />
        <KpiCard label="Contas em acompanhamento" value={number(summary.accountsForReview)} icon={ClipboardList} tone="warning" />
        <KpiCard label="Recomendações ativas" value={number(summary.recommendedActions)} icon={CheckCircle2} tone="primary" />
        <KpiCard label="Investimento" value={currency(summary.cost)} icon={DollarSign} />
        <KpiCard label="Conversões" value={number(summary.conversions)} icon={Target} tone="success" />
        <KpiCard label="CPA médio" value={currency(summary.cpa)} icon={Target} />
        <KpiCard label="ROAS médio" value={decimal(summary.roas, 2)} icon={TrendingUp} tone="success" />
      </div>

      <div className="executive-grid">
        <div className="section-card section-card--wide">
          <div className="section-card__header">
            <div>
              <span>Prioridades do dia</span>
              <h2>Foco operacional</h2>
            </div>
            <p>{overview.actions.filter((action) => action.status === "approved").length} ações aprovadas aguardando execução.</p>
          </div>
          <ul className="simple-list">
            {overview.actions.slice(0, 3).map((action) => (
              <li key={action.id}>
                <strong>{action.title}</strong>
                <span>{action.clientName} · {action.expectedImpact} · próxima etapa: {action.status === "approved" ? "execução" : "curadoria"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div>
              <span>Impacto estimado</span>
              <h2>Recomendações</h2>
            </div>
            <p>Leitura consultiva para priorização da semana.</p>
          </div>
          <ul className="simple-list">
            <li><strong>{currency(summary.cost * 0.08)}</strong><span>Potencial de realocação eficiente em recomendações ativas.</span></li>
            <li><strong>{number(Math.round(summary.conversions * 0.06))}</strong><span>Conversões incrementais estimadas em ações de baixa complexidade.</span></li>
          </ul>
        </div>
      </div>

      <div className="core-grid">
        <div className="section-card">
          <div className="section-card__header">
            <div>
              <span>Oportunidades de evolução</span>
              <h2>Top canais</h2>
            </div>
            <p>Canais com maior relevância no período.</p>
          </div>
          <ul className="simple-list">
            {overview.topChannels.map((channel) => (
              <li key={channel.channel}>
                <strong>{channel.channel}</strong>
                <span>{currency(channel.cost)} · {number(channel.conversions)} conversões · ROAS {decimal(channel.roas, 2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div>
              <span>Clientes em acompanhamento</span>
              <h2>Leitura por cliente</h2>
            </div>
            <p>{overview.clients.length} clientes monitorados.</p>
          </div>
          <ul className="simple-list">
            {overview.clients.map((client) => (
              <li key={client.clientId}>
                <strong>{client.clientName}</strong>
                <span>{statusLabel(client.status)} · {client.mainReading}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div>
              <span>Ações aprovadas</span>
              <h2>Pendentes de execução</h2>
            </div>
            <p>Recomendações prontas para avanço operacional.</p>
          </div>
          <ul className="simple-list">
            {overview.actions.filter((action) => action.status === "approved").concat(overview.actions).slice(0, 3).map((action) => (
              <li key={action.id}>
                <strong>{action.title}</strong>
                <span>{action.clientName} · {action.channel} · {action.expectedImpact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
