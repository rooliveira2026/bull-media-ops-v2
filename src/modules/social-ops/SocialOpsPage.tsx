import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  FileCheck2,
  Link2,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { KpiCard } from "../../shared/components/KpiCard";
import { PageHeader } from "../../shared/components/PageHeader";
import type { AuditLog, Client } from "../../shared/types/core";
import {
  addSocialPostComment,
  createSocialApprovalBatch,
  createSocialPost,
  listSocialApprovalBatches,
  listSocialClients,
  listSocialPillars,
  listSocialPostApprovals,
  listSocialPostAuditEvents,
  listSocialPostComments,
  listSocialPosts,
  revokeSocialApprovalBatch,
  updateSocialPost,
  updateSocialPostStatus,
} from "./api/social-ops-repository";
import type {
  SocialApprovalBatch,
  SocialChannel,
  SocialPillar,
  SocialPost,
  SocialPostApproval,
  SocialPostComment,
  SocialPostFormat,
  SocialPostInput,
  SocialPostStatus,
} from "./types";

const channelLabels: Record<SocialChannel, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const formatLabels: Record<SocialPostFormat, string> = {
  feed: "Feed",
  reels: "Reels",
  stories: "Stories",
  carousel: "Carrossel",
  article: "Artigo",
};

const statusLabels: Record<SocialPostStatus, string> = {
  draft: "Rascunho",
  internal_review: "Revisão interna",
  sent_for_approval: "Enviado ao cliente",
  changes_requested: "Ajustes solicitados",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
  cancelled: "Cancelado",
  in_production: "Em produção",
  ready: "Pronto",
  paused: "Pausado",
};

const workflowStatuses: SocialPostStatus[] = [
  "draft",
  "internal_review",
  "sent_for_approval",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "cancelled",
];

const blankForm = {
  clientId: "",
  pillarId: "",
  title: "",
  channel: "instagram" as SocialChannel,
  format: "feed" as SocialPostFormat,
  scheduledDate: new Date().toISOString().slice(0, 10),
  status: "draft" as SocialPostStatus,
  copy: "",
  assetUrl: "",
};

