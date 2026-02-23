import { api } from "@/lib/api-client";

export const PublicPayoutsService = {
  getSummary(fundraiserId: string) {
    return api.get(`/fundraisers/${fundraiserId}/payouts`);
  },
};
