import { api } from "@/lib/api-client";

export const RecipientAccountService = {
  upsert: (fundraiserId: string, payload: any) =>
    api.post(`/recipient-account/create/${fundraiserId}`, payload),

  verify: (recipientAccountId: string) =>
    api.put(`/admin/campaigns/${recipientAccountId}/verify`)
};
