
import { api } from "@/lib/api-client";

/** Keep this aligned with your Prisma CampaignStatus enum */
export type CampaignStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "COMPLETED";

export type RejectCampaignBody = {
  rejectionReason: string;
};

export const AdminCampaignsService = {
  /** GET /admin/campaigns?status=... */
  listCampaigns: (status: CampaignStatus) => {
    return api.get(`/admin/campaigns`, {
      params: { status },
    });
  },

  getCampaignById: (id: string) => {
    return api.get(`/admin/campaigns/${id}`);
  },

  approveCampaign: (id: string) => {
    return api.post(`/admin/campaigns/${id}/approve`);
  },

  rejectCampaign: (id: string, body: RejectCampaignBody) => {
    return api.post(`/admin/campaigns/${id}/reject`, body);
  },

  suspendCampaign: (id: string) => {
    return api.post(`/admin/campaigns/${id}/suspend`);
  },

  activateCampaign: (id: string) => {
    return api.post(`/admin/campaigns/${id}/activate`);
  },

  revokeCampaign: (id: string) => {
    return api.post(`/admin/campaigns/${id}/revoke`);
  },

  completeCampaign: (id: string) => {
    return api.post(`/admin/campaigns/${id}/complete`);
  },

  /** GET /admin/campaigns/status-counts — single DB query, replaces 6 parallel calls */
  getStatusCounts: () => {
    return api.get(`/admin/campaigns/status-counts`);
  },

  listBankAccounts: (onlyUnverified = false) => {
    return api.get(`/admin/campaigns/bank-accounts`, {
      params: onlyUnverified ? { unverified: "true" } : {},
    });
  },

  verifyBankAccount: (recipientAccountId: string) => {
    return api.put(`/admin/campaigns/${recipientAccountId}/verify`);
  },
};