export function SocialOpsPage() {
  const { profile, user } = useAuth();
  const profileId = profile?.id ?? user?.id ?? null;
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [pillars, setPillars] = useState<SocialPillar[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [batches, setBatches] = useState<SocialApprovalBatch[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [approvalLink, setApprovalLink] = useState("");
  const [notice, setNotice] = useState("");
  const [clientId, setClientId] = useState("all");
  const [channel, setChannel] = useState<SocialChannel | "all">("all");
  const [status, setStatus] = useState<SocialPostStatus | "all">("all");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [search, setSearch] = useState("");

  async function refresh() {
    const [clientData, pillarData, postData, batchData] = await Promise.all([
      listSocialClients(),
      listSocialPillars(),
      listSocialPosts({ clientId, channel, status, periodStart, periodEnd, search }),
      listSocialApprovalBatches(clientId),
    ]);
    setClients(clientData);
    setPillars(pillarData);
    setPosts(postData);
    setBatches(batchData);
    setSelectedPost((current) => (current ? postData.find((post) => post.id === current.id) ?? current : null));
    setSelectedPostIds((current) => current.filter((postId) => postData.some((post) => post.id === postId)));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, channel, status, periodStart, periodEnd, search]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      review: posts.filter((post) => post.status === "internal_review").length,
      sent: posts.filter((post) => post.status === "sent_for_approval").length,
      approved: posts.filter((post) => post.status === "approved").length,
      scheduled: posts.filter((post) => post.status === "scheduled").length,
      adjustments: posts.filter((post) => post.status === "changes_requested").length,
    };
  }, [posts]);

  const calendarDays = useMemo(() => {
    const byDay = new Map<string, SocialPost[]>();
    posts.forEach((post) => {
      byDay.set(post.scheduledDate, [...(byDay.get(post.scheduledDate) ?? []), post]);
    });
    return Array.from(byDay.entries())
      .map(([date, items]) => ({ date, posts: items.sort((a, b) => a.title.localeCompare(b.title)) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [posts]);

  const selectedPosts = posts.filter((post) => selectedPostIds.includes(post.id));
  const selectedClientIds = Array.from(new Set(selectedPosts.map((post) => post.clientId)));
  const canSendBatch = selectedPostIds.length > 0 && selectedClientIds.length === 1;

  function togglePost(postId: string) {
    setSelectedPostIds((current) => current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]);
  }

  async function savePost(input: Omit<SocialPostInput, "organizationId">) {
    const client = clients.find((item) => item.id === input.clientId);
    if (!client) {
      setNotice("Selecione um cliente válido.");
      return;
    }

    if (editingPost) {
      await updateSocialPost(editingPost.id, { ...input, organizationId: client.organizationId }, profileId);
      setEditingPost(null);
    } else {
      await createSocialPost({ ...input, organizationId: client.organizationId }, profileId);
      setIsCreating(false);
    }

    setNotice("Post salvo.");
    await refresh();
  }

  async function sendSelectedForApproval() {
    if (!canSendBatch) {
      setNotice("Selecione posts de um único cliente para gerar o lote.");
      return;
    }

    const batch = await createSocialApprovalBatch({
      clientId: selectedClientIds[0],
      postIds: selectedPostIds,
      createdBy: profileId,
    });

    setApprovalLink(batch.approvalUrl ?? "");
    setNotice("Lote enviado para aprovação. Link seguro gerado.");
    setSelectedPostIds([]);
    await refresh();
  }

  async function copyApprovalLink(link = approvalLink) {
    if (!link) return;
    await navigator.clipboard?.writeText(link);
    setNotice("Link copiado.");
  }

  async function updateStatus(postId: string, nextStatus: SocialPostStatus) {
    await updateSocialPostStatus(postId, nextStatus, { profileId, note: `Status atualizado para ${statusLabels[nextStatus]}.` });
    await refresh();
  }

  async function revokeBatch(batchId: string) {
    await revokeSocialApprovalBatch(batchId, profileId);
    setNotice("Lote revogado.");
    await refresh();
  }

  return (
    <section>
      <PageHeader
        eyebrow="Social Ops"
        title="Aprovação de posts"
        description="Criação, envio ao cliente, comentários, aprovação e histórico do calendário social."
        meta="V2.1"
      />

      <div className="kpi-grid kpi-grid--compact">
        <KpiCard label="Posts no ciclo" value={String(stats.total)} icon={CalendarDays} tone="primary" />
        <KpiCard label="Revisão interna" value={String(stats.review)} icon={Clock3} tone="warning" />
        <KpiCard label="Enviados ao cliente" value={String(stats.sent)} icon={Send} tone="primary" />
        <KpiCard label="Ajustes solicitados" value={String(stats.adjustments)} icon={SlidersHorizontal} tone="warning" />
        <KpiCard label="Aprovados" value={String(stats.approved)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Agendados" value={String(stats.scheduled)} icon={FileCheck2} />
      </div>

      <div className="social-toolbar">
        <button className="primary-action" onClick={() => { setIsCreating(true); setEditingPost(null); }} type="button">
          <Plus size={16} /> Criar post
        </button>
        <button className="primary-action primary-action--secondary" disabled={!canSendBatch} onClick={sendSelectedForApproval} type="button">
          <Link2 size={16} /> Enviar lote selecionado
        </button>
        {approvalLink ? (
          <button className="inline-action" onClick={() => copyApprovalLink()} type="button">
            <Copy size={14} /> Copiar último link
          </button>
        ) : null}
        {notice ? <span className="social-notice">{notice}</span> : null}
      </div>

      <div className="filter-bar social-filter-bar">
        <label><span>Cliente</span><select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="all">Todos</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
        <label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as SocialPostStatus | "all")}><option value="all">Todos</option>{workflowStatuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}</select></label>
        <label><span>Canal</span><select value={channel} onChange={(event) => setChannel(event.target.value as SocialChannel | "all")}><option value="all">Todos</option>{Object.entries(channelLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
        <label><span>Início</span><input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></label>
        <label><span>Fim</span><input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></label>
        <label className="filter-bar__search"><span>Busca</span><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título, cliente ou copy" /></div></label>
      </div>

      <div className="social-layout">
        <section className="section-card">
          <div className="section-card__header">
            <div>
              <span>Calendário</span>
              <h2>Publicações por data</h2>
              <p>Status atualizado conforme aprovação do cliente.</p>
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
                    <button className="calendar-post" key={post.id} onClick={() => setSelectedPost(post)} type="button">
                      <strong>{post.title}</strong>
                      <span>{post.clientName} · {channelLabels[post.channel]} · {statusLabels[post.status]}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
            {calendarDays.length === 0 ? <div className="empty-panel empty-panel--left"><strong>Nenhum post no período</strong><p>Crie o primeiro post ou ajuste os filtros.</p></div> : null}
          </div>
        </section>

        <aside className="section-card">
          <div className="section-card__header">
            <div>
              <span>Lotes</span>
              <h2>Links de aprovação</h2>
              <p>Tokens expiráveis e revogáveis por cliente.</p>
            </div>
          </div>
          <ul className="simple-list">
            {batches.slice(0, 6).map((batch) => (
              <li key={batch.id}>
                <strong>{batch.clientName}</strong>
                <span>{batch.postIds.length} posts · {batch.status} · expira em {formatDateTime(batch.expiresAt)}</span>
                {batch.status === "active" ? <button className="inline-action" onClick={() => revokeBatch(batch.id)} type="button">Revogar</button> : null}
              </li>
            ))}
            {batches.length === 0 ? <li><span>Nenhum lote criado ainda.</span></li> : null}
          </ul>
        </aside>
      </div>

      <div className="social-post-list">
        {posts.map((post) => (
          <article className="action-card action-card--dense" key={post.id}>
            <div className="social-post-select">
              <input checked={selectedPostIds.includes(post.id)} onChange={() => togglePost(post.id)} type="checkbox" />
            </div>
            <div className="action-card__main">
              <div>
                <span>{post.clientName} · {channelLabels[post.channel]} · {formatLabels[post.format]}</span>
                <h2>{post.title}</h2>
                <p>{post.copy}</p>
              </div>
              <span className={`badge badge--social-status-${post.status}`}>{statusLabels[post.status]}</span>
            </div>
            <div className="action-card__meta">
              <span>{formatDay(post.scheduledDate)}</span>
              <span>Versão {post.version}</span>
              <span>{post.assetUrl ? "Arte vinculada" : "Arte pendente"}</span>
              <span>{post.approvedByName ? `Aprovador: ${post.approvedByName}` : "Sem decisão final"}</span>
            </div>
            <div className="action-card__next">
              <strong>Próxima etapa:</strong> {nextStep(post)}
            </div>
            <div className="action-card__controls">
              <button className="inline-action" onClick={() => setSelectedPost(post)} type="button">Abrir</button>
              <button className="inline-action" onClick={() => { setEditingPost(post); setIsCreating(false); }} type="button">Editar</button>
              {post.status === "approved" ? <button className="inline-action" onClick={() => updateStatus(post.id, "scheduled")} type="button">Agendar</button> : null}
              {post.status === "scheduled" ? <button className="inline-action" onClick={() => updateStatus(post.id, "published")} type="button">Marcar publicado</button> : null}
              {post.status !== "cancelled" ? <button className="inline-action" onClick={() => updateStatus(post.id, "cancelled")} type="button">Cancelar</button> : null}
            </div>
          </article>
        ))}
      </div>

      {isCreating || editingPost ? (
        <SocialPostForm
          clients={clients}
          pillars={pillars}
          post={editingPost}
          onClose={() => { setIsCreating(false); setEditingPost(null); }}
          onSave={savePost}
        />
      ) : null}

      {selectedPost ? (
        <SocialPostDrawer
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onComment={async (body) => {
            await addSocialPostComment(selectedPost.id, body, profileId);
            await refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function SocialPostForm({
  clients,
  pillars,
  post,
  onClose,
  onSave,
}: {
  clients: Client[];
  pillars: SocialPillar[];
  post: SocialPost | null;
  onClose: () => void;
  onSave: (input: Omit<SocialPostInput, "organizationId">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    ...blankForm,
    clientId: post?.clientId ?? clients[0]?.id ?? "",
    pillarId: post?.pillarId ?? "",
    title: post?.title ?? "",
    channel: post?.channel ?? "instagram",
    format: post?.format ?? "feed",
    scheduledDate: post?.scheduledDate ?? blankForm.scheduledDate,
    status: post?.status ?? "draft",
    copy: post?.copy ?? "",
    assetUrl: post?.assetUrl ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="action-modal social-post-form" onSubmit={submit}>
        <div className="action-modal__header">
          <div>
            <span>Social Ops</span>
            <h2>{post ? "Editar post" : "Criar post"}</h2>
          </div>
          <button className="modal-close" onClick={onClose} type="button">Fechar</button>
        </div>
        <div className="form-grid">
          <label><span>Cliente</span><select required value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
          <label><span>Pilar</span><select value={form.pillarId} onChange={(event) => setForm({ ...form, pillarId: event.target.value })}><option value="">A definir</option>{pillars.map((pillar) => <option value={pillar.id} key={pillar.id}>{pillar.name}</option>)}</select></label>
          <label><span>Canal</span><select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as SocialChannel })}>{Object.entries(channelLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          <label><span>Formato</span><select value={form.format} onChange={(event) => setForm({ ...form, format: event.target.value as SocialPostFormat })}>{Object.entries(formatLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          <label><span>Data prevista</span><input required type="date" value={form.scheduledDate} onChange={(event) => setForm({ ...form, scheduledDate: event.target.value })} /></label>
          <label><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as SocialPostStatus })}>{workflowStatuses.map((item) => <option value={item} key={item}>{statusLabels[item]}</option>)}</select></label>
          <label className="field-wide"><span>Título</span><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label className="field-wide"><span>URL da arte</span><input placeholder="https://..." value={form.assetUrl} onChange={(event) => setForm({ ...form, assetUrl: event.target.value })} /></label>
          <label className="field-wide"><span>Copy</span><textarea required value={form.copy} onChange={(event) => setForm({ ...form, copy: event.target.value })} /></label>
        </div>
        <div className="modal-actions">
          <button className="primary-action" disabled={saving || !form.clientId} type="submit">{saving ? "Salvando..." : "Salvar post"}</button>
        </div>
      </form>
    </div>
  );
}

function SocialPostDrawer({
  post,
  onClose,
  onComment,
}: {
  post: SocialPost;
  onClose: () => void;
  onComment: (body: string) => Promise<void>;
}) {
  const [approvals, setApprovals] = useState<SocialPostApproval[]>([]);
  const [comments, setComments] = useState<SocialPostComment[]>([]);
  const [events, setEvents] = useState<AuditLog[]>([]);
  const [commentBody, setCommentBody] = useState("");

  useEffect(() => {
    Promise.all([
      listSocialPostApprovals(post.id),
      listSocialPostComments(post.id),
      listSocialPostAuditEvents(post.id),
    ]).then(([approvalData, commentData, eventData]) => {
      setApprovals(approvalData);
      setComments(commentData);
      setEvents(eventData);
    });
  }, [post.id]);

  async function submitComment() {
    if (!commentBody.trim()) return;
    await onComment(commentBody.trim());
    setCommentBody("");
    setComments(await listSocialPostComments(post.id));
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="action-modal social-post-drawer">
        <div className="action-modal__header">
          <div>
            <span>{post.clientName} · {channelLabels[post.channel]}</span>
            <h2>{post.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} type="button">Fechar</button>
        </div>
        <div className="social-drawer-grid">
          <div className="section-card">
            <div className="section-card__header"><div><span>Conteúdo</span><h2>Post</h2></div></div>
            <div className="detail-grid">
              <Detail label="Status" value={statusLabels[post.status]} />
              <Detail label="Data prevista" value={formatDay(post.scheduledDate)} />
              <Detail label="Formato" value={formatLabels[post.format]} />
              <Detail label="Versão" value={String(post.version)} />
            </div>
            <p className="social-copy-preview">{post.copy}</p>
            {post.assetUrl ? <a className="asset-preview" href={post.assetUrl} rel="noreferrer" target="_blank">Abrir arte</a> : <span className="asset-preview asset-preview--empty">Arte não vinculada</span>}
          </div>

          <div className="section-card">
            <div className="section-card__header"><div><span>Decisão</span><h2>Aprovação</h2></div></div>
            <ul className="simple-list">
              {approvals.map((approval) => (
                <li key={approval.id}>
                  <strong>{approval.decision === "changes_requested" ? "Ajustes solicitados" : approval.status}</strong>
                  <span>{approval.approverName ?? "Time interno"} · {formatDateTime(approval.createdAt)}</span>
                  <span>{approval.note ?? "Sem observação."}</span>
                </li>
              ))}
              {approvals.length === 0 ? <li><span>Nenhuma decisão registrada.</span></li> : null}
            </ul>
          </div>

          <div className="section-card">
            <div className="section-card__header"><div><span>Comentários</span><h2>Internos e externos</h2></div></div>
            <div className="comment-box">
              <textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Adicionar comentário interno" />
              <button className="inline-action" onClick={submitComment} type="button">Adicionar comentário</button>
            </div>
            <ul className="simple-list">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.visibility === "external" ? "Cliente" : "Interno"} · {comment.authorName ?? "Sem identificação"}</strong>
                  <span>{comment.body}</span>
                  <span>{formatDateTime(comment.createdAt)}</span>
                </li>
              ))}
              {comments.length === 0 ? <li><span>Nenhum comentário registrado.</span></li> : null}
            </ul>
          </div>

          <div className="section-card">
            <div className="section-card__header"><div><span>Histórico</span><h2>Auditoria</h2></div></div>
            <div className="history-list">
              {events.map((event) => <div key={event.id}><strong>{event.actionKey}</strong><span>{formatDateTime(event.createdAt)}</span></div>)}
              {events.length === 0 ? <p>Nenhum evento interno carregado.</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span>{label}</span><strong>{value}</strong></div>;
}

function nextStep(post: SocialPost) {
  if (post.status === "draft") return "Completar conteúdo e mover para revisão interna.";
  if (post.status === "internal_review") return "Selecionar no lote e enviar ao cliente.";
  if (post.status === "sent_for_approval") return "Aguardar decisão do cliente.";
  if (post.status === "changes_requested") return "Aplicar ajustes e reenviar para aprovação.";
  if (post.status === "approved") return "Agendar publicação manualmente.";
  if (post.status === "scheduled") return "Publicar manualmente e registrar status.";
  if (post.status === "published") return "Manter histórico disponível.";
  if (post.status === "cancelled") return "Sem ação pendente.";
  return "Acompanhar calendário editorial.";
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
