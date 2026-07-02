import { createAuditEvent } from "../../../shared/audit/audit";
import { mockClients } from "../../../shared/api/mock-data";
import { getSupabaseClient, requireSupabaseClient } from "../../../shared/api/supabase-client";
import { isSupabaseMode } from "../../../shared/config/env";
import { listAuditLogs, listClients } from "../../core/api/core-repository";
import type { AuditLog, Client, ModuleAction } from "../../../shared/types/core";
import type {
  PublicSocialApprovalBatch,
  PublicSocialApprovalDecisionInput,
  SocialApprovalBatch,
  SocialApprovalBatchInput,
  SocialApprovalStatus,
  SocialOpsOverview,
  SocialPillar,
  SocialPost,
  SocialPostApproval,
  SocialPostComment,
  SocialPostFilters,
  SocialPostInput,
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
    scheduledDate: "2026-07-12",
    status: "sent_for_approval",
    approvalStatus: "submitted",
    copy: "Publicação sobre transformação de indicadores em ações práticas para times de marketing.",
    assetUrl: "https://placehold.co/1200x900/5A07D6/FFFFFF?text=Bull+Media+Ops",
    version: 1,
    ownerProfileId: "user_media",
    sentForApprovalAt: now,
    approvedAt: null,
    approvedByName: null,
    approvedByEmail: null,
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
    scheduledDate: "2026-07-14",
    status: "approved",
    approvalStatus: "approved",
    copy: "Sequência visual com diferenciais de estadia, localização e conveniência para reservas diretas.",
    assetUrl: "https://placehold.co/1200x900/111827/FFFFFF?text=Post+aprovado",
    version: 1,
    ownerProfileId: "user_media",
    sentForApprovalAt: now,
    approvedAt: "2026-06-09T20:05:00.000Z",
    approvedByName: "Cliente Intercity",
    approvedByEmail: "cliente@example.com",
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
    scheduledDate: "2026-07-17",
    status: "draft",
    approvalStatus: "not_submitted",
    copy: "Roteiro curto com pontos de planejamento, qualificação e acompanhamento comercial.",
    assetUrl: "",
    version: 1,
    ownerProfileId: "user_media",
    sentForApprovalAt: null,
    approvedAt: null,
    approvedByName: null,
    approvedByEmail: null,
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
    approvalBatchId: null,
    approverName: "Cliente Intercity",
    approverEmail: "cliente@example.com",
    decision: "approved",
    approvedVersion: 1,
    createdAt: "2026-06-09T20:05:00.000Z",
  },
];

const comments: SocialPostComment[] = [];
const batches: SocialApprovalBatch[] = [];

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
    clientName: row.client_name ?? client?.name ?? row.client_id,
    pillarId: row.pillar_id ?? "",
    pillarName: row.pillar_name ?? pillar?.name ?? "Pilar a definir",
    title: row.title,
    channel: row.channel,
    format: row.format,
    scheduledDate: row.scheduled_date,
    status: row.status ?? "draft",
    approvalStatus: row.approval_status ?? "not_submitted",
    copy: row.copy ?? "",
    assetUrl: row.asset_url ?? "",
    version: Number(row.version ?? 1),
    ownerProfileId: row.owner_profile_id ?? null,
    sentForApprovalAt: row.sent_for_approval_at ?? null,
    approvedAt: row.approved_at ?? null,
    approvedByName: row.approved_by_name ?? null,
    approvedByEmail: row.approved_by_email ?? null,
    metadata: row.metadata ?? {},
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
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
    approvalBatchId: row.approval_batch_id ?? null,
    approverName: row.approver_name ?? null,
    approverEmail: row.approver_email ?? null,
    decision: row.decision ?? null,
    approvedVersion: row.approved_version ?? null,
    createdAt: row.created_at,
  };
}

