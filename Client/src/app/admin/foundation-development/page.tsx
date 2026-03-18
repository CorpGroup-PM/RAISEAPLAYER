"use client";

import { useEffect, useState } from "react";
import { AnalyticsService } from "@/services/analytics.service";
import "./foundationDevelopment.css";

type DonationRow = {
  id: string;
  donorId: string | null;
  donorName: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestMobile: string | null;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
};

type Filter = "ALL" | "GUEST" | "USER";

export default function FoundationDevelopmentPage() {
  const [items, setItems] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");

  const load = async () => {
    try {
      setLoading(true);
      const res = await AnalyticsService.foundationDonationsList();
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── summary (SUCCESS only) ── */
  const successItems = items.filter((x) => x.status === "SUCCESS");
  const total        = successItems.length;
  const totalAmount  = successItems.reduce((s, x) => s + Number(x.amount || 0), 0);
  const guests       = successItems.filter((x) => !x.donorId).length;
  const users        = successItems.filter((x) => !!x.donorId).length;

  const filtered = items.filter((x) => {
    if (filter === "GUEST") return !x.donorId;
    if (filter === "USER")  return !!x.donorId;
    return true;
  });

  function fmt(n: number) {
    return "₹" + n.toLocaleString("en-IN");
  }

  return (
    <div className="ffPage">
      <div className="ffContainer">

        {/* Header */}
        <div className="ffHeader admin-page-wrapper">
          <div>
            <h1 className="ffTitle">FOUNDATION DEVELOPMENT</h1>
            <p className="ffSubtitle">Donations received directly for foundation development</p>
          </div>
          <button className="ffBtn ffBtnPrimary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="ffSummary">
          <div className="ffSummaryCard">
            <div className="ffSummaryLabel">Total Amount Raised</div>
            <div className="ffSummaryValue good">{fmt(totalAmount)}</div>
          </div>
          <div className="ffSummaryCard">
            <div className="ffSummaryLabel">Total Donations</div>
            <div className="ffSummaryValue">{total}</div>
          </div>
          <div className="ffSummaryCard">
            <div className="ffSummaryLabel">Guest Donors</div>
            <div className="ffSummaryValue info">{guests}</div>
          </div>
          <div className="ffSummaryCard">
            <div className="ffSummaryLabel">Registered Users</div>
            <div className="ffSummaryValue accent">{users}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="ffFilters">
          {(["ALL", "GUEST", "USER"] as Filter[]).map((f) => {
            const count = f === "ALL" ? total : f === "GUEST" ? guests : users;
            return (
              <button
                key={f}
                className={`ffFilterBtn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()} ({count})
              </button>
            );
          })}
        </div>

        {/* Table Panel */}
        <div className="ffPanel">
          <div className="ffPanelHeader">
            <h3 className="ffPanelTitle">
              {filter === "ALL" ? "All Donations" : filter === "GUEST" ? "Guest Donations" : "Registered User Donations"}
            </h3>
            <span className="ffCount">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="ffTableWrap">
            {loading ? (
              <div className="ffLoading">Loading donations…</div>
            ) : filtered.length === 0 ? (
              <div className="ffEmpty">No records found.</div>
            ) : (
              <table className="ffTable">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Email / Mobile</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x) => {
                    const name  = x.donorId ? (x.donorName || "Registered User") : (x.guestName || "—");
                    const email = x.donorId ? "—" : (x.guestEmail || x.guestMobile || "—");
                    const isUser = !!x.donorId;
                    return (
                      <tr key={x.id}>
                        <td>
                          <div className="ffDonorName">{name}</div>
                          <div className="ffDonationId">{x.id.slice(0, 8)}…</div>
                        </td>
                        <td className="ffEmail">{email}</td>
                        <td className="ffAmount">{fmt(Number(x.amount) || 0)}</td>
                        <td>
                          <span className={`ffTypeBadge ${isUser ? "user" : "guest"}`}>
                            {isUser ? "User" : "Guest"}
                          </span>
                        </td>
                        <td>
                          <span className={`ffTypeBadge ${x.status === "SUCCESS" ? "user" : x.status === "FAILED" ? "anon" : "guest"}`}>
                            {x.status}
                          </span>
                        </td>
                        <td className="ffDate">
                          {new Date(x.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
