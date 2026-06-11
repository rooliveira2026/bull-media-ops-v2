import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Database, Plug, ShieldCheck } from "lucide-react";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { getDataSourcesOverview } from "./api/data-sources-repository";
import type { DataSourcesOverview, DataSourceStatus } from "./types";

const statusLabels: Record<DataSourceStatus | "attention", string> = {
  not_connected: "Não conectado",
  prepared: "Preparado",
  pending_credentials: "Aguardando credenciais",
  connected: "Conectado",
  validating: "Em validação",
  error: "Atenção necessária",
  attention: "Atenção necessária",
};

function formatDate(value: string | null) {
  if (!value) return "Aguardando primeira importação";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function IntegrationsPage() {
  const [overview, setOverview] = useState<DataSourcesOverview | null>(null);

  useEffect(() => {
    getDataSourcesOverview().then(setOverview);
  }, []);

  const stats = useMemo(() => {
    const sources = overview?.sources ?? [];
    return {
      prepared: sources.filter((source) => source.status === "prepared").length,
      validating: sources.filter((source) => source.status === "validating").length,
      pending: sources.filter((source) => source.status === "pending_credentials" || source.status === "not_connected").length,
      logs: overview?.qualityLogs.length ?? 0,
    };
  }, [overview]);

  const sources = overview?.sources ?? [];
  const batches = overview?.batches ?? [];
  const logs = overview?.qualityLogs ?? [];

  return (
    <section>
      <PageHeader
        eyebrow="Data Sources"
        title="Fontes de dados e importações"
        description="Fundação para origens oficiais futuras, com ponte controlada da V1 via JSON normalizado."
        meta="Sem conexão externa ativa"
      />

      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Fontes preparadas" value={String(stats.prepared)} icon={Plug} tone="primary" />
        <KpiCard label="Em validação" value={String(stats.validating)} icon={Clock3} tone="warning" />
        <KpiCard label="Aguardando credenciais" value={String(stats.pending)} icon={ShieldCheck} />
        <KpiCard label="Logs de qualidade" value={String(stats.logs)} icon={AlertCircle} tone="warning" />
      </div>

      <div className="section-card">
        <div className="section-card__header">
          <div><span>Fontes</span><h2>Status por origem</h2></div>
          <p>As APIs oficiais ficam preparadas para sprints futuras; a V1 entra apenas como exportação controlada.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Origem</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Última sincronização</th>
                <th>Conta</th>
                <th>Próximo passo</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td><strong>{source.sourceName}</strong><small>{source.sourceType}</small></td>
                  <td>{source.clientName ?? "Organização"}</td>
                  <td><span className="badge">{statusLabels[source.status]}</span></td>
                  <td>{formatDate(source.lastSyncedAt)}</td>
                  <td>{source.accountName ?? "A definir"}</td>
                  <td><small>{String(source.metadata.nextStep ?? "Preparar credenciais e validação de dados.")}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="integration-grid integration-grid--split">
        <div className="section-card">
          <div className="section-card__header">
            <div><span>Import batches</span><h2>Histórico controlado</h2></div>
            <p>Resumo idempotente para reprocessar sem duplicar.</p>
          </div>
          <ul className="simple-list">
            {batches.length === 0 ? <li><strong>Nenhum batch ainda</strong><span>Fonte preparada, aguardando primeira importação.</span></li> : null}
            {batches.map((batch) => (
              <li key={batch.id}>
                <strong>{batch.sourceType} · {statusLabels[batch.status === "failed" ? "attention" : "connected"]}</strong>
                <span>{batch.recordsImported} importados · {batch.recordsSkipped} agrupados ou ignorados · checksum {batch.checksum ?? "a definir"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div><span>Qualidade</span><h2>Validações recentes</h2></div>
            <p>Dados sensíveis passam por normalização antes de entrar nas telas.</p>
          </div>
          <ul className="simple-list">
            {logs.length === 0 ? <li><strong>Sem logs recentes</strong><span>As fontes estão preparadas para a primeira validação.</span></li> : null}
            {logs.map((log) => (
              <li key={log.id}>
                <strong>{log.severity === "attention" ? "Atenção estratégica" : log.severity}</strong>
                <span>{log.message}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="section-card">
          <div className="section-card__header">
            <div><span>Arquitetura</span><h2>Próxima evolução</h2></div>
            <p>APIs oficiais entram fonte por fonte.</p>
          </div>
          <ul className="simple-list">
            <li><strong><Database size={15} /> Supabase staging</strong><span>Persistência de fontes, batches e logs de qualidade.</span></li>
            <li><strong><CheckCircle2 size={15} /> Ponte V1</strong><span>JSON exportado, normalizado e agrupado antes de persistir.</span></li>
            <li><strong><Plug size={15} /> APIs oficiais</strong><span>Preparadas para conexão futura sem reescrever frontend.</span></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
