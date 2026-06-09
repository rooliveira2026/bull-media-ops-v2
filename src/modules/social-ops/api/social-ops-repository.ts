import { createAuditEvent } from "../../../shared/audit/audit";
import { mockClients } from "../../../shared/api/mock-data";
import { getSupabaseClient } from "../../../shared/api/supabase-client";
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

interface SocialOpsRepository {
  getSocialOpsOverview(): Promise<SocialOpsOverview>;
  listSocialPillars(): Promise<SocialPillar[]>;
  listSocialPosts(filters?: SocialPostFilters): Promise<SocialPost[]>;
  submitSocialPost(postId: string, payload?: SocialPostTransitionPayload): Promise<SocialPost>;
  approveSocialPost(postId: string, payload?: SocialPostTransitionPayload): Promise<SocialPost>;
  requestSocialPostAdjustments(postId: string, payload?: SocialPostTransitionPayload): Promise<SocialPost>;
  updateSocialPostStatus(
    postId: string,
    status: SocialPostStatus,
    payload?: SocialPostTransitionPayload,
  ): Promise<SocialPost>;
  listSocialPostApprovals(postId: string): Promise<SocialPostApproval[]>;
}

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

function assertNoError(error: unknown) {
  if (error) throw error;
}

function mapPillar(row: Record<string, any>): SocialPillar {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description ?? "",
    status: row.status ?? "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPost(row: Record<string, any>): SocialPost {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  const pillar = Array.isArray(row.social_pillars) ? row.social_pillars[0] : row.social_pillars;
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    clientName: client?.name ?? row.client_name ?? row.client_id,
    pillarId: row.pillar_id ?? "",
    pillarName: pillar?.name ?? row.pillar_name ?? "Pilar a definir",
    title: row.title,
    channel: row.channel,
    format: row.format,
    scheduledDate: row.scheduled_date,
    status: row.status ?? "draft",
    approvalStatus: row.approval_status ?? "not_submitted",
    copy: row.copy ?? "",
    ownerProfileId: row.owner_profile_id ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapApproval(row: Record<string, any>): SocialPostApproval {
  return {
    id: row.id,
    organizationId: row.organization_id,
    postId: row.post_id,
    profileId: row.profile_id ?? null,
    status: row.status,
    note: row.note ?? null,
    createdAt: row.created_at,
  };
}

async function withMockFallback<T>(callback: () => Promise<T>, fallback: () => Promise<T>) {
  const supabase = getSupabaseClient();
  if (!supabase) return fallback();
  try {
    return await callback();
  } catch (error) {
    console.warn("[supabase:social_ops] fallback para mock:", error);
    return fallback();
  }
}

async function getSupabasePost(postId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { data, error } = await supabase
    .from("social_posts")
    .select("*, clients(name), social_pillars(name)")
    .eq("id", postId)
    .single();
  assertNoError(error);
  return mapPost(data);
}

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
  const [pillarData, postData] = await Promise.all([listSocialPillars(), listSocialPosts()]);
  return {
    totalPosts: postData.length,
    submitted: postData.filter((post) => post.approvalStatus === "submitted").length,
    approved: postData.filter((post) => post.approvalStatus === "approved").length,
    scheduled: postData.filter((post) => post.status === "scheduled").length,
    adjustments: postData.filter((post) => post.approvalStatus === "adjustments_requested").length,
    pillars: pillarData,
    posts: postData,
  };
}

export async function listSocialPillars(): Promise<SocialPillar[]> {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase.from("social_pillars").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapPillar);
  }, () => Promise.resolve(pillars));
}

export async function listSocialPosts(filters: SocialPostFilters = {}): Promise<SocialPost[]> {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    let query = supabase
      .from("social_posts")
      .select("*, clients(name), social_pillars(name)")
      .order("scheduled_date", { ascending: true });

    if (filters.clientId && filters.clientId !== "all") query = query.eq("client_id", filters.clientId);
    if (filters.channel && filters.channel !== "all") query = query.eq("channel", filters.channel);
    if (filters.pillarId && filters.pillarId !== "all") query = query.eq("pillar_id", filters.pillarId);
    if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.approvalStatus && filters.approvalStatus !== "all") {
      query = query.eq("approval_status", filters.approvalStatus);
    }
    if (filters.search?.trim()) {
      const search = filters.search.trim();
      query = query.or(`title.ilike.%${search}%,copy.ilike.%${search}%,channel.ilike.%${search}%,format.ilike.%${search}%`);
    }

    const { data, error } = await query;
    assertNoError(error);
    return (data ?? []).map(mapPost);
  }, () => Promise.resolve(listSocialPostsMock(filters)));
}

