import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardCheck, Eye, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { mockModuleAccess, mockRoles, mockUsers } from "../../shared/api/mock-data";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { canPerformModuleAction } from "../../shared/permissions/permissions";
import { decimal } from "../../shared/utils/format";
import { listClients } from "../core/api/core-repository";
import {
  approveRecommendedAction,
  dismissRecommendedAction,
  executeRecommendedAction,
  listActionAuditEvents,
  listActionExecutions,
  listRecommendedActions,
  markActionMonitoring,
  moveActionToReview,
  registerActionResult,
  reopenRecommendedAction,
} from "./api/media-ops-repository";
import type {
  ActionExecution,
  RecommendedAction,
  RecommendedActionPriority,
  RecommendedActionStatus,
} from "./types";
import type { AuditLog, Client, ModuleAction } from "../../shared/types/core";

const statusLabels: Record<RecommendedActionStatus, string> = {
  suggested: "Sugerida",
  in_review: "Em avaliação",
  approved: "Aprovada",
  executed: "Executada",
  monitoring: "Monitoramento",
  dismissed: "Descartada",
};

const priorityLabels: Record<RecommendedActionPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

type TabKey = "summary" | "curation" | "execution" | "history";

const currentUser = mockUsers[0];

function can(actionKey: ModuleAction) {
  return canPerformModuleAction(currentUser, "media_ops", actionKey, mockRoles, mockModuleAccess);
}

