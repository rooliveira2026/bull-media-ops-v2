import { createAuditEvent } from "../../../shared/audit/audit";
import { mockClients } from "../../../shared/api/mock-data";
import { listAuditLogs } from "../../core/api/core-repository";
import type { AuditLog, ModuleAction } from "../../../shared/types/core";
import type {
  SocialApprovalStatus,
  SocialOpsOverview,
  SocialPillar,
  SocialPost,
  SocialPostApproval,
  SocialPostFilters,
  SocialPostStatus,
  SocialPostTransitionPayload,
} from "../types";

const organizationId = "org_bull";
const now = "2026-06-09T20:00:00.000Z";

const pillars: SocialPillar[] = [
  {
    id: "pillar_performance",
    organizationId,
    name: "Performance e crescimento",
    description: "Conteúdos sobre evolução de mídia, eficiência e aprendizado operacional.",
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pillar_authority",
    organizationId,
    name: "Autoridade e confiança",
    description: "Publicações para reforçar visão executiva, bastidores e posicionamento.",
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "pillar_product",
    organizationId,
    name: "Produto e operação",
    description: "Demonstrações de processos, entregas e inteligência aplicada ao cliente.",
    status: "active",
    createdAt: now,
    updatedAt: now,
  },
];

const posts: SocialPost[] = [
  {
    id: "social_post_001",
    organizationId,
    clientId: "client_bull",
    clientName: "Bull Digital",
    pillarId: "pillar_product",
    pillarName: "Produto e operação",
    title: "Como a operação de mídia vira decisão executiva",
    channel: "linkedin",
    format: "article",
    scheduledDate: "2026-06-12",
    status: "in_production",
    approvalStatus: "submitted",
    copy: "Publicação sobre transformação de indicadores em ações práticas para times de marketing.",
    ownerProfileId: "user_media",
    metadata: { source: "mock_social_ops" },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "social_post_002",
    organizationId,
    clientId: "client_intercity",
    clientName: "Intercity Batel",
    pillarId: "pillar_authority",
    pillarName: "Autoridade e confiança",
    title: "Experiência local para viagens corporativas",
    channel: "instagram",
    format: "carousel",
    scheduledDate: "2026-06-14",
    status: "scheduled",
    approvalStatus: "approved",
    copy: "Sequência visual com diferenciais de estadia, localização e conveniência para reservas diretas.",
    ownerProfileId: "user_media",
    metadata: { source: "mock_social_ops" },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "social_post_003",
    organizationId,
    clientId: "client_about",
    clientName: "About Events",
    pillarId: "pillar_performance",
    pillarName: "Performance e crescimento",
    title: "Checklist para eventos corporativos com maior previsibilidade",
    channel: "instagram",
    format: "reels",
    scheduledDate: "2026-06-17",
    status: "draft",
    approvalStatus: "not_submitted",
    copy: "Roteiro curto com pontos de planejamento, qualificação e acompanhamento comercial.",
    ownerProfileId: "user_media",
    metadata: { source: "mock_social_ops" },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "social_post_004",
    organizationId,
    clientId: "client_bull",
    clientName: "Bull Digital",
    pillarId: "pillar_performance",
    pillarName: "Performance e crescimento",
    title: "Oportunidades de eficiência no ciclo de mídia",
    channel: "linkedin",
    format: "feed",
    scheduledDate: "2026-06-19",
    status: "ready",
    approvalStatus: "adjustments_requested",
    copy: "Post executivo sobre priorização de ajustes com impacto mensurável.",
    ownerProfileId: "user_media",
    metadata: { source: "mock_social_ops" },
    createdAt: now,
    updatedAt: now,
  },
];

const approvals: SocialPostApproval[] = [
  {
    id: "social_approval_001",
    organizationId,
    postId: "social_post_002",
    profileId: "user_rodrigo",
    status: "approved",
    note: "Aprovado para calendário editorial da semana.",
    createdAt: "2026-06-09T20:05:00.000Z",
  },
  {
    id: "social_approval_002",
    organizationId,
    postId: "social_post_004",
    profileId: "user_rodrigo",
    status: "adjustments_requested",
    note: "Refinar chamada e incluir exemplo de ação operacional.",
    createdAt: "2026-06-09T20:08:00.000Z",
  },
];

function findPost(postId: string) {
  const post = posts.find((item) => item.id === postId);
  if (!post) {
    throw new Error("Post social não encontrado.");
  }
  return post;
}

