import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Layers3,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { mockClients, mockModuleAccess, mockRoles, mockUsers } from "../../shared/api/mock-data";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import { canPerformModuleAction } from "../../shared/permissions/permissions";
import type { AuditLog, ModuleAction } from "../../shared/types/core";
import {
  approveSocialPost,
  listSocialPillars,
  listSocialPostApprovals,
  listSocialPostAuditEvents,
  listSocialPosts,
  requestSocialPostAdjustments,
  submitSocialPost,
  updateSocialPostStatus,
} from "./api/social-ops-repository";
import type {
  SocialApprovalStatus,
  SocialChannel,
  SocialPillar,
  SocialPost,
  SocialPostApproval,
  SocialPostStatus,
} from "./types";

const currentUser = mockUsers[0];

const channelLabels: Record<SocialChannel, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const statusLabels: Record<SocialPostStatus, string> = {
  draft: "Rascunho",
  in_production: "Em produção",
  ready: "Pronto",
  scheduled: "Agendado",
  published: "Publicado",
  paused: "Pausado",
};

const approvalLabels: Record<SocialApprovalStatus, string> = {
  not_submitted: "Não enviado",
  submitted: "Em aprovação",
  approved: "Aprovado",
  adjustments_requested: "Ajustes solicitados",
};

type ModalTab = "summary" | "approval" | "history";

function can(actionKey: ModuleAction) {
  return canPerformModuleAction(currentUser, "social_ops", actionKey, mockRoles, mockModuleAccess);
}

