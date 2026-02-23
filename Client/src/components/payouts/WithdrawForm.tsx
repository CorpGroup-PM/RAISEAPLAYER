"use client";
import { useState } from "react";
import { PayoutRequestsService } from "@/services/payoutRequests.service";
import { toastManager } from "@/lib/toast-manager";

export default function WithdrawForm({
  fundraiserId,
  available,
  onSuccess,
}: {
  fundraiserId: string;
  available: number;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const num = Number(amount);

  const submit = async () => {
    if (!num || num <= 0) {
      toastManager.show("Enter valid amount", "error");
      return;
    }

    if (num > available) {
     // toastManager.show("Amount exceeds available balance", "error");
      return;
    }

    try {
      setLoading(true);
      await PayoutRequestsService.create(fundraiserId, num);
     // toastManager.show("Withdrawal request created", "success");
      setAmount("");
      onSuccess();
    } catch (e: any) {
      console.log(e)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdraw-box">
      <h3>Request Withdrawal</h3>
      <p>Available: ₹{available.toFixed(2)}</p>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
      />

      <button disabled={loading} onClick={submit}>
        {loading ? "Submitting..." : "Withdraw"}
      </button>
    </div>
  );
}