function updatePost(post: SocialPost, patch: Partial<SocialPost>) {
  Object.assign(post, patch, { updatedAt: new Date().toISOString() });
  return post;
}

async function auditPost(
  post: SocialPost,
  actionKey: ModuleAction,
  profileId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  await createAuditEvent({
    organizationId: post.organizationId,
    clientId: post.clientId,
    profileId: profileId ?? null,
    moduleKey: "social_ops",
    actionKey,
    entityType: "social_post",
    entityId: post.id,
    metadata: {
      status: post.status,
      approvalStatus: post.approvalStatus,
      ...metadata,
    },
  });
}

function createApproval(post: SocialPost, status: SocialApprovalStatus, payload: SocialPostTransitionPayload = {}) {
  const approval: SocialPostApproval = {
    id: `social_approval_${approvals.length + 1}`,
    organizationId: post.organizationId,
    postId: post.id,
    profileId: payload.profileId ?? null,
    status,
    note: payload.note ?? null,
    createdAt: new Date().toISOString(),
  };
  approvals.unshift(approval);
  return approval;
}

export async function getSocialOpsOverview(): Promise<SocialOpsOverview> {
  return {
    totalPosts: posts.length,
    submitted: posts.filter((post) => post.approvalStatus === "submitted").length,
    approved: posts.filter((post) => post.approvalStatus === "approved").length,
    scheduled: posts.filter((post) => post.status === "scheduled").length,
    adjustments: posts.filter((post) => post.approvalStatus === "adjustments_requested").length,
    pillars,
    posts,
  };
}

export async function listSocialPillars(): Promise<SocialPillar[]> {
  return pillars;
}

export async function listSocialPosts(filters: SocialPostFilters = {}): Promise<SocialPost[]> {
  return posts.filter((post) => {
    const clientMatches = !filters.clientId || filters.clientId === "all" || post.clientId === filters.clientId;
    const channelMatches = !filters.channel || filters.channel === "all" || post.channel === filters.channel;
    const pillarMatches = !filters.pillarId || filters.pillarId === "all" || post.pillarId === filters.pillarId;
    const statusMatches = !filters.status || filters.status === "all" || post.status === filters.status;
    const approvalMatches =
      !filters.approvalStatus ||
      filters.approvalStatus === "all" ||
      post.approvalStatus === filters.approvalStatus;
    const search = filters.search?.trim().toLowerCase();
    const searchMatches =
      !search ||
      [post.title, post.copy, post.clientName, post.pillarName, post.channel, post.format]
        .join(" ")
        .toLowerCase()
        .includes(search);

    return clientMatches && channelMatches && pillarMatches && statusMatches && approvalMatches && searchMatches;
  });
}

export async function submitSocialPost(postId: string, payload: SocialPostTransitionPayload = {}) {
  const post = updatePost(findPost(postId), { approvalStatus: "submitted", status: "in_production" });
  createApproval(post, "submitted", payload);
  await auditPost(post, "submit_social_post", payload.profileId, { note: payload.note ?? null });
  return post;
}

export async function approveSocialPost(postId: string, payload: SocialPostTransitionPayload = {}) {
  const post = updatePost(findPost(postId), { approvalStatus: "approved", status: "scheduled" });
  createApproval(post, "approved", payload);
  await auditPost(post, "approve_social_post", payload.profileId, { note: payload.note ?? null });
  return post;
}

export async function requestSocialPostAdjustments(postId: string, payload: SocialPostTransitionPayload = {}) {
  const post = updatePost(findPost(postId), { approvalStatus: "adjustments_requested", status: "in_production" });
  createApproval(post, "adjustments_requested", payload);
  await auditPost(post, "request_social_post_adjustments", payload.profileId, { note: payload.note ?? null });
  return post;
}

export async function updateSocialPostStatus(
  postId: string,
  status: SocialPostStatus,
  payload: SocialPostTransitionPayload = {},
) {
  const post = updatePost(findPost(postId), { status });
  await auditPost(post, "update_social_post_status", payload.profileId, { note: payload.note ?? null });
  return post;
}

export async function listSocialPostApprovals(postId: string): Promise<SocialPostApproval[]> {
  return approvals.filter((approval) => approval.postId === postId);
}

export async function listSocialPostAuditEvents(postId: string): Promise<AuditLog[]> {
  return listAuditLogs({ entityType: "social_post", entityId: postId });
}

export async function listSocialClients() {
  return mockClients;
}
