import { api } from "@/lib/api-client";

export const PayoutRequestsService = {
  create(fundraiserId: string, amount: number) {
    return api.post(`/payout-requests/${fundraiserId}/payout-requests`, {
      amount,
    });
  },

  list(fundraiserId: string) {
    return api.get(`/payout-requests/${fundraiserId}/payout-requests`);
  },

  cancel(fundraiserId: string, requestId: string) {
    return api.delete(
      `/payout-requests/${fundraiserId}/payout-requests/${requestId}`
    );
  },
};