function mapComment(row: Record<string, any>): SocialPostComment {
  return {
    id: row.id ?? `${row.post_id}_${row.created_at}`,
    organizationId: row.organization_id ?? "",
    clientId: row.client_id ?? "",
    postId: row.post_id,
    approvalBatchId: row.approval_batch_id ?? null,
    profileId: row.profile_id ?? null,
    authorName: row.author_name ?? null,
    authorEmail: row.author_email ?? null,
    visibility: row.visibility ?? "internal",
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapBatch(row: Record<string, any>): SocialApprovalBatch {
  const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  const links = row.social_approval_batch_posts ?? [];
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    clientName: client?.name ?? row.client_name ?? row.client_id,
    status: row.status,
    expiresAt: row.expires_at,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    revokedAt: row.revoked_at ?? null,
    usedAt: row.used_at ?? null,
    postIds: Array.isArray(links) ? links.map((link) => link.post_id) : [],
    metadata: row.metadata ?? {},
  };
}

async function withMockFallback<T>(callback: () => Promise<T>, fallback: () => Promise<T>) {
  const supabase = getSupabaseClient();
  if (!supabase) return fallback();
  try {
    return await callback();
  } catch (error) {
    if (isSupabaseMode()) {
      console.warn("[supabase:social_ops] operação indisponível; retornando estado seguro:", error);
      return fallback();
    }
    console.warn("[supabase:social_ops] fallback para mock:", error);
    return fallback();
  }
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

function fallbackUnavailable(message: string): never {
  throw new Error(message);
}

function approvalStatusFromPostStatus(status: SocialPostStatus): SocialApprovalStatus {
  if (status === "sent_for_approval") return "submitted";
  if (status === "approved" || status === "scheduled" || status === "published") return "approved";
  if (status === "changes_requested") return "adjustments_requested";
  return "not_submitted";
}

function createApproval(post: SocialPost, status: SocialApprovalStatus, payload: SocialPostTransitionPayload = {}) {
  const approval: SocialPostApproval = {
    id: `social_approval_${approvals.length + 1}`,
    organizationId: post.organizationId,
    postId: post.id,
    profileId: payload.profileId ?? null,
    status,
    note: payload.note ?? null,
    approvalBatchId: null,
    approverName: null,
    approverEmail: null,
    decision: status === "approved" ? "approved" : status === "adjustments_requested" ? "changes_requested" : null,
    approvedVersion: post.version,
    createdAt: new Date().toISOString(),
  };
  approvals.unshift(approval);
  return approval;
}

function updatePost(post: SocialPost, patch: Partial<SocialPost>) {
  Object.assign(post, patch, { updatedAt: new Date().toISOString() });
  return post;
}

function findPost(postId: string) {
  const post = posts.find((item) => item.id === postId);
  if (!post) throw new Error("Post social não encontrado.");
  return post;
}

function getPublicOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function buildApprovalUrl(token: string) {
  return `${getPublicOrigin()}/approval/social/${token}`;
}

function generateToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getSocialOpsOverview(): Promise<SocialOpsOverview> {
  const [pillarData, postData] = await Promise.all([listSocialPillars(), listSocialPosts()]);
  return {
    totalPosts: postData.length,
    submitted: postData.filter((post) => post.status === "sent_for_approval").length,
    approved: postData.filter((post) => post.status === "approved").length,
    scheduled: postData.filter((post) => post.status === "scheduled").length,
    adjustments: postData.filter((post) => post.status === "changes_requested").length,
    pillars: pillarData,
    posts: postData,
  };
}

export async function listSocialPillars(): Promise<SocialPillar[]> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase.from("social_pillars").select("*").order("name");
    assertNoError(error);
    return (data ?? []).map(mapPillar);
  }, () => Promise.resolve(isSupabaseMode() ? [] : pillars));
}

export async function listSocialClients(): Promise<Client[]> {
  if (isSupabaseMode()) return listClients();
  return mockClients;
}

export async function listSocialPosts(filters: SocialPostFilters = {}): Promise<SocialPost[]> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    let query = supabase
      .from("social_posts")
      .select("*, clients(name), social_pillars(name)")
      .order("scheduled_date", { ascending: true });

    if (filters.clientId && filters.clientId !== "all") query = query.eq("client_id", filters.clientId);
    if (filters.channel && filters.channel !== "all") query = query.eq("channel", filters.channel);
    if (filters.pillarId && filters.pillarId !== "all") query = query.eq("pillar_id", filters.pillarId);
    if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.approvalStatus && filters.approvalStatus !== "all") query = query.eq("approval_status", filters.approvalStatus);
    if (filters.periodStart) query = query.gte("scheduled_date", filters.periodStart);
    if (filters.periodEnd) query = query.lte("scheduled_date", filters.periodEnd);
    if (filters.search?.trim()) {
      const search = filters.search.trim();
      query = query.or(`title.ilike.%${search}%,copy.ilike.%${search}%,channel.ilike.%${search}%,format.ilike.%${search}%`);
    }

    const { data, error } = await query;
    assertNoError(error);
    return (data ?? []).map(mapPost);
  }, () => Promise.resolve(isSupabaseMode() ? [] : listSocialPostsMock(filters)));
}

