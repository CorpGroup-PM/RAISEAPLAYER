import { api } from "@/lib/api-client";

export const adminAnalytics = {
  listAllDonors() {
    return api.get("/admin/campaigns/allDonor");
  },

  listAllUsers() {
    return api.get("/admin/campaigns/user/all");
  },

  getPlatformTips() {
    return api.get("/admin/campaigns/getplatformtips");
  },
};
