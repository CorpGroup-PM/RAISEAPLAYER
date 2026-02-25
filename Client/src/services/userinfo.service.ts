import { api } from "@/lib/api-client";

export const UserInfoService = {
  getByCampaignId(campaignId: string) {
    return api.get(`/admin/campaigns/${campaignId}/userinfo`);
  },
};
