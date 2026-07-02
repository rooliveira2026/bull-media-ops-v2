import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, RotateCcw } from "lucide-react";
import {
  getPublicSocialApprovalBatch,
  submitPublicSocialApprovalDecision,
} from "./api/social-ops-repository";
import type { PublicSocialApprovalBatch, SocialPost } from "./types";

const emptyBatch: PublicSocialApprovalBatch = {
  status: "invalid",
  batch: null,
  posts: [],
  comments: [],
};

export function SocialApprovalPage({ token }: { token: string }) {
  const [batch, setBatch] = useState<PublicSocialApprovalBatch>(emptyBatch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submittingPostId, setSubmittingPostId] = useState<string | null>(null);

  async function loadBatch() {
    setIsLoading(true);
    setError("");
    try {
      setBatch(await getPublicSocialApprovalBatch(token));
    } catch (loadError) {
      console.warn("[social-approval] lote indisponível:", loadError);
      setError("Não foi possível carregar esta solicitação de aprovação.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const clientName = batch.posts[0]?.clientName ?? "Cliente";
  const active = batch.status === "active";
  const decidedCount = useMemo(
    () => batch.posts.filter((post) => ["approved", "changes_requested", "scheduled", "published"].includes(post.status)).length,
    [batch.posts],
  );

  async function submitDecision(post: SocialPost, decision: "approved" | "changes_requested") {
    if (!authorName.trim() || !authorEmail.trim()) {
      setError("Informe nome e e-mail para registrar a decisão.");
      return;
    }

    setSubmittingPostId(post.id);
    setError("");
    try {
      setBatch(await submitPublicSocialApprovalDecision({
        token,
        postId: post.id,
        decision,
        authorName,
        authorEmail,
        note: notes[post.id] ?? "",
      }));
    } catch (submitError) {
      console.warn("[social-approval] decisão indisponível:", submitError);
      setError("Não foi possível registrar a decisão. Atualize a página e tente novamente.");
    } finally {
      setSubmittingPostId(null);
    }
  }

  return (
    <main className="approval-page">
      <section className="approval-shell">
        <header className="approval-header">
          <div>
            <span>Bull Media Ops</span>
            <h1>Aprovação de posts</h1>
            <p>{clientName}</p>
          </div>
          <div className={`approval-status approval-status--${batch.status}`}>
            {statusLabel(batch.status)}
          </div>
        </header>

        {isLoading ? <div className="approval-state"><Clock3 size={22} /> Carregando solicitação...</div> : null}
        {error ? <div className="approval-error">{error}</div> : null}
        {!isLoading && batch.status === "invalid" ? <InvalidState title="Link inválido" text="Esta solicitação não foi encontrada ou o token informado não é válido." /> : null}
        {!isLoading && batch.status === "expired" ? <InvalidState title="Link expirado" text="Solicite um novo envio ao time responsável pelo calendário." /> : null}
        {!isLoading && batch.status === "revoked" ? <InvalidState title="Link revogado" text="Esta solicitação foi encerrada pelo time interno." /> : null}

        {!isLoading && (batch.status === "active" || batch.status === "used") ? (
          <>
            <div className="approval-summary">
              <div><span>Posts</span><strong>{batch.posts.length}</strong></div>
              <div><span>Decididos</span><strong>{decidedCount}</strong></div>
              <div><span>Expiração</span><strong>{batch.batch?.expiresAt ? formatDateTime(batch.batch.expiresAt) : "A validar"}</strong></div>
            </div>

            {active ? (
              <div className="approval-identity">
                <label><span>Seu nome</span><input value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="Nome do aprovador" /></label>
                <label><span>Seu e-mail</span><input type="email" value={authorEmail} onChange={(event) => setAuthorEmail(event.target.value)} placeholder="email@empresa.com" /></label>
              </div>
            ) : (
              <div className="approval-state approval-state--success"><CheckCircle2 size={22} /> Solicitação respondida. Obrigado.</div>
            )}

            <div className="approval-posts">
              {batch.posts.map((post) => {
                const decided = ["approved", "changes_requested", "scheduled", "published"].includes(post.status);
                return (
                  <article className="approval-post" key={post.id}>
                    <div className="approval-post__media">
                      {post.assetUrl ? (
                        <a href={post.assetUrl} rel="noreferrer" target="_blank">
                          <ExternalLink size={18} />
                          Abrir arte
                        </a>
                      ) : (
                        <span>Arte não vinculada</span>
                      )}
                    </div>
                    <div className="approval-post__content">
                      <span>{post.channel} · {post.format} · {formatDay(post.scheduledDate)}</span>
                      <h2>{post.title}</h2>
                      <p>{post.copy}</p>
                      <div className={`approval-status approval-status--${post.status}`}>{postStatusLabel(post.status)}</div>
                      {batch.comments.filter((comment) => comment.postId === post.id).map((comment) => (
                        <div className="approval-comment" key={comment.id}>
                          <strong>{comment.authorName ?? "Cliente"}</strong>
                          <p>{comment.body}</p>
                        </div>
                      ))}
                      {active && !decided ? (
                        <>
                          <label className="approval-note">
                            <span>Comentário</span>
                            <textarea
                              value={notes[post.id] ?? ""}
                              onChange={(event) => setNotes({ ...notes, [post.id]: event.target.value })}
                              placeholder="Adicione uma observação para o time."
                            />
                          </label>
                          <div className="approval-actions">
                            <button disabled={submittingPostId === post.id} onClick={() => submitDecision(post, "approved")} type="button">
                              <CheckCircle2 size={16} /> Aprovar
                            </button>
                            <button disabled={submittingPostId === post.id} onClick={() => submitDecision(post, "changes_requested")} type="button">
                              <RotateCcw size={16} /> Solicitar ajustes
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}

function InvalidState({ title, text }: { title: string; text: string }) {
  return (
    <div className="approval-state approval-state--blocked">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function statusLabel(status: PublicSocialApprovalBatch["status"]) {
  if (status === "active") return "Aberto";
  if (status === "used") return "Respondido";
  if (status === "expired") return "Expirado";
  if (status === "revoked") return "Revogado";
  return "Inválido";
}

function postStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Rascunho",
    internal_review: "Revisão interna",
    sent_for_approval: "Pendente de aprovação",
    changes_requested: "Ajustes solicitados",
    approved: "Aprovado",
    scheduled: "Agendado",
    published: "Publicado",
    cancelled: "Cancelado",
  };
  return labels[status] ?? status;
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
