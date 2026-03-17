import { api } from "@/lib/api-client";

export const adminAnalytics = {
  listAllDonors(status?: string) {
    return api.get("/admin/campaigns/allDonor", { params: status ? { status, limit: 100 } : { limit: 100 } });
  },

  listAllUsers() {
    return api.get("/admin/campaigns/user/all");
  },

  getPlatformTips() {
    return api.get("/admin/campaigns/getplatformtips");
  },
};
