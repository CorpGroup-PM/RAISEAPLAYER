// services/userDonations.service.ts
import { api } from "@/lib/api-client";

export const UserDonationsService = {
  list(params?: { status?: string }) {
    return api.get("/me/donations", { params });
  },

  downloadReceipt(donationId: string) {
    return api.get(`/me/donations/${donationId}/receipt`, {
      responseType: "blob", // ✅ VERY IMPORTANT
    });
  },
};