function listSocialPostsMock(filters: SocialPostFilters = {}) {
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
  return withMockFallback(async () => {
    const post = await updateSocialPostInSupabase(postId, { approval_status: "submitted", status: "in_production" });
    await createApprovalInSupabase(post, "submitted", payload);
    await auditPost(post, "submit_social_post", payload.profileId, { note: payload.note ?? null });
    return post;
  }, async () => {
    const post = updatePost(findPost(postId), { approvalStatus: "submitted", status: "in_production" });
    createApproval(post, "submitted", payload);
    await auditPost(post, "submit_social_post", payload.profileId, { note: payload.note ?? null });
    return post;
  });
}

export async function approveSocialPost(postId: string, payload: SocialPostTransitionPayload = {}) {
  return withMockFallback(async () => {
    const post = await updateSocialPostInSupabase(postId, { approval_status: "approved", status: "scheduled" });
    await createApprovalInSupabase(post, "approved", payload);
    await auditPost(post, "approve_social_post", payload.profileId, { note: payload.note ?? null });
    return post;
  }, async () => {
    const post = updatePost(findPost(postId), { approvalStatus: "approved", status: "scheduled" });
    createApproval(post, "approved", payload);
    await auditPost(post, "approve_social_post", payload.profileId, { note: payload.note ?? null });
    return post;
  });
}

export async function requestSocialPostAdjustments(postId: string, payload: SocialPostTransitionPayload = {}) {
  return withMockFallback(async () => {
    const post = await updateSocialPostInSupabase(postId, {
      approval_status: "adjustments_requested",
      status: "in_production",
    });
    await createApprovalInSupabase(post, "adjustments_requested", payload);
    await auditPost(post, "request_social_post_adjustments", payload.profileId, { note: payload.note ?? null });
    return post;
  }, async () => {
    const post = updatePost(findPost(postId), { approvalStatus: "adjustments_requested", status: "in_production" });
    createApproval(post, "adjustments_requested", payload);
    await auditPost(post, "request_social_post_adjustments", payload.profileId, { note: payload.note ?? null });
    return post;
  });
}

export async function updateSocialPostStatus(
  postId: string,
  status: SocialPostStatus,
  payload: SocialPostTransitionPayload = {},
) {
  return withMockFallback(async () => {
    const post = await updateSocialPostInSupabase(postId, { status });
    await auditPost(post, "update_social_post_status", payload.profileId, { note: payload.note ?? null });
    return post;
  }, async () => {
    const post = updatePost(findPost(postId), { status });
    await auditPost(post, "update_social_post_status", payload.profileId, { note: payload.note ?? null });
    return post;
  });
}

export async function listSocialPostApprovals(postId: string): Promise<SocialPostApproval[]> {
  return withMockFallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase indisponível.");
    const { data, error } = await supabase
      .from("social_post_approvals")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    assertNoError(error);
    return (data ?? []).map(mapApproval);
  }, () => Promise.resolve(approvals.filter((approval) => approval.postId === postId)));
}

export async function listSocialPostAuditEvents(postId: string): Promise<AuditLog[]> {
  return listAuditLogs({ entityType: "social_post", entityId: postId });
}

export async function listSocialClients() {
  return mockClients;
}

async function updateSocialPostInSupabase(postId: string, patch: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { error } = await supabase.from("social_posts").update(patch).eq("id", postId);
  assertNoError(error);
  return getSupabasePost(postId);
}

async function createApprovalInSupabase(
  post: SocialPost,
  status: SocialApprovalStatus,
  payload: SocialPostTransitionPayload = {},
) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase indisponível.");
  const { data, error } = await supabase
    .from("social_post_approvals")
    .insert({
      organization_id: post.organizationId,
      post_id: post.id,
      profile_id: payload.profileId ?? null,
      status,
      note: payload.note ?? null,
    })
    .select("*")
    .single();
  assertNoError(error);
  return mapApproval(data);
}
