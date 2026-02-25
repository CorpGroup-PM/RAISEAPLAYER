import { api } from "@/lib/api-client";

export const AdminPayoutsService = {
  list(params: {
    fundraiserId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    return api.get("/admin/payouts/list", { params });
  },
  
   allList(status?: string) {
    return api.get("/admin/payouts/alllist", {
      params: status ? { status } : {},
    });
  },

  approve(id: string) {
    return api.patch(`/admin/payouts/${id}/approve`,{});
  },

  reject(id: string, reason: string) {
    return api.patch(`/admin/payouts/${id}/reject`, { reason });
  },

  processing(id: string) {
    return api.patch(`/admin/payouts/${id}/processing`,{});
  },

  fail(id: string, reason: string) {
    return api.patch(`/admin/payouts/${id}/fail`, { reason });
  },

  process(requestId: string, form: FormData) {
    return api.post(`/admin/payouts/${requestId}/process`, form);
  },
};
