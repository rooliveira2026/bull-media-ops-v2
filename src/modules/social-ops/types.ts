export type SocialChannel = "instagram" | "facebook" | "linkedin" | "tiktok";

export type SocialPostFormat = "feed" | "reels" | "stories" | "carousel" | "article";

export type SocialPostStatus =
  | "draft"
  | "internal_review"
  | "sent_for_approval"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "cancelled"
  | "in_production"
  | "ready"
  | "paused";

export type SocialApprovalStatus =
  | "not_submitted"
  | "submitted"
  | "approved"
  | "adjustments_requested";

export interface SocialPillar {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  pillarId: string;
  pillarName: string;
  title: string;
  channel: SocialChannel;
  format: SocialPostFormat;
  scheduledDate: string;
  status: SocialPostStatus;
  approvalStatus: SocialApprovalStatus;
  copy: string;
  assetUrl: string;
  version: number;
  ownerProfileId: string | null;
  sentForApprovalAt: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  approvedByEmail: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostApproval {
  id: string;
  organizationId: string;
  postId: string;
  profileId: string | null;
  status: SocialApprovalStatus;
  note: string | null;
  approvalBatchId: string | null;
  approverName: string | null;
  approverEmail: string | null;
  decision: "approved" | "changes_requested" | null;
  approvedVersion: number | null;
  createdAt: string;
}

export type SocialApprovalBatchStatus = "active" | "used" | "expired" | "revoked";

export interface SocialApprovalBatch {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  status: SocialApprovalBatchStatus;
  expiresAt: string;
  createdBy: string | null;
  createdAt: string;
  revokedAt: string | null;
  usedAt: string | null;
  approvalUrl?: string;
  postIds: string[];
  metadata: Record<string, unknown>;
}

export interface SocialPostComment {
  id: string;
  organizationId: string;
  clientId: string;
  postId: string;
  approvalBatchId: string | null;
  profileId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  visibility: "internal" | "external";
  body: string;
  createdAt: string;
}

export interface SocialOpsOverview {
  totalPosts: number;
  submitted: number;
  approved: number;
  scheduled: number;
  adjustments: number;
  pillars: SocialPillar[];
  posts: SocialPost[];
}

export interface SocialPostFilters {
  clientId?: string;
  channel?: SocialChannel | "all";
  pillarId?: string;
  status?: SocialPostStatus | "all";
  approvalStatus?: SocialApprovalStatus | "all";
  periodStart?: string;
  periodEnd?: string;
  search?: string;
}

export interface SocialPostTransitionPayload {
  profileId?: string | null;
  note?: string;
}

export interface SocialPostInput {
  clientId: string;
  organizationId: string;
  pillarId?: string | null;
  title: string;
  channel: SocialChannel;
  format: SocialPostFormat;
  scheduledDate: string;
  status: SocialPostStatus;
  copy: string;
  assetUrl: string;
  ownerProfileId?: string | null;
}

export interface SocialApprovalBatchInput {
  clientId: string;
  postIds: string[];
  createdBy?: string | null;
  expiresAt?: string;
}

export interface PublicSocialApprovalBatch {
  status: SocialApprovalBatchStatus | "invalid";
  batch: {
    id: string;
    clientId: string;
    expiresAt: string;
    createdAt: string;
    usedAt: string | null;
  } | null;
  posts: SocialPost[];
  comments: SocialPostComment[];
}

export interface PublicSocialApprovalDecisionInput {
  token: string;
  postId: string;
  decision: "approved" | "changes_requested";
  authorName: string;
  authorEmail: string;
  note: string;
}