function listSocialPostsMock(filters: SocialPostFilters = {}) {
  return posts.filter((post) => {
    const clientMatches = !filters.clientId || filters.clientId === "all" || post.clientId === filters.clientId;
    const channelMatches = !filters.channel || filters.channel === "all" || post.channel === filters.channel;
    const pillarMatches = !filters.pillarId || filters.pillarId === "all" || post.pillarId === filters.pillarId;
    const statusMatches = !filters.status || filters.status === "all" || post.status === filters.status;
    const approvalMatches = !filters.approvalStatus || filters.approvalStatus === "all" || post.approvalStatus === filters.approvalStatus;
    const periodStartMatches = !filters.periodStart || post.scheduledDate >= filters.periodStart;
    const periodEndMatches = !filters.periodEnd || post.scheduledDate <= filters.periodEnd;
    const search = filters.search?.trim().toLowerCase();
    const searchMatches =
      !search ||
      [post.title, post.copy, post.clientName, post.pillarName, post.channel, post.format]
        .join(" ")
        .toLowerCase()
        .includes(search);

    return clientMatches && channelMatches && pillarMatches && statusMatches && approvalMatches && periodStartMatches && periodEndMatches && searchMatches;
  });
}

export async function createSocialPost(input: SocialPostInput, profileId?: string | null): Promise<SocialPost> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        organization_id: input.organizationId,
        client_id: input.clientId,
        pillar_id: input.pillarId || null,
        title: input.title,
        channel: input.channel,
        format: input.format,
        scheduled_date: input.scheduledDate,
        status: input.status,
        approval_status: approvalStatusFromPostStatus(input.status),
        copy: input.copy,
        asset_url: input.assetUrl,
        owner_profile_id: input.ownerProfileId ?? profileId ?? null,
      })
      .select("*, clients(name), social_pillars(name)")
      .single();
    assertNoError(error);
    const post = mapPost(data);
    await auditPost(post, "create_social_post", profileId);
    return post;
  }, async () => {
    if (isSupabaseMode()) return fallbackUnavailable("Supabase indisponível para criar post social.");
    const client = mockClients.find((item) => item.id === input.clientId);
    const pillar = pillars.find((item) => item.id === input.pillarId);
    const post: SocialPost = {
      id: `social_post_${posts.length + 1}`,
      organizationId: input.organizationId,
      clientId: input.clientId,
      clientName: client?.name ?? input.clientId,
      pillarId: input.pillarId ?? "",
      pillarName: pillar?.name ?? "Pilar a definir",
      title: input.title,
      channel: input.channel,
      format: input.format,
      scheduledDate: input.scheduledDate,
      status: input.status,
      approvalStatus: approvalStatusFromPostStatus(input.status),
      copy: input.copy,
      assetUrl: input.assetUrl,
      version: 1,
      ownerProfileId: input.ownerProfileId ?? profileId ?? null,
      sentForApprovalAt: null,
      approvedAt: null,
      approvedByName: null,
      approvedByEmail: null,
      metadata: { source: "mock_social_ops" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    posts.unshift(post);
    return post;
  });
}

