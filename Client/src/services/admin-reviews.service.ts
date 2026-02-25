import { api } from "@/lib/api-client";

export const AdminReviewsService = {
  approve(reviewId: string) {
    return api.post(`/admin/campaigns/${reviewId}/review/approve`);
  },

  deleteReview(reviewId: string) {
    return api.delete(`/admin/campaigns/${reviewId}/review/deleted`);
  },

  getAll() {
    return api.get("/admin/campaigns/getAllReview/review");
  },
};
