"use client";
import { useRef, useState } from "react";
import { AdminPayoutsService } from "@/services/adminPayouts.service";
import { v4 as uuid } from "uuid";
import AlertModal from "@/components/ui/AlertModal";

export default function AdminProcessForm({
  requestId,
  onDone,
}: {
  requestId: string;
  onDone: () => void;
}) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  const submit = async () => {
    if (!transactionId || !paymentDate) {
      setAlertMsg("Transaction ID and Date are required");
      return;
    }

    const form = new FormData();
    form.append("transactionId", transactionId);
    form.append("paymentDate", paymentDate);
    form.append("notes", notes);
    form.append("idempotencyKey", uuid());
    if (file) form.append("proofImage", file);

    setLoading(true);
    try {
      await AdminPayoutsService.process(requestId, form);

      const dismissBtn = document.querySelector(
        '.modal.show [data-bs-dismiss="modal"]',
      ) as HTMLElement;
      dismissBtn?.click();

      onDone();
    } catch {
      // Error toast shown by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Transaction ID */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Transaction ID *</label>
        <input
          style={inputStyle}
          placeholder="e.g. TXN123456789"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />
      </div>

      {/* Payment Date */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Payment Date & Time *</label>
        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => dateInputRef.current?.showPicker()}
        >
          <input
            ref={dateInputRef}
            style={{ ...inputStyle, cursor: "pointer" }}
            type="datetime-local"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>
      </div>

      {/* Payment Proof */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Payment Proof (optional)</label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            border: "1px dashed #cbd5e1",
            borderRadius: 8,
            cursor: "pointer",
            background: "#f8fafc",
            fontSize: 13,
            color: "#64748b",
          }}
        >
          <span style={{ fontSize: 18 }}>📎</span>
          <span>{file ? file.name : "Click to upload image"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: "none" }}
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              if (selected) {
                const ALLOWED = ["image/jpeg", "image/png"];
                const MAX_MB = 2;
                if (!ALLOWED.includes(selected.type)) {
                  setAlertMsg("Only JPEG or PNG images are allowed.");
                  e.target.value = "";
                  return;
                }
                if (selected.size > MAX_MB * 1024 * 1024) {
                  setAlertMsg(
                    `Payment proof is too large (${(selected.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_MB} MB — please reduce the image size and try again.`
                  );
                  e.target.value = "";
                  return;
                }
              }
              setFile(selected);
            }}
          />
        </label>
        <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
          JPEG or PNG · Max 2 MB
        </span>
      </div>

      {/* Notes */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          placeholder="Add any notes about this payment…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        className="apBtn apBtnPrimary"
        style={{ alignSelf: "flex-end", padding: "10px 24px", fontSize: 14 }}
        disabled={loading}
        onClick={submit}
      >
        {loading ? "Processing…" : "Mark as Paid"}
      </button>

      {alertMsg && (
        <AlertModal
          message={alertMsg}
          type="warning"
          onClose={() => setAlertMsg("")}
        />
      )}
    </div>
  );
}