export function ActionsCenter() {
  const { user } = useAuth();
  const [actions, setActions] = useState<RecommendedAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<RecommendedAction | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [clientId, setClientId] = useState("all");
  const [channel, setChannel] = useState("all");
  const [priority, setPriority] = useState<RecommendedActionPriority | "all">("all");
  const [status, setStatus] = useState<RecommendedActionStatus | "all">("all");
  const [platform, setPlatform] = useState("all");
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const currentProfileId = user?.id ?? currentUser.id;

  useEffect(() => {
    listClients().then(setClients);
  }, []);

  async function refreshActions() {
    const data = await listRecommendedActions({
      clientId: clientId === "all" ? undefined : clientId,
      channel: channel === "all" ? undefined : channel,
      sourcePlatform: platform === "all" ? undefined : platform,
      priority: priority === "all" ? undefined : priority,
      status,
      search,
    });
    setActions(data);
    setSelectedAction((current) => {
      if (!current) return null;
      return data.find((action) => action.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    refreshActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, channel, priority, status, platform, search]);

  const stats = useMemo(() => {
    return {
      total: actions.length,
      review: actions.filter((action) => action.status === "in_review" || action.status === "suggested").length,
      approved: actions.filter((action) => action.status === "approved").length,
      executed: actions.filter((action) => action.status === "executed").length,
      monitoring: actions.filter((action) => action.status === "monitoring").length,
    };
  }, [actions]);

  const channels = Array.from(new Set(actions.map((action) => action.channel))).sort();
  const platforms = Array.from(new Set(actions.map((action) => action.sourcePlatform))).sort();

  async function runTransition(callback: () => Promise<unknown>) {
    await callback();
    await refreshActions();
  }

  function actionButtons(action: RecommendedAction) {
    switch (action.status) {
      case "suggested":
        return (
          <>
            <ActionButton disabled={!can("move_action_to_review")} onClick={() => runTransition(() => moveActionToReview(action.id, { profileId: currentProfileId, note: "Ação em avaliação pelo time." }))}>Avaliar</ActionButton>
            <ActionButton disabled={!can("approve_recommended_action")} onClick={() => runTransition(() => approveRecommendedAction(action.id, { profileId: currentProfileId, curationNote: "Aprovada para próxima etapa." }))}>Aprovar</ActionButton>
            <ActionButton disabled={!can("dismiss_recommended_action")} onClick={() => runTransition(() => dismissRecommendedAction(action.id, "Ação descartada após curadoria.", currentProfileId))}>Descartar</ActionButton>
          </>
        );
      case "in_review":
        return (
          <>
            <ActionButton disabled={!can("approve_recommended_action")} onClick={() => runTransition(() => approveRecommendedAction(action.id, { profileId: currentProfileId, curationNote: "Aprovada após avaliação interna." }))}>Aprovar</ActionButton>
            <ActionButton disabled={!can("dismiss_recommended_action")} onClick={() => runTransition(() => dismissRecommendedAction(action.id, "Ação sem prioridade no ciclo atual.", currentProfileId))}>Descartar</ActionButton>
            <ActionButton disabled={!can("move_action_to_review")} onClick={() => runTransition(() => moveActionToReview(action.id, { profileId: currentProfileId, note: "Observação atualizada na curadoria." }))}>Editar observação</ActionButton>
          </>
        );
      case "approved":
        return (
          <>
            <ActionButton disabled={!can("execute_recommended_action")} onClick={() => runTransition(() => executeRecommendedAction(action.id, { profileId: currentProfileId, executedBy: currentProfileId, executionNote: "Ação executada pela plataforma.", recheckAt: "2026-06-23T12:00:00.000Z" }))}>Marcar como executada</ActionButton>
            <ActionButton disabled={!can("move_action_to_review")} onClick={() => runTransition(() => moveActionToReview(action.id, { profileId: currentProfileId, note: "Ação voltou para avaliação." }))}>Voltar para avaliação</ActionButton>
          </>
        );
      case "executed":
        return (
          <>
            <ActionButton disabled={!can("mark_action_monitoring")} onClick={() => runTransition(() => markActionMonitoring(action.id, { profileId: currentProfileId, impactAssessment: "Acompanhar variação da métrica nos próximos dias.", recheckAt: "2026-06-30T12:00:00.000Z" }))}>Colocar em monitoramento</ActionButton>
            <ActionButton onClick={() => { setSelectedAction(action); setActiveTab("history"); }}>Ver histórico</ActionButton>
          </>
        );
      case "monitoring":
        return (
          <>
            <ActionButton disabled={!can("register_action_result")} onClick={() => runTransition(() => registerActionResult(action.id, { profileId: currentProfileId, impactAssessment: "Resultado registrado para fechamento do ciclo.", afterValue: action.beforeValue ? action.beforeValue * 0.92 : null }))}>Registrar resultado</ActionButton>
            <ActionButton disabled={!can("register_action_result")} onClick={() => runTransition(() => registerActionResult(action.id, { profileId: currentProfileId, impactAssessment: "Monitoramento encerrado com aprendizado documentado." }))}>Encerrar monitoramento</ActionButton>
          </>
        );
      case "dismissed":
        return (
          <ActionButton disabled={!can("move_action_to_review")} onClick={() => runTransition(() => reopenRecommendedAction(action.id, "Ação reaberta para avaliação.", currentProfileId))}>Reabrir avaliação</ActionButton>
        );
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="Media Ops"
        title="Central de Ações"
        description="Curadoria de recomendações estratégicas com priorização, aprovação e execução acompanhada."
        meta="Operação"
      />

      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Total de ações" value={String(stats.total)} icon={ShieldCheck} tone="primary" />
        <KpiCard label="Em avaliação" value={String(stats.review)} icon={Eye} tone="warning" />
        <KpiCard label="Aprovadas" value={String(stats.approved)} icon={ClipboardCheck} tone="primary" />
        <KpiCard label="Executadas" value={String(stats.executed)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Em monitoramento" value={String(stats.monitoring)} icon={CalendarClock} tone="warning" />
      </div>

      <div className="filter-bar">
        <label><span>Cliente</span><select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="all">Todos</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
        <label><span>Canal</span><select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="all">Todos</option>{channels.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label><span>Prioridade</span><select value={priority} onChange={(event) => setPriority(event.target.value as RecommendedActionPriority | "all")}><option value="all">Todas</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option></select></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as RecommendedActionStatus | "all")}><option value="all">Todos</option>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label><span>Plataforma</span><select value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="all">Todas</option>{platforms.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label className="filter-bar__search"><span>Busca</span><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título, cliente ou canal" /></div></label>
      </div>

      <div className="action-list">
        {actions.length === 0 ? (
          <div className="empty-panel">
            <h2>Nenhuma ação encontrada</h2>
            <p>Ajuste os filtros ou execute a primeira importação controlada para popular a Central de Ações.</p>
          </div>
        ) : null}
        {actions.map((action) => (
          <article className="action-card action-card--dense" key={action.id}>
            <div className="action-card__main">
              <div>
                <span>{action.clientName} · {action.channel} · {action.sourcePlatform}</span>
                <h2>{action.title}</h2>
                <p>{action.description}</p>
              </div>
              <span className={`badge badge--action-${action.status}`}>{statusLabels[action.status]}</span>
            </div>
            <div className="action-card__meta">
              <span className={`badge badge--priority-${action.priority}`}>{priorityLabels[action.priority]}</span>
              <span>{action.recommendationType ?? "Recomendação estratégica"}</span>
              <span>{action.expectedImpact}</span>
              <span>Esforço {action.effortLevel ?? "médio"}</span>
              <span>{action.affectedItemsCount ?? 1} ocorrências agrupadas</span>
              <span>{action.metricImpacted ?? "Métrica a validar"} {action.beforeValue !== null ? decimal(action.beforeValue, action.beforeValue < 1 ? 3 : 2) : ""}</span>
            </div>
            <div className="action-card__next">
              <strong>Próxima etapa:</strong> {nextStep(action.status)}
            </div>
            <div className="action-card__controls">
              <ActionButton onClick={() => { setSelectedAction(action); setActiveTab("summary"); }}>Abrir curadoria</ActionButton>
              {actionButtons(action)}
            </div>
          </article>
        ))}
      </div>

      {selectedAction ? (
        <ActionModal action={selectedAction} activeTab={activeTab} setActiveTab={setActiveTab} onClose={() => setSelectedAction(null)} />
      ) : null}
    </section>
  );
}

function nextStep(status: RecommendedActionStatus) {
  const map: Record<RecommendedActionStatus, string> = {
    suggested: "Avaliar recomendação e decidir aprovação ou descarte.",
    in_review: "Concluir curadoria interna.",
    approved: "Executar ação aprovada.",
    executed: "Acompanhar resultado e iniciar monitoramento.",
    monitoring: "Registrar resultado observado.",
    dismissed: "Reabrir caso volte a fazer sentido no ciclo.",
  };
  return map[status];
}

function ActionButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button className="inline-action" disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function ActionModal({ action, activeTab, setActiveTab, onClose }: { action: RecommendedAction; activeTab: TabKey; setActiveTab: (tab: TabKey) => void; onClose: () => void }) {
  const [executions, setExecutions] = useState<ActionExecution[]>([]);
  const [events, setEvents] = useState<AuditLog[]>([]);

  useEffect(() => {
    listActionExecutions(action.id).then(setExecutions);
    listActionAuditEvents(action.id).then(setEvents);
  }, [action.id]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="action-modal">
        <div className="action-modal__header">
          <div>
            <span>{action.clientName} · {action.channel}</span>
            <h2>{action.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} type="button">Fechar</button>
        </div>
        <div className="modal-tabs">
          <button className={activeTab === "summary" ? "active" : ""} onClick={() => setActiveTab("summary")} type="button">Resumo</button>
          <button className={activeTab === "curation" ? "active" : ""} onClick={() => setActiveTab("curation")} type="button">Curadoria</button>
          <button className={activeTab === "execution" ? "active" : ""} onClick={() => setActiveTab("execution")} type="button">Execução</button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")} type="button">Histórico</button>
        </div>
        <div className="modal-body">
          {activeTab === "summary" ? <SummaryTab action={action} /> : null}
          {activeTab === "curation" ? <CurationTab action={action} /> : null}
          {activeTab === "execution" ? <ExecutionTab action={action} /> : null}
          {activeTab === "history" ? <HistoryTab executions={executions} events={events} /> : null}
        </div>
      </div>
    </div>
  );
}

function SummaryTab({ action }: { action: RecommendedAction }) {
  return (
    <div className="detail-grid">
      <Detail label="Descrição" value={action.description} />
      <Detail label="Impacto esperado" value={action.expectedImpact} />
      <Detail label="Tipo de recomendação" value={action.recommendationType ?? "Recomendação estratégica"} />
      <Detail label="Esforço" value={action.effortLevel ?? "médio"} />
      <Detail label="Responsável pela decisão" value={action.decisionOwner ?? "A definir"} />
      <Detail label="Ocorrências agrupadas" value={String(action.affectedItemsCount ?? 1)} />
      <Detail label="Canal" value={`${action.channel} · ${action.sourcePlatform}`} />
      <Detail label="Cliente" value={action.clientName} />
      <Detail label="Métrica impactada" value={action.metricImpacted ?? "A validar"} />
      <div className="detail-item detail-item--full">
        <span>Ver detalhes</span>
        <ul className="compact-list">
          {(action.groupedOccurrences ?? []).map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}

function CurationTab({ action }: { action: RecommendedAction }) {
  return <div className="detail-grid"><Detail label="Nota interna" value={action.curationNote ?? "Sem nota de curadoria registrada."} /><Detail label="Motivo de aprovação" value={action.approvedAt ? `Aprovada em ${action.approvedAt}` : "Ainda não aprovada."} /><Detail label="Motivo de descarte" value={action.dismissedReason ?? "Não descartada."} /><Detail label="Responsável" value={action.approvedBy ?? "A definir"} /></div>;
}

function ExecutionTab({ action }: { action: RecommendedAction }) {
  return <div className="detail-grid"><Detail label="Observação da execução" value={action.impactAssessment ?? "Sem avaliação registrada."} /><Detail label="Data executada" value={action.executedAt ?? "Não executada."} /><Detail label="Reavaliar em" value={action.recheckAt ?? "Não definido."} /><Detail label="Resultado esperado" value={action.expectedImpact} /></div>;
}

function HistoryTab({ executions, events }: { executions: ActionExecution[]; events: AuditLog[] }) {
  return (
    <div className="history-list">
      {events.length === 0 && executions.length === 0 ? <p>Nenhum evento registrado para esta ação ainda.</p> : null}
      {events.map((event) => <div key={event.id}><strong>{event.actionKey}</strong><span>{event.createdAt}</span></div>)}
      {executions.map((execution) => <div key={execution.id}><strong>{execution.status}</strong><span>{execution.executionNote ?? "Execução registrada."}</span></div>)}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}
