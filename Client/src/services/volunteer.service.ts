import { api } from "@/lib/api-client";

export const VolunteerService = {
  apply(payload: { city: string; message?: string }) {
    return api.post("/volunteer", payload);
  },

  getMyStatus() {
    return api.get("/volunteer/me");
  },

  verifyPortal(payload: { volunteerId: string; password?: string }) {
    return api.post("/volunteer/portal-verify", payload);
  },

  addActivity(formData: FormData) {
    return api.post("/volunteer/activities", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMyActivities() {
    return api.get("/volunteer/activities");
  },

  getPublicVolunteers(page = 1, limit = 12) {
    return api.get(`/volunteer/public?page=${page}&limit=${limit}`);
  },

  getAllPublicActivities(page = 1, limit = 12) {
    return api.get(`/volunteer/public/activities?page=${page}&limit=${limit}`);
  },

  getPublicActivities(volunteerId: string) {
    return api.get(`/volunteer/public/${volunteerId}/activities`);
  },

  deleteActivity(id: string) {
    return api.delete(`/volunteer/activities/${id}`);
  },

  // Admin
  listVolunteers() {
    return api.get("/admin/volunteers");
  },

  acceptVolunteer(id: string) {
    return api.put(`/admin/volunteers/${id}/accept`);
  },

  rejectVolunteer(id: string) {
    return api.put(`/admin/volunteers/${id}/reject`);
  },

  getVolunteerActivities(id: string) {
    return api.get(`/admin/volunteers/${id}/activities`);
  },
};
