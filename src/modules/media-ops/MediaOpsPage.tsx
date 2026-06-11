import { useEffect, useMemo, useState } from "react";
import { BarChart3, LineChart, MousePointerClick, Target, TrendingUp } from "lucide-react";
import {
  detectClientObjective,
  getClientConfig,
  metricLabelsForObjective,
  objectiveLabels,
} from "../../shared/api/client-config";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { currency, decimal, number, percent } from "../../shared/utils/format";
import { getChannelSummary, getMediaOverview } from "./api/media-ops-repository";
import type { ChannelSummary, ClientMediaSummary, MediaOverview } from "./types";

function buildClientMetrics(client: ClientMediaSummary) {
  const config = getClientConfig(client.clientId);
  const objective = detectClientObjective(config);
  const clicks = Math.round(client.cost / 3.8);
  const impressions = clicks * 18;
  const ctr = impressions ? clicks / impressions : 0;
  const cpc = clicks ? client.cost / clicks : 0;
  const conversionRate = clicks ? client.conversions / clicks : 0;
  const ticket = client.conversions ? client.revenue / client.conversions : 0;

  const values = {
    lead_generation: [
      currency(client.cost),
      number(client.conversions),
      currency(client.cpa),
      number(clicks),
      percent(ctr),
      currency(cpc),
    ],
    revenue: [
      currency(client.revenue),
      decimal(client.roas, 2),
      number(client.conversions),
      currency(client.cpa),
      currency(ticket),
    ],
    awareness: [
      number(impressions * 0.72),
      number(impressions),
      decimal(2.4, 1),
      currency((client.cost / impressions) * 1000),
      percent(ctr),
    ],
    traffic: [
      number(clicks),
      currency(cpc),
      percent(ctr),
      number(Math.round(clicks * 0.82)),
      percent(0.34),
    ],
    booking: [
      number(client.conversions),
      currency(client.cpa),
      client.revenue > 0 ? currency(client.revenue) : "A validar",
      percent(conversionRate),
      client.roas > 0 ? decimal(client.roas, 2) : "A validar",
    ],
    whatsapp: [
      number(Math.round(client.conversions * 1.35)),
      currency(client.cpa * 0.74),
      percent(0.41),
      number(clicks),
    ],
  };

  return metricLabelsForObjective(objective).map((label, index) => ({
    label,
    value: values[objective][index] ?? "A validar",
  }));
}

export function MediaOpsPage() {
  const [overview, setOverview] = useState<MediaOverview | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  useEffect(() => {
    getMediaOverview({ period: "last_30d" }).then(setOverview);
    getChannelSummary(undefined, "last_30d").then(setChannels);
  }, []);

  useEffect(() => {
    if (!selectedClientId && overview?.clients[0]) {
      setSelectedClientId(overview.clients[0].clientId);
    }
  }, [overview, selectedClientId]);

  const selectedClient = useMemo(() => {
    return overview?.clients.find((client) => client.clientId === selectedClientId) ?? overview?.clients[0] ?? null;
  }, [overview, selectedClientId]);

  const selectedConfig = selectedClient ? getClientConfig(selectedClient.clientId) : null;
  const objective = selectedConfig ? detectClientObjective(selectedConfig) : "lead_generation";
  const clientMetrics = selectedClient ? buildClientMetrics(selectedClient) : [];
  const summary = overview?.summary;
  const showRevenue = selectedConfig ? ["revenue", "booking"].includes(selectedConfig.objective) && (selectedClient?.revenue ?? 0) > 0 : true;

  return (
    <section>
      <PageHeader
        eyebrow="Media Ops"
        title="Performance por cliente"
        description="Leitura orientada ao objetivo de negócio de cada cliente, com métricas priorizadas por contexto."
        meta="Últimos 30 dias"
      />

      <div className="filter-bar filter-bar--compact">
        <label>
          <span>Cliente</span>
          <select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>
            {overview?.clients.length ? null : <option value="">Nenhum cliente disponível</option>}
            {overview?.clients.map((client) => <option value={client.clientId} key={client.clientId}>{client.clientName}</option>)}
          </select>
        </label>
        <label>
          <span>Objetivo</span>
          <select value={objective} disabled>
            <option>{objectiveLabels[objective]}</option>
          </select>
        </label>
      </div>

      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Investimento total" value={currency(summary?.cost ?? 0)} icon={BarChart3} />
        <KpiCard label={objective === "booking" ? "Reservas" : "Conversões"} value={number(summary?.conversions ?? 0)} icon={Target} tone="success" />
        {showRevenue ? <KpiCard label="Receita" value={currency(selectedClient?.revenue ?? summary?.revenue ?? 0)} icon={LineChart} tone="success" /> : null}
        {showRevenue ? <KpiCard label="ROAS" value={decimal(selectedClient?.roas ?? summary?.roas ?? 0, 2)} icon={TrendingUp} tone="primary" /> : null}
        {!showRevenue ? <KpiCard label="Cliques estimados" value={number(Math.round((selectedClient?.cost ?? 0) / 3.8))} icon={MousePointerClick} tone="primary" /> : null}
      </div>

      <div className="client-objective-panel">
        <div className="section-card">
          <div className="section-card__header">
            <div>
              <span>Objetivo do cliente</span>
              <h2>{selectedClient?.clientName}</h2>
            </div>
            <p>{selectedConfig?.notes}</p>
          </div>
          <div className="metric-chip-grid">
            {clientMetrics.map((metric) => (
              <div className="metric-chip" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div>
              <span>Canais ativos</span>
              <h2>Mix operacional</h2>
            </div>
            <p>{selectedConfig?.activeChannels.join(", ")}</p>
          </div>
          <ul className="simple-list">
            {channels.slice(0, 3).map((channel) => (
              <li key={channel.channel}>
                <strong>{channel.channel}</strong>
                <span>{currency(channel.cost)} · {number(channel.conversions)} conversões · CPA {currency(channel.cpa)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="section-card">
        <div className="section-card__header">
          <div>
            <span>Performance</span>
            <h2>Resumo por canal</h2>
          </div>
          <p>Métricas consolidadas para leitura operacional.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Investimento</th>
                <th>Conversões</th>
                {showRevenue ? <th>Receita</th> : null}
                <th>CPA</th>
                {showRevenue ? <th>ROAS</th> : null}
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.channel}>
                  <td><strong>{channel.channel}</strong></td>
                  <td>{currency(channel.cost)}</td>
                  <td>{number(channel.conversions)}</td>
                  {showRevenue ? <td>{currency(channel.revenue)}</td> : null}
                  <td>{currency(channel.cpa)}</td>
                  {showRevenue ? <td>{decimal(channel.roas, 2)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
