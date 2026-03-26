// src/services/user.service.ts

import { api } from "@/lib/api-client";

export const UserService = {
  getProfile() {
    return api.get("/user/profile");
  },

  updateProfile(payload: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    panDetails?: {
      panNumber: string | null;
      panName: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      pincode: string | null;
    };
    aadhaarDetails?: {
      aadhaarNumber: string | null;
    };
  }) {
    return api.put("/user/profile", payload);
  },

  getKycStatus() {
    return api.get("/user/kyc-status");
  },

  updateProfilePicture(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.put("/user/profile-picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updatePanPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.put("/user/pan-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateAadhaarFrontPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.put("/user/aadhaar-front-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateAadhaarBackPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return api.put("/user/aadhaar-back-pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
