export type SocialChannel = "instagram" | "facebook" | "linkedin" | "tiktok";

export type SocialPostFormat = "feed" | "reels" | "stories" | "carousel" | "article";

export type SocialPostStatus =
  | "draft"
  | "scheduled"
  | "in_production"
  | "ready"
  | "published"
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
  ownerProfileId: string | null;
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
  search?: string;
}

export interface SocialPostTransitionPayload {
  profileId?: string | null;
  note?: string;
}
