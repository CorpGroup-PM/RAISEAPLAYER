"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminCampaignsService } from "@/services/admin-campaigns.service";
import "./bank-accounts.css";

type RecipientAccount = {
  id: string;
  firstName: string;
  lastName: string;
  recipientType: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  country: string;
  isVerified: boolean;
  createdAt: string;
  fundraiser: {
    id: string;
    title: string;
    status: string;
    creator: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
};

function mask(acc: string) {
  if (!acc || acc.length < 4) return acc;
  return "•".repeat(acc.length - 4) + acc.slice(-4);
}

function prettyType(t: string) {
  return String(t || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminBankAccountsPage() {
  const [accounts, setAccounts] = useState<RecipientAccount[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState<"ALL" | "UNVERIFIED" | "VERIFIED">("ALL");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AdminCampaignsService.listBankAccounts(false);
      setAccounts(res.data?.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load bank accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total      = accounts.length;
  const unverified = accounts.filter((a) => !a.isVerified).length;
  const verified   = accounts.filter((a) => a.isVerified).length;

  const filtered = accounts.filter((a) => {
    if (filter === "UNVERIFIED") return !a.isVerified;
    if (filter === "VERIFIED")   return a.isVerified;
    return true;
  });

  return (
    <div className="abPage">
      <div className="abContainer">

        {/* Header */}
        <div className="abHeader admin-page-wrapper">
          <div>
            <h1 className="abTitle">BANK ACCOUNTS</h1>
            <p className="abSubtitle">Recipient account verification for fundraiser payouts</p>
          </div>
          <button className="abBtn abBtnPrimary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {error && <div className="abError">{error}</div>}

        {/* Summary */}
        <div className="abSummary">
          <div className="abSummaryCard">
            <div className="abSummaryLabel">Total Accounts</div>
            <div className="abSummaryValue">{total}</div>
          </div>
          <div className="abSummaryCard">
            <div className="abSummaryLabel">Unverified</div>
            <div className={`abSummaryValue ${unverified > 0 ? "warn" : ""}`}>{unverified}</div>
          </div>
          <div className="abSummaryCard">
            <div className="abSummaryLabel">Verified</div>
            <div className="abSummaryValue good">{verified}</div>
          </div>
          <div className="abSummaryCard">
            <div className="abSummaryLabel">Verification Rate</div>
            <div className={`abSummaryValue ${total > 0 && verified / total >= 0.8 ? "good" : "warn"}`}>
              {total > 0 ? `${Math.round((verified / total) * 100)}%` : "—"}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="abFilters">
          {(["ALL", "UNVERIFIED", "VERIFIED"] as const).map((f) => (
            <button
              key={f}
              className={`abFilterBtn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? `All (${total})` : f === "UNVERIFIED" ? `Unverified (${unverified})` : `Verified (${verified})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="abPanel">
          <div className="abPanelHeader">
            <h3 className="abPanelTitle">
              {filter === "UNVERIFIED" ? "Unverified Bank Accounts" : filter === "VERIFIED" ? "Verified Bank Accounts" : "All Bank Accounts"}
            </h3>
            <span className="abCount">{filtered.length} account{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="abTableWrap">
            {loading ? (
              <div className="abLoading">Loading accounts…</div>
            ) : filtered.length === 0 ? (
              <div className="abEmpty">No accounts found.</div>
            ) : (
              <table className="abTable">
                <thead>
                  <tr>
                    <th>Account Holder</th>
                    <th>Bank Details</th>
                    <th>Campaign</th>
                    <th>Creator</th>
                    <th>Added</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="abHolderName">
                          {a.firstName} {a.lastName}
                        </div>
                        <div className="abHolderType">{prettyType(a.recipientType)}</div>
                      </td>
                      <td>
                        <div className="abBankName">{a.bankName}</div>
                        <div className="abAccountNum">{mask(a.accountNumber)}</div>
                        {a.ifscCode && (
                          <div className="abIfsc">{a.ifscCode}</div>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/admin/campaigns/${a.fundraiser.id}`}
                          className="abCampaignLink"
                        >
                          {a.fundraiser.title.length > 30
                            ? a.fundraiser.title.slice(0, 30) + "…"
                            : a.fundraiser.title}
                        </Link>
                        <div className={`abCampaignStatus abStatus_${a.fundraiser.status.toLowerCase()}`}>
                          {a.fundraiser.status}
                        </div>
                      </td>
                      <td>
                        <div className="abCreatorName">
                          {a.fundraiser.creator.firstName} {a.fundraiser.creator.lastName}
                        </div>
                        <div className="abCreatorEmail">{a.fundraiser.creator.email}</div>
                      </td>
                      <td style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
                        {new Date(a.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className={`abStatusBadge ${a.isVerified ? "verified" : "unverified"}`}>
                          {a.isVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
