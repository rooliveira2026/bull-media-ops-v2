import { useEffect, useState } from "react";
import { BarChart3, LineChart, Target, TrendingUp } from "lucide-react";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { currency, decimal, number } from "../../shared/utils/format";
import { getChannelSummary, getMediaOverview } from "./api/media-ops-repository";
import type { ChannelSummary, MediaOverview } from "./types";

export function MediaOpsPage() {
  const [overview, setOverview] = useState<MediaOverview | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);

  useEffect(() => {
    getMediaOverview({ period: "last_30d" }).then(setOverview);
    getChannelSummary(undefined, "last_30d").then(setChannels);
  }, []);

  const summary = overview?.summary;

  return (
    <section>
      <PageHeader
        eyebrow="Media Ops"
        title="Performance por Cliente"
        description="Leitura de mídia paga baseada em métricas normalizadas e endpoints futuros por domínio."
        meta="Repository modular"
      />
      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Investimento total" value={currency(summary?.cost ?? 0)} icon={BarChart3} />
        <KpiCard label="Conversões" value={number(summary?.conversions ?? 0)} icon={Target} tone="success" />
        <KpiCard label="Receita" value={currency(summary?.revenue ?? 0)} icon={LineChart} tone="success" />
        <KpiCard label="ROAS" value={decimal(summary?.roas ?? 0, 2)} icon={TrendingUp} tone="primary" />
      </div>

      <div className="section-card">
        <div className="section-card__header">
          <div>
            <span>Media Ops</span>
            <h2>Resumo por canal</h2>
          </div>
          <p>Fonte atual: fixture V1 normalizado no importador mockável.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Investimento</th>
                <th>Conversões</th>
                <th>Receita</th>
                <th>CPA</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.channel}>
                  <td><strong>{channel.channel}</strong></td>
                  <td>{currency(channel.cost)}</td>
                  <td>{number(channel.conversions)}</td>
                  <td>{currency(channel.revenue)}</td>
                  <td>{currency(channel.cpa)}</td>
                  <td>{decimal(channel.roas, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
