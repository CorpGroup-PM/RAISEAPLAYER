"use client";
import { useState } from "react";
import { AdminPayoutsService } from "@/services/adminPayouts.service";
import { v4 as uuid } from "uuid";

export default function AdminProcessForm({
  requestId,
  onDone,
}: {
  requestId: string;
  onDone: () => void;
}) {
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!transactionId || !paymentDate) {
      alert("Transaction ID and Date are required");
      return;
    }

    const form = new FormData();
    form.append("transactionId", transactionId);
    form.append("paymentDate", paymentDate);
    form.append("notes", notes);
    form.append("idempotencyKey", uuid());
    if (file) form.append("proofImage", file);

    setLoading(true);
    await AdminPayoutsService.process(requestId, form);
    setLoading(false);
    onDone();
    
  };

  return (
    <div className="admin-process-form">
      <input
        placeholder="Transaction ID"
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
      />

      <input
        type="datetime-local"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
      />

      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <input
        placeholder="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button disabled={loading} onClick={submit}>
        {loading ? "Processing..." : "Mark Paid"}
      </button>

    </div>
  );
}
