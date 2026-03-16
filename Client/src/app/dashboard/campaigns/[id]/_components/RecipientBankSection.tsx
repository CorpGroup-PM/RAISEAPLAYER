"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { RecipientAccountService } from "@/services/recipientAccount.service";
import type { RecipientAccount } from "@/types/campaign.types";

const recipientSchema = z.object({
  recipientType: z.string().min(1, "Select recipient type"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  accountNumber: z
    .string()
    .refine(
      (val) => val === "" || (/^\d+$/.test(val) && val.length >= 9 && val.length <= 18),
      { message: "Account number must be 9–18 digits" }
    ),
  bankName: z.string().min(1, "Bank name is required"),
  ifscCode: z
    .string()
    .min(1, "IFSC code is required")
    .regex(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      "Invalid IFSC — must be 4 letters, '0', 6 alphanumeric (e.g. SBIN0001234)"
    ),
  country: z.string().min(1, "Country is required"),
});

interface Props {
  campaignId: string;
  existingAccount: RecipientAccount | null;
  isRejected: boolean;
  onSaved: (account: RecipientAccount) => void;
}

export default function RecipientBankSection({ campaignId, existingAccount, isRejected, onSaved }: Props) {
  const [form, setForm] = useState({
    recipientType: "PARENT_GUARDIAN",
    firstName: "",
    lastName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    country: "India",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingAccount) return;
    setForm({
      recipientType: existingAccount.recipientType,
      firstName: existingAccount.firstName,
      lastName: existingAccount.lastName,
      accountNumber: "",
      bankName: existingAccount.bankName,
      ifscCode: existingAccount.ifscCode,
      country: existingAccount.country,
    });
  }, [existingAccount]);

  const handleSave = async () => {
    const result = recipientSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (!result.data.accountNumber && !existingAccount) {
      setErrors({ accountNumber: "Account number is required" });
      return;
    }
    setErrors({});
    try {
      setSaving(true);
      const payload: Record<string, unknown> = { ...form };
      if (!form.accountNumber) delete payload.accountNumber;
      const res = await RecipientAccountService.upsert(campaignId, payload);
      onSaved(res.data.data);
    } catch { /* error handled by axios interceptor toast */ } finally {
      setSaving(false);
    }
  };

  return (
    <section className="recipient-wrapper">
      <section className="recipient-card">

        {/* Header */}
        <div className="recipient-header">
          <div className="recipient-header-icon">🏦</div>
          <div>
            <h4 className="recipient-title">Recipient Bank Account</h4>
            <p className="recipient-subtitle">Funds will be transferred to this account</p>
          </div>
          {existingAccount && (
            <span className={`recipient-badge ${existingAccount.isVerified ? "verified" : "pending"}`}>
              {existingAccount.isVerified ? "✅ Verified" : "⏳ Pending"}
            </span>
          )}
        </div>

        <div className="recipient-divider" />

        {/* Recipient Type */}
        <div className="rfield-group">
          <label className="rfield-label">Recipient Type</label>
          <select
            className="recipient-input"
            value={form.recipientType}
            onChange={(e) => setForm({ ...form, recipientType: e.target.value })}
          >
            <option value="PARENT_GUARDIAN">Parent / Guardian</option>
            <option value="SELF">Self</option>
            <option value="COACH">Coach</option>
          </select>
        </div>

        {/* Name Row */}
        <div className="recipient-row">
          <div className="rfield-group">
            <label className="rfield-label">First Name</label>
            <input className="recipient-input" placeholder="e.g. Ramesh" value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            {errors.firstName && <p className="error-text" role="alert">{errors.firstName}</p>}
          </div>
          <div className="rfield-group">
            <label className="rfield-label">Last Name</label>
            <input className="recipient-input" placeholder="e.g. Kumar" value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            {errors.lastName && <p className="error-text" role="alert">{errors.lastName}</p>}
          </div>
        </div>

        {/* Account Number + Bank Name Row */}
        <div className="recipient-row">
          <div className="rfield-group">
            <label className="rfield-label">
              Account Number
              {existingAccount?.accountNumber && (
                <span className="account-mask-badge">{existingAccount.accountNumber}</span>
              )}
            </label>
            <input
              className="recipient-input"
              placeholder={existingAccount ? "Enter new number to change" : "e.g. 012345678901"}
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            />
            {errors.accountNumber && <p className="error-text" role="alert">{errors.accountNumber}</p>}
          </div>
          <div className="rfield-group">
            <label className="rfield-label">Bank Name</label>
            <input className="recipient-input" placeholder="e.g. State Bank of India" value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
            {errors.bankName && <p className="error-text" role="alert">{errors.bankName}</p>}
          </div>
        </div>

        {/* IFSC + Country Row */}
        <div className="recipient-row">
          <div className="rfield-group">
            <label className="rfield-label">IFSC Code</label>
            <input className="recipient-input" placeholder="e.g. SBIN0001234" value={form.ifscCode}
              onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
            {errors.ifscCode && <p className="error-text" role="alert">{errors.ifscCode}</p>}
          </div>
          <div className="rfield-group">
            <label className="rfield-label">Country</label>
            <input className="recipient-input" placeholder="e.g. India" value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })} />
            {errors.country && <p className="error-text" role="alert">{errors.country}</p>}
          </div>
        </div>

        {!isRejected && (
          <button className="recipient-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save / Update Account"}
          </button>
        )}

      </section>
    </section>
  );
}
