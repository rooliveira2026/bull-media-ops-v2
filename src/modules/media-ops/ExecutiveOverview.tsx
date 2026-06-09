import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, DollarSign, Layers3, Target, TrendingUp, Users } from "lucide-react";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { currency, decimal, number } from "../../shared/utils/format";
import { getMediaOverview } from "./api/media-ops-repository";
import type { ClientMediaSummary, MediaOverview } from "./types";

function statusLabel(status: ClientMediaSummary["status"]) {
  const labels = {
    healthy: "Saudável",
    strategic_attention: "Atenção estratégica",
    review: "Conta para revisão",
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
          description="Carregando overview modular de Media Ops."
          meta="Sprint 2"
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
        description="Overview modular com dados normalizados, importador V1 mockável e sem payload global."
        meta="Sprint 2 · Dados normalizados"
      />

      <div className="kpi-grid">
        <KpiCard label="Clientes monitorados" value={number(summary.monitoredClients)} icon={Users} tone="primary" />
        <KpiCard label="Canais ativos" value={number(summary.activeChannels)} icon={Layers3} tone="primary" />
        <KpiCard label="Contas para revisão" value={number(summary.accountsForReview)} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Ações recomendadas" value={number(summary.recommendedActions)} icon={CheckCircle2} tone="primary" />
        <KpiCard label="Investimento" value={currency(summary.cost)} icon={DollarSign} />
        <KpiCard label="Conversões" value={number(summary.conversions)} icon={Target} tone="success" />
        <KpiCard label="CPA médio" value={currency(summary.cpa)} icon={Target} />
        <KpiCard label="ROAS médio" value={decimal(summary.roas, 2)} icon={TrendingUp} tone="success" />
      </div>

      <div className="core-grid">
        <div className="section-card">
          <div className="section-card__header">
            <div>
              <span>Media Ops</span>
              <h2>Top canais</h2>
            </div>
            <p>Resumo por canal vindo do repository modular.</p>
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
              <span>Media Ops</span>
              <h2>Leitura por cliente</h2>
            </div>
            <p>{overview.clients.length} clientes no período.</p>
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
              <span>Media Ops</span>
              <h2>Ações recomendadas</h2>
            </div>
            <p>Contrato real, dados mockados.</p>
          </div>
          <ul className="simple-list">
            {overview.actions.slice(0, 3).map((action) => (
              <li key={action.id}>
                <strong>{action.title}</strong>
                <span>{action.clientName} · {action.channel} · {action.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