export async function updateSocialPost(postId: string, input: Partial<SocialPostInput>, profileId?: string | null): Promise<SocialPost> {
  return withMockFallback(async () => {
    const current = await getSupabasePost(postId);
    const nextStatus = input.status ?? current.status;
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        client_id: input.clientId ?? current.clientId,
        organization_id: input.organizationId ?? current.organizationId,
        pillar_id: input.pillarId === undefined ? current.pillarId || null : input.pillarId || null,
        title: input.title ?? current.title,
        channel: input.channel ?? current.channel,
        format: input.format ?? current.format,
        scheduled_date: input.scheduledDate ?? current.scheduledDate,
        status: nextStatus,
        approval_status: approvalStatusFromPostStatus(nextStatus),
        copy: input.copy ?? current.copy,
        asset_url: input.assetUrl ?? current.assetUrl,
        owner_profile_id: input.ownerProfileId === undefined ? current.ownerProfileId : input.ownerProfileId,
        version: current.version + 1,
      })
      .eq("id", postId)
      .select("*, clients(name), social_pillars(name)")
      .single();
    assertNoError(error);
    const post = mapPost(data);
    await auditPost(post, "edit_social_post", profileId);
    return post;
  }, async () => {
    if (isSupabaseMode()) return fallbackUnavailable("Supabase indisponível para editar post social.");
    const current = findPost(postId);
    const nextStatus = input.status ?? current.status;
    return updatePost(current, {
      clientId: input.clientId ?? current.clientId,
      organizationId: input.organizationId ?? current.organizationId,
      pillarId: input.pillarId === undefined ? current.pillarId : input.pillarId ?? "",
      title: input.title ?? current.title,
      channel: input.channel ?? current.channel,
      format: input.format ?? current.format,
      scheduledDate: input.scheduledDate ?? current.scheduledDate,
      status: nextStatus,
      approvalStatus: approvalStatusFromPostStatus(nextStatus),
      copy: input.copy ?? current.copy,
      assetUrl: input.assetUrl ?? current.assetUrl,
      ownerProfileId: input.ownerProfileId === undefined ? current.ownerProfileId : input.ownerProfileId ?? null,
      version: current.version + 1,
    });
  });
}

export async function createSocialApprovalBatch(input: SocialApprovalBatchInput): Promise<SocialApprovalBatch> {
  return withMockFallback(async () => {
    if (!globalThis.crypto?.subtle) throw new Error("Navegador sem suporte a token seguro.");
    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = input.expiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const postsForBatch = await listSocialPosts({ clientId: input.clientId });
    const selectedPosts = postsForBatch.filter((post) => input.postIds.includes(post.id));
    const firstPost = selectedPosts[0];

    if (!firstPost || selectedPosts.length !== input.postIds.length) {
      throw new Error("Todos os posts do lote precisam pertencer ao cliente selecionado.");
    }

    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("social_approval_batches")
      .insert({
        organization_id: firstPost.organizationId,
        client_id: input.clientId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: input.createdBy ?? null,
        metadata: { post_count: input.postIds.length },
      })
      .select("*, clients(name)")
      .single();
    assertNoError(error);

    const batch = mapBatch({ ...data, social_approval_batch_posts: input.postIds.map((post_id) => ({ post_id })) });
    const { error: linkError } = await supabase
      .from("social_approval_batch_posts")
      .insert(input.postIds.map((postId) => ({ batch_id: batch.id, post_id: postId })));
    assertNoError(linkError);

    const { error: updateError } = await supabase
      .from("social_posts")
      .update({
        status: "sent_for_approval",
        approval_status: "submitted",
        sent_for_approval_at: new Date().toISOString(),
      })
      .in("id", input.postIds);
    assertNoError(updateError);

    const { error: approvalError } = await supabase.from("social_post_approvals").insert(
      selectedPosts.map((post) => ({
        organization_id: post.organizationId,
        post_id: post.id,
        profile_id: input.createdBy ?? null,
        status: "submitted",
        note: "Post enviado ao cliente para aprovação.",
        approval_batch_id: batch.id,
        approved_version: post.version,
        metadata: { source: "internal_approval_batch" },
      })),
    );
    assertNoError(approvalError);

    await Promise.all(selectedPosts.map((post) => auditPost(post, "create_social_approval_batch", input.createdBy, { approvalBatchId: batch.id })));
    return { ...batch, status: "active", approvalUrl: buildApprovalUrl(token), postIds: input.postIds };
  }, async () => {
    if (isSupabaseMode()) return fallbackUnavailable("Supabase indisponível para criar lote de aprovação.");
    const token = generateToken();
    const client = mockClients.find((item) => item.id === input.clientId);
    const batch: SocialApprovalBatch = {
      id: `approval_batch_${batches.length + 1}`,
      organizationId,
      clientId: input.clientId,
      clientName: client?.name ?? input.clientId,
      status: "active",
      expiresAt: input.expiresAt ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(),
      revokedAt: null,
      usedAt: null,
      approvalUrl: buildApprovalUrl(token),
      postIds: input.postIds,
      metadata: { source: "mock_social_ops" },
    };
    batches.unshift(batch);
    input.postIds.forEach((postId) => updatePost(findPost(postId), { status: "sent_for_approval", approvalStatus: "submitted", sentForApprovalAt: new Date().toISOString() }));
    return batch;
  });
}

