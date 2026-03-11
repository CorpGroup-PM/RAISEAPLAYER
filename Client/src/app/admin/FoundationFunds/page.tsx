"use client";

import { useEffect, useState } from "react";
import "./adminPlatformTips.css";
import { adminAnalytics } from "@/services/adminAnalytics.service";

type PlatformTip = {
  donationId: string;
  platformTipAmount: string;
  donorName: string;
  donorEmail: string;
  isGuest: boolean;
  isAnonymous: boolean;
  createdAt: string;
};

type Filter = "ALL" | "GUEST" | "USER" | "ANONYMOUS";

export default function AdminPlatformTipsPage() {
  const [items, setItems]   = useState<PlatformTip[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAnalytics.getPlatformTips();
      setItems(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── summary ── */
  const total     = items.length;
  const totalTips = items.reduce((s, x) => s + Number(x.platformTipAmount || 0), 0);
  const guests    = items.filter((x) => x.isGuest).length;
  const anon      = items.filter((x) => x.isAnonymous).length;
  const users     = items.filter((x) => !x.isGuest).length;

  const filtered = items.filter((x) => {
    if (filter === "GUEST")     return x.isGuest;
    if (filter === "USER")      return !x.isGuest;
    if (filter === "ANONYMOUS") return x.isAnonymous;
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
            <h1 className="ffTitle">FOUNDATION FUNDS</h1>
            <p className="ffSubtitle">Platform tips collected from donor contributions</p>
          </div>
          <button className="ffBtn ffBtnPrimary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="ffSummary">
          <div className="ffSummaryCard">
            <div className="ffSummaryLabel">Total Tips Collected</div>
            <div className="ffSummaryValue good">{fmt(totalTips)}</div>
          </div>
          <div className="ffSummaryCard">
            <div className="ffSummaryLabel">Total Records</div>
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
          <div className="ffSummaryCard">
            <div className="ffSummaryLabel">Anonymous</div>
            <div className="ffSummaryValue warn">{anon}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="ffFilters">
          {(["ALL", "GUEST", "USER", "ANONYMOUS"] as Filter[]).map((f) => {
            const count =
              f === "ALL" ? total :
              f === "GUEST" ? guests :
              f === "USER" ? users : anon;
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
              {filter === "ALL" ? "All Tips" :
               filter === "GUEST" ? "Guest Donor Tips" :
               filter === "USER" ? "Registered User Tips" : "Anonymous Tips"}
            </h3>
            <span className="ffCount">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="ffTableWrap">
            {loading ? (
              <div className="ffLoading">Loading tips…</div>
            ) : filtered.length === 0 ? (
              <div className="ffEmpty">No records found.</div>
            ) : (
              <table className="ffTable">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Email</th>
                    <th>Tip Amount</th>
                    <th>Type</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x) => (
                    <tr key={x.donationId}>
                      <td>
                        <div className="ffDonorName">
                          {x.isAnonymous ? "Anonymous" : x.donorName || "—"}
                        </div>
                        <div className="ffDonationId">{x.donationId.slice(0, 8)}…</div>
                      </td>

                      <td className="ffEmail">
                        {x.isAnonymous ? <span style={{ color: "#94a3b8" }}>—</span> : x.donorEmail}
                      </td>

                      <td className="ffAmount">{fmt(Number(x.platformTipAmount) || 0)}</td>

                      <td>
                        <span className={`ffTypeBadge ${x.isGuest ? "guest" : "user"}`}>
                          {x.isGuest ? "Guest" : "User"}
                        </span>
                        {x.isAnonymous && (
                          <span className="ffTypeBadge anon" style={{ marginLeft: 6 }}>Anon</span>
                        )}
                      </td>

                      <td className="ffDate">
                        {new Date(x.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
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
