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
      toastManager.show("Enter a valid amount", "error");
      return;
    }

    if (num > available) {
      toastManager.show("Amount exceeds available balance", "error");
      return;
    }

    try {
      setLoading(true);
      await PayoutRequestsService.create(fundraiserId, num);
      toastManager.show("Withdrawal request submitted successfully", "success");
      setAmount("");
      onSuccess();
    } catch (e: any) {
      toastManager.show(
        e?.response?.data?.message || "Failed to submit withdrawal request",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdraw-box">
      <h3>Request Withdrawal</h3>
      <p>
        Available balance:{" "}
        <strong style={{ color: "#111827" }}>₹{available.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </p>

      <div className="withdraw-input-row">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount (₹)"
          min={1}
          max={available}
        />
        {available > 0 && (
          <button
            className="withdraw-max-btn"
            type="button"
            onClick={() => setAmount(String(Math.floor(available)))}
          >
            Max
          </button>
        )}
      </div>

      <button className="withdraw-submit-btn" disabled={loading || available <= 0} onClick={submit}>
        {loading ? "Submitting…" : "Request Withdrawal"}
      </button>

      {available <= 0 && (
        <p className="withdraw-no-balance">No balance available for withdrawal.</p>
      )}
    </div>
  );
}
