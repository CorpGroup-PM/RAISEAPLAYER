import { api } from "@/lib/api-client";

export const AuthService = {

  // ----- FOR FORGOT PASSWORD FLOW -----
  requestPasswordReset(email: string) {
    return api.post("/auth/forgot-password", { email });
  },

  verifyResetOtp(email: string, otp: string) {
    return api.post("/auth/verify-reset-otp", { email, otp });
  },

  resetPassword(email: string, resetToken: string, newPassword: string) {
  return api.post("/auth/reset-password", {
    email,
    resetToken,
    newPassword,
  });
},

  //register page
  sendOtp(email: string) {
  return api.post("/auth/send-otp", { email });
},

verifyOtp(email: string, otp: string) {
  return api.post("/auth/verify-email", { email, otp });
},

  register: async (payload: any) => {
    return api.post("/auth/register", payload);
  },

  login: async (payload: any) => {
    return api.post("/auth/login", payload);
  },
  
};
