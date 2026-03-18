import { api } from "@/lib/api-client";

export type CreateFoundationOrderPayload = {
  amount: number;
  guestName?: string;
  guestEmail?: string;
  guestMobile?: string;
};

export class FoundationService {
  static createOrder(payload: CreateFoundationOrderPayload) {
    return api.post("/foundation/create-order", payload);
  }
}
