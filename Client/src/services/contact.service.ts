
import { api } from "@/lib/api-client";

export interface ContactPayload {
  name: string;
  email: string;
  phoneNumber?: string;
  message: string;
}

export const ContactService = {
  sendMessage(payload: ContactPayload) {
    return api.post("/contactus", payload);
  },
};
