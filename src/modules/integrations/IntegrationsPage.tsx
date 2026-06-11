import { Database, Plug } from "lucide-react";
import { PageHeader } from "../../shared/components/PageHeader";

const integrations = [
  { name: "Google Ads", category: "Mídia paga", status: "preparado", note: "Pipeline futuro para campanhas e métricas." },
  { name: "Meta Ads", category: "Mídia paga", status: "preparado", note: "Conexão futura para campanhas sociais pagas." },
  { name: "GA4", category: "Analytics", status: "aguardando credenciais", note: "Base para qualidade pós-clique e eventos." },
  { name: "LinkedIn Ads", category: "Mídia paga B2B", status: "preparado", note: "Planejado para ciclos B2B e demanda qualificada." },
  { name: "ClickUp", category: "Operações", status: "não conectado", note: "Pode sincronizar execução operacional em sprint futura." },
  { name: "Google Sheets legado", category: "Origem temporária", status: "em validação", note: "Somente como origem temporária de importação." },
  { name: "Supabase", category: "Banco operacional", status: "preparado", note: "Auth, RLS e repositories já estão estruturados." },
];

export function IntegrationsPage() {
  return (
    <section>
      <PageHeader
        eyebrow="Integrações"
        title="Conexões e pipelines"
        description="Área preparada para fontes de dados futuras, sem conexão externa ativa nesta etapa."
        meta="Preparado"
      />
<<<<<<< Updated upstream
      <div className="integration-grid">
        {integrations.map((integration) => (
          <article className="section-card integration-card" key={integration.name}>
            <div className="integration-card__icon">{integration.name === "Supabase" ? <Database size={18} /> : <Plug size={18} />}</div>
            <div>
              <span>{integration.category}</span>
              <h2>{integration.name}</h2>
              <p>{integration.note}</p>
              <span className="badge">{integration.status}</span>
            </div>
          </article>
        ))}
=======

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
              {sources.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <strong>Nenhuma fonte registrada</strong>
                    <small>Execute a primeira importação controlada da V1 ou mantenha o ambiente em modo mock para preview.</small>
                  </td>
                </tr>
              ) : null}
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
>>>>>>> Stashed changes
      </div>
    </section>
  );
}
