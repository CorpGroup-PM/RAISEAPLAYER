/** Shared DTO types for payout / withdrawal data (B-11-4). */

export type PayoutStatus =
  | "PENDING"
  | "APPROVED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REJECTED"
  | "CANCELLED";

export interface PayoutItem {
  id: string;
  fundraiserId: string;
  amount: string | number;
  status: PayoutStatus;
  reason?: string | null;
  createdAt: string;
  processedAt?: string | null;
  fundraiser?: {
    id: string;
    title: string;
  };
}

/** Extended shape returned by the admin all-payouts endpoint. */
export interface AdminPayoutItem extends PayoutItem {
  fundraiserName?: string | null;
  reviewReason?: string | null;
  failedReason?: string | null;
  transactionId?: string | null;
  payout?: {
    notes?: string | null;
    proofImageUrl?: string | null;
  } | null;
}