export async function listSocialApprovalBatches(clientId?: string): Promise<SocialApprovalBatch[]> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    let query = supabase
      .from("social_approval_batches")
      .select("*, clients(name), social_approval_batch_posts(post_id)")
      .order("created_at", { ascending: false });
    if (clientId && clientId !== "all") query = query.eq("client_id", clientId);
    const { data, error } = await query;
    assertNoError(error);
    return (data ?? []).map(mapBatch);
  }, () => Promise.resolve(isSupabaseMode() ? [] : batches.filter((batch) => !clientId || clientId === "all" || batch.clientId === clientId)));
}

export async function revokeSocialApprovalBatch(batchId: string, profileId?: string | null): Promise<void> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    const batchesBefore = await listSocialApprovalBatches();
    const batch = batchesBefore.find((item) => item.id === batchId);
    const { error } = await supabase
      .from("social_approval_batches")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", batchId);
    assertNoError(error);
    if (batch) {
      const selectedPosts = await Promise.all(batch.postIds.map((postId) => getSupabasePost(postId)));
      await Promise.all(selectedPosts.map((post) => auditPost(post, "revoke_social_approval_batch", profileId, { approvalBatchId: batch.id })));
    }
  }, async () => {
    if (isSupabaseMode()) return fallbackUnavailable("Supabase indisponível para revogar lote de aprovação.");
    const batch = batches.find((item) => item.id === batchId);
    if (batch) Object.assign(batch, { status: "revoked", revokedAt: new Date().toISOString() });
  });
}

export async function addSocialPostComment(postId: string, body: string, profileId?: string | null): Promise<SocialPostComment> {
  return withMockFallback(async () => {
    const post = await getSupabasePost(postId);
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("social_post_comments")
      .insert({
        organization_id: post.organizationId,
        client_id: post.clientId,
        post_id: post.id,
        profile_id: profileId ?? null,
        visibility: "internal",
        body,
      })
      .select("*")
      .single();
    assertNoError(error);
    await auditPost(post, "add_social_post_comment", profileId, { commentId: data.id });
    return mapComment(data);
  }, async () => {
    if (isSupabaseMode()) return fallbackUnavailable("Supabase indisponível para comentar post social.");
    const post = findPost(postId);
    const comment: SocialPostComment = {
      id: `social_comment_${comments.length + 1}`,
      organizationId: post.organizationId,
      clientId: post.clientId,
      postId: post.id,
      approvalBatchId: null,
      profileId: profileId ?? null,
      authorName: "Time interno",
      authorEmail: null,
      visibility: "internal",
      body,
      createdAt: new Date().toISOString(),
    };
    comments.unshift(comment);
    return comment;
  });
}

export async function submitSocialPost(postId: string, payload: SocialPostTransitionPayload = {}) {
  const post = await updateSocialPostStatus(postId, "sent_for_approval", payload);
  createApproval(post, "submitted", payload);
  return post;
}

export async function approveSocialPost(postId: string, payload: SocialPostTransitionPayload = {}) {
  const post = await updateSocialPostStatus(postId, "approved", payload);
  createApproval(post, "approved", payload);
  return post;
}

export async function requestSocialPostAdjustments(postId: string, payload: SocialPostTransitionPayload = {}) {
  const post = await updateSocialPostStatus(postId, "changes_requested", payload);
  createApproval(post, "adjustments_requested", payload);
  return post;
}