export function SocialOpsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [pillars, setPillars] = useState<SocialPillar[]>([]);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [activeTab, setActiveTab] = useState<ModalTab>("summary");
  const [clientId, setClientId] = useState("all");
  const [channel, setChannel] = useState<SocialChannel | "all">("all");
  const [pillarId, setPillarId] = useState("all");
  const [status, setStatus] = useState<SocialPostStatus | "all">("all");
  const [approvalStatus, setApprovalStatus] = useState<SocialApprovalStatus | "all">("all");
  const [search, setSearch] = useState("");

  async function refreshPosts() {
    const [pillarData, postData] = await Promise.all([
      listSocialPillars(),
      listSocialPosts({
        clientId,
        channel,
        pillarId,
        status,
        approvalStatus,
        search,
      }),
    ]);
    setPillars(pillarData);
    setPosts(postData);
    setSelectedPost((current) => {
      if (!current) return null;
      return postData.find((post) => post.id === current.id) ?? current;
    });
  }

  useEffect(() => {
    refreshPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, channel, pillarId, status, approvalStatus, search]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      submitted: posts.filter((post) => post.approvalStatus === "submitted").length,
      approved: posts.filter((post) => post.approvalStatus === "approved").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      adjustments: posts.filter((post) => post.approvalStatus === "adjustments_requested").length,
    };
  }, [posts]);

  const calendarDays = useMemo(() => {
    const byDay = new Map<string, SocialPost[]>();
    posts.forEach((post) => {
      const current = byDay.get(post.scheduledDate) ?? [];
      current.push(post);
      byDay.set(post.scheduledDate, current);
    });
    return Array.from(byDay.entries())
      .map(([date, items]) => ({ date, posts: items.sort((a, b) => a.title.localeCompare(b.title)) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [posts]);

  async function runTransition(callback: () => Promise<unknown>) {
    await callback();
    await refreshPosts();
  }

  return (
    <section>
      <PageHeader
        eyebrow="Social Ops"
        title="Calendário editorial"
        description="Base operacional para posts, pilares, status, aprovação e auditoria do calendário social."
        meta="Sprint 4"
      />

      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Posts no ciclo" value={String(stats.total)} icon={CalendarDays} tone="primary" />
        <KpiCard label="Em aprovação" value={String(stats.submitted)} icon={Clock3} tone="warning" />
        <KpiCard label="Aprovados" value={String(stats.approved)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Agendados" value={String(stats.scheduled)} icon={FileCheck2} tone="primary" />
        <KpiCard label="Ajustes solicitados" value={String(stats.adjustments)} icon={SlidersHorizontal} tone="warning" />
      </div>

      <div className="filter-bar social-filter-bar">
        <label><span>Cliente</span><select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="all">Todos</option>{mockClients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
        <label><span>Canal</span><select value={channel} onChange={(event) => setChannel(event.target.value as SocialChannel | "all")}><option value="all">Todos</option>{Object.entries(channelLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label><span>Pilar</span><select value={pillarId} onChange={(event) => setPillarId(event.target.value)}><option value="all">Todos</option>{pillars.map((pillar) => <option value={pillar.id} key={pillar.id}>{pillar.name}</option>)}</select></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as SocialPostStatus | "all")}><option value="all">Todos</option>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label><span>Aprovação</span><select value={approvalStatus} onChange={(event) => setApprovalStatus(event.target.value as SocialApprovalStatus | "all")}><option value="all">Todas</option>{Object.entries(approvalLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label className="filter-bar__search"><span>Busca</span><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título, cliente ou pilar" /></div></label>
      </div>

      <div className="social-layout">
        <section className="section-card">
          <div className="section-card__header">
            <div>
              <span>Calendário</span>
              <h2>Próximas publicações</h2>
              <p>Visão por data com posts filtrados do ciclo atual.</p>
            </div>
          </div>
          <div className="social-calendar">
            {calendarDays.map((day) => (
              <article className="calendar-day" key={day.date}>
                <div className="calendar-day__date">
                  <strong>{formatDay(day.date)}</strong>
                  <span>{day.posts.length} item{day.posts.length > 1 ? "s" : ""}</span>
                </div>
                <div className="calendar-day__posts">
                  {day.posts.map((post) => (
                    <button className="calendar-post" key={post.id} onClick={() => { setSelectedPost(post); setActiveTab("summary"); }} type="button">
                      <strong>{post.title}</strong>
                      <span>{post.clientName} · {channelLabels[post.channel]} · {post.pillarName}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="section-card">
          <div className="section-card__header">
            <div>
              <span>Pilares</span>
              <h2>Estratégia editorial</h2>
              <p>Organização inicial dos temas do calendário.</p>
            </div>
          </div>
          <ul className="simple-list">
            {pillars.map((pillar) => (
              <li key={pillar.id}>
                <strong>{pillar.name}</strong>
                <span>{pillar.description}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="social-post-list">
        {posts.map((post) => (
          <article className="action-card action-card--dense" key={post.id}>
            <div className="action-card__main">
              <div>
                <span>{post.clientName} · {channelLabels[post.channel]} · {post.pillarName}</span>
                <h2>{post.title}</h2>
                <p>{post.copy}</p>
              </div>
              <span className={`badge badge--social-approval-${post.approvalStatus}`}>{approvalLabels[post.approvalStatus]}</span>
            </div>
            <div className="action-card__meta">
              <span className={`badge badge--social-status-${post.status}`}>{statusLabels[post.status]}</span>
              <span>{post.format}</span>
              <span>{formatDay(post.scheduledDate)}</span>
              <span>{post.ownerProfileId ?? "Responsável a definir"}</span>
            </div>
            <div className="action-card__next">
              <strong>Próxima etapa:</strong> {nextStep(post)}
            </div>
            <div className="action-card__controls">
              <SocialButton onClick={() => { setSelectedPost(post); setActiveTab("summary"); }}>Abrir post</SocialButton>
              {post.approvalStatus === "not_submitted" ? <SocialButton disabled={!can("submit_social_post")} onClick={() => runTransition(() => submitSocialPost(post.id, { profileId: currentUser.id, note: "Post enviado para aprovação." }))}>Enviar para aprovação</SocialButton> : null}
              {post.approvalStatus === "submitted" || post.approvalStatus === "adjustments_requested" ? (
                <>
                  <SocialButton disabled={!can("approve_social_post")} onClick={() => runTransition(() => approveSocialPost(post.id, { profileId: currentUser.id, note: "Aprovado para calendário." }))}>Aprovar</SocialButton>
                  <SocialButton disabled={!can("request_social_post_adjustments")} onClick={() => runTransition(() => requestSocialPostAdjustments(post.id, { profileId: currentUser.id, note: "Solicitar refinamento editorial." }))}>Solicitar ajustes</SocialButton>
                </>
              ) : null}
              {post.status !== "ready" ? <SocialButton disabled={!can("update_social_post_status")} onClick={() => runTransition(() => updateSocialPostStatus(post.id, "ready", { profileId: currentUser.id, note: "Post marcado como pronto." }))}>Marcar pronto</SocialButton> : null}
              {post.status !== "paused" ? <SocialButton disabled={!can("update_social_post_status")} onClick={() => runTransition(() => updateSocialPostStatus(post.id, "paused", { profileId: currentUser.id, note: "Post pausado para revisão de calendário." }))}>Pausar</SocialButton> : null}
            </div>
          </article>
        ))}
      </div>

      {selectedPost ? (
        <SocialPostModal post={selectedPost} activeTab={activeTab} setActiveTab={setActiveTab} onClose={() => setSelectedPost(null)} />
      ) : null}
    </section>
  );
}

function SocialButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button className="inline-action" disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function SocialPostModal({
  post,
  activeTab,
  setActiveTab,
  onClose,
}: {
  post: SocialPost;
  activeTab: ModalTab;
  setActiveTab: (tab: ModalTab) => void;
  onClose: () => void;
}) {
  const [approvals, setApprovals] = useState<SocialPostApproval[]>([]);
  const [events, setEvents] = useState<AuditLog[]>([]);

  useEffect(() => {
    listSocialPostApprovals(post.id).then(setApprovals);
    listSocialPostAuditEvents(post.id).then(setEvents);
  }, [post.id]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="action-modal">
        <div className="action-modal__header">
          <div>
            <span>{post.clientName} · {channelLabels[post.channel]}</span>
            <h2>{post.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} type="button">Fechar</button>
        </div>
        <div className="modal-tabs">
          <button className={activeTab === "summary" ? "active" : ""} onClick={() => setActiveTab("summary")} type="button">Resumo</button>
          <button className={activeTab === "approval" ? "active" : ""} onClick={() => setActiveTab("approval")} type="button">Aprovação</button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")} type="button">Histórico</button>
        </div>
        <div className="modal-body">
          {activeTab === "summary" ? <SummaryTab post={post} /> : null}
          {activeTab === "approval" ? <ApprovalTab post={post} approvals={approvals} /> : null}
          {activeTab === "history" ? <HistoryTab approvals={approvals} events={events} /> : null}
        </div>
      </div>
    </div>
  );
}

function SummaryTab({ post }: { post: SocialPost }) {
  return (
    <div className="detail-grid">
      <Detail label="Cliente" value={post.clientName} />
      <Detail label="Canal e formato" value={`${channelLabels[post.channel]} · ${post.format}`} />
      <Detail label="Pilar editorial" value={post.pillarName} />
      <Detail label="Data prevista" value={formatDay(post.scheduledDate)} />
      <Detail label="Status" value={statusLabels[post.status]} />
      <Detail label="Texto base" value={post.copy} />
    </div>
  );
}

function ApprovalTab({ post, approvals }: { post: SocialPost; approvals: SocialPostApproval[] }) {
  return (
    <div className="detail-grid">
      <Detail label="Status de aprovação" value={approvalLabels[post.approvalStatus]} />
      <Detail label="Responsável" value={post.ownerProfileId ?? "A definir"} />
      <Detail label="Última observação" value={approvals[0]?.note ?? "Sem observação registrada."} />
      <Detail label="Última movimentação" value={approvals[0] ? `${approvalLabels[approvals[0].status]} em ${approvals[0].createdAt}` : "Ainda sem movimentação."} />
    </div>
  );
}

function HistoryTab({ approvals, events }: { approvals: SocialPostApproval[]; events: AuditLog[] }) {
  return (
    <div className="history-list">
      {events.length === 0 && approvals.length === 0 ? <p>Nenhum evento registrado para este post ainda.</p> : null}
      {events.map((event) => <div key={event.id}><strong>{event.actionKey}</strong><span>{event.createdAt}</span></div>)}
      {approvals.map((approval) => <div key={approval.id}><strong>{approvalLabels[approval.status]}</strong><span>{approval.note ?? "Movimentação registrada."}</span></div>)}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}

function nextStep(post: SocialPost) {
  if (post.approvalStatus === "not_submitted") return "Enviar para aprovação interna.";
  if (post.approvalStatus === "submitted") return "Aprovar ou solicitar ajustes editoriais.";
  if (post.approvalStatus === "adjustments_requested") return "Refinar conteúdo e reenviar para avaliação.";
  if (post.status === "scheduled") return "Acompanhar calendário editorial.";
  if (post.status === "ready") return "Definir janela de agendamento.";
  if (post.status === "paused") return "Reavaliar prioridade no calendário.";
  return "Manter acompanhamento operacional.";
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00.000Z`));
}
