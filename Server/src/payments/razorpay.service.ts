import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  async createOrder(params: {
    amount: number; // in paise
    currency: string;
    receipt: string;
  }) {
    return this.razorpay.orders.create({
      amount: params.amount,
      currency: params.currency,
      receipt: params.receipt,
    });
  }
}