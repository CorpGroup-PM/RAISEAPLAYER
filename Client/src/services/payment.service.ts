// src/services/payment.service.ts

import { api } from "@/lib/api-client";

export type CreateOrderPayload = {
  fundraiserId: string;
  donationAmount: number;
  platformTipAmount: number;
  isAnonymous: boolean;
  guestName?: string;
  guestEmail?: string;
  guestMobile?: string;
};

export class PaymentService {
  static createOrder(payload: CreateOrderPayload) {
    return api.post("/payments/create-order", payload);
  }
}
