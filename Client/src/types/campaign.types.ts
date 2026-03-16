/** Shared DTO types for campaign / fundraiser data (B-11-4). */
import type { Donation } from "./donation";

export type CampaignStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "COMPLETED";

export interface CampaignCreator {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  panDetails?: {
    panNumber?: string;
    panName?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
}

export interface BeneficiaryOther {
  fullName: string;
  relationshipToCreator: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface RecipientAccount {
  id: string;
  recipientType: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  country: string;
  isVerified: boolean;
}

export interface MediaItem {
  playerImages?: string[];
  youTubeUrl?: string[];
}

export interface CampaignUpdate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

/** Campaign row as returned by admin list endpoints. */
export interface AdminCampaignRow {
  id: string;
  title: string;
  shortDescription?: string;
  campaignFor: "SELF" | "OTHER";
  sport: string;
  level?: string;
  discipline?: string;
  city?: string;
  state?: string;
  country?: string;
  status: CampaignStatus;
  raisedAmount: string | number;
  goalAmount: string | number;
  coverImageURL?: string;
  createdAt: string;
  creator: CampaignCreator;
  rejectionReason?: string;
  rejectedAt?: string;
}

/** Full campaign detail — used in both admin and dashboard detail pages. */
export interface CampaignDetail extends AdminCampaignRow {
  story?: string;
  skills?: string[];
  media?: MediaItem[];
  donations?: Donation[];
  fundraiserupdates?: CampaignUpdate[];
  beneficiaryUser?: { firstName: string; lastName: string } | null;
  beneficiaryOther?: BeneficiaryOther | null;
  recipientAccount?: RecipientAccount | null;
}
