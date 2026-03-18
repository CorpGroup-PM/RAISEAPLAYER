import { api } from "@/lib/api-client";

export const AnalyticsService = {
  overview(params: { from: string; to: string }) {
    return api.get("/admin/analytics/overview", { params });
  },
  fundraisers(params: { from: string; to: string }) {
    return api.get("/admin/analytics/fundraisers", { params });
  },
  donations(params: { from: string; to: string }) {
    return api.get("/admin/analytics/donations", { params });
  },
  withdrawals(params: { from: string; to: string }) {
    return api.get("/admin/analytics/withdrawals", { params });
  },
  payouts(params: { from: string; to: string }) {
    return api.get("/admin/analytics/payouts", { params });
  },
  documents(params?: { from?: string; to?: string }) {
    return api.get("/admin/analytics/documents", { params });
  },
  trackSponsorClick() {
    return api.post("/analytics/sponsor-click");
  },
  sponsorClicks() {
    return api.get("/admin/analytics/sponsor-clicks");
  },
  foundationDonations() {
    return api.get("/admin/analytics/foundation-donations");
  },
  foundationDonationsList() {
    return api.get("/admin/analytics/foundation-donations/list");
  },
};