export async function updateSocialPostStatus(
  postId: string,
  status: SocialPostStatus,
  payload: SocialPostTransitionPayload = {},
) {
  return withMockFallback(async () => {
    const current = await getSupabasePost(postId);
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        status,
        approval_status: approvalStatusFromPostStatus(status),
        sent_for_approval_at: status === "sent_for_approval" ? new Date().toISOString() : current.sentForApprovalAt,
      })
      .eq("id", postId)
      .select("*, clients(name), social_pillars(name)")
      .single();
    assertNoError(error);
    const post = mapPost(data);
    await auditPost(post, "update_social_post_status", payload.profileId, { note: payload.note ?? null });
    return post;
  }, async () => {
    if (isSupabaseMode()) return fallbackUnavailable("Supabase indisponível para atualizar post social.");
    const post = updatePost(findPost(postId), {
      status,
      approvalStatus: approvalStatusFromPostStatus(status),
      sentForApprovalAt: status === "sent_for_approval" ? new Date().toISOString() : findPost(postId).sentForApprovalAt,
    });
    await auditPost(post, "update_social_post_status", payload.profileId, { note: payload.note ?? null });
    return post;
  });
}

export async function listSocialPostApprovals(postId: string): Promise<SocialPostApproval[]> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("social_post_approvals")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    assertNoError(error);
    return (data ?? []).map(mapApproval);
  }, () => Promise.resolve(isSupabaseMode() ? [] : approvals.filter((approval) => approval.postId === postId)));
}

export async function listSocialPostComments(postId: string): Promise<SocialPostComment[]> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase
      .from("social_post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });
    assertNoError(error);
    return (data ?? []).map(mapComment);
  }, () => Promise.resolve(isSupabaseMode() ? [] : comments.filter((comment) => comment.postId === postId)));
}

export async function listSocialPostAuditEvents(postId: string): Promise<AuditLog[]> {
  return withMockFallback(async () => {
    const supabase = requireSupabaseClient();
    const [coreEvents, socialEvents] = await Promise.all([
      listAuditLogs({ entityType: "social_post", entityId: postId }),
      supabase
        .from("social_audit_events")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false }),
    ]);
    assertNoError(socialEvents.error);
    const mappedSocialEvents: AuditLog[] = (socialEvents.data ?? []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      clientId: row.client_id ?? null,
      profileId: row.profile_id ?? null,
      moduleKey: "social_ops",
      actionKey: row.action_key,
      entityType: "social_post",
      entityId: row.post_id,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    }));
    return [...coreEvents, ...mappedSocialEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, () => listAuditLogs({ entityType: "social_post", entityId: postId }));
}

export async function getPublicSocialApprovalBatch(token: string): Promise<PublicSocialApprovalBatch> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc("get_social_approval_batch", { p_token: token });
  assertNoError(error);
  return mapPublicBatch(data);
}

export async function submitPublicSocialApprovalDecision(input: PublicSocialApprovalDecisionInput): Promise<PublicSocialApprovalBatch> {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc("submit_social_approval_decision", {
    p_token: input.token,
    p_post_id: input.postId,
    p_decision: input.decision,
    p_author_name: input.authorName,
    p_author_email: input.authorEmail,
    p_note: input.note,
  });
  assertNoError(error);
  return mapPublicBatch(data);
}

async function getSupabasePost(postId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*, clients(name), social_pillars(name)")
    .eq("id", postId)
    .single();
  assertNoError(error);
  return mapPost(data);
}

function mapPublicBatch(payload: any): PublicSocialApprovalBatch {
  return {
    status: payload?.status ?? "invalid",
    batch: payload?.batch
      ? {
          id: payload.batch.id ?? "",
          clientId: payload.batch.client_id ?? "",
          expiresAt: payload.batch.expires_at,
          createdAt: payload.batch.created_at,
          usedAt: payload.batch.used_at ?? null,
        }
      : null,
    posts: (payload?.posts ?? []).map((row: Record<string, any>) =>
      mapPost({
        ...row,
        id: row.id ?? row.post_id,
        organization_id: row.organization_id ?? "",
        client_id: row.client_id ?? "",
        social_pillars: null,
        clients: { name: row.client_name },
        created_at: "",
        updated_at: "",
        metadata: {},
      }),
    ),
    comments: (payload?.comments ?? []).map((row: Record<string, any>) =>
      mapComment({
        ...row,
        organization_id: "",
        client_id: "",
        approval_batch_id: payload?.batch?.id ?? null,
        profile_id: null,
      }),
    ),
  };
}
