"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPayoutsService } from "@/services/adminPayouts.service";
import type { AdminPayoutItem } from "@/types/payout.types";
import "./adminPayouts.css";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "apBadge pending",
  APPROVED:   "apBadge approved",
  PROCESSING: "apBadge processing",
  PAID:       "apBadge paid",
  FAILED:     "apBadge failed",
  REJECTED:   "apBadge rejected",
  CANCELLED:  "apBadge cancelled",
};

const ALL_STATUSES = ["ALL", "PENDING", "APPROVED", "PROCESSING", "PAID", "FAILED", "REJECTED", "CANCELLED"] as const;
type FilterStatus = (typeof ALL_STATUSES)[number];
const ROWS_PER_PAGE = 25;

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function AdminAllPayoutsTable() {
  const [items, setItems]             = useState<AdminPayoutItem[]>([]);
  const [filter, setFilter]           = useState<FilterStatus>("ALL");
  const [loading, setLoading]         = useState(false);
  const [activePayout, setActivePayout] = useState<AdminPayoutItem | null>(null);
  const [page, setPage]               = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await AdminPayoutsService.allList();
      setItems(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── summary counts ── */
  const total      = items.length;
  const pending    = items.filter((i) => i.status === "PENDING").length;
  const processing = items.filter((i) => i.status === "PROCESSING").length;
  const paid       = items.filter((i) => i.status === "PAID").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const failed     = items.filter((i) => i.status === "FAILED").length;
  const rejected   = items.filter((i) => i.status === "REJECTED").length;

  const filtered = filter === "ALL" ? items : items.filter((i) => i.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <div className="apPage">
      <div className="apContainer">

        {/* Header */}
        <div className="apHeader admin-page-wrapper">
          <div>
            <h1 className="apTitle">PAYOUT REQUESTS</h1>
            <p className="apSubtitle">Manage and track all fundraiser withdrawal requests</p>
          </div>
          <button className="apBtn apBtnPrimary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="apSummary">
          <div className="apSummaryCard">
            <div className="apSummaryLabel">Total Requests</div>
            <div className="apSummaryValue">{total}</div>
          </div>
          <div className="apSummaryCard">
            <div className="apSummaryLabel">Pending</div>
            <div className={`apSummaryValue ${pending > 0 ? "warn" : ""}`}>{pending}</div>
          </div>
          <div className="apSummaryCard">
            <div className="apSummaryLabel">Processing</div>
            <div className={`apSummaryValue ${processing > 0 ? "info" : ""}`}>{processing}</div>
          </div>
          <div className="apSummaryCard">
            <div className="apSummaryLabel">Total Paid Out</div>
            <div className="apSummaryValue good">{fmt(paid)}</div>
          </div>
          <div className="apSummaryCard">
            <div className="apSummaryLabel">Failed</div>
            <div className={`apSummaryValue ${failed > 0 ? "bad" : ""}`}>{failed}</div>
          </div>
          <div className="apSummaryCard">
            <div className="apSummaryLabel">Rejected</div>
            <div className={`apSummaryValue ${rejected > 0 ? "warn" : ""}`}>{rejected}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="apFilters">
          {ALL_STATUSES.map((s) => {
            const count = s === "ALL" ? total : items.filter((i) => i.status === s).length;
            return (
              <button
                key={s}
                className={`apFilterBtn${filter === s ? " active" : ""}`}
                onClick={() => { setFilter(s); setPage(1); }}
              >
                {s === "ALL" ? `All (${total})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Table Panel */}
        <div className="apPanel">
          <div className="apPanelHeader">
            <h3 className="apPanelTitle">
              {filter === "ALL" ? "All Payout Requests" : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Requests`}
            </h3>
            <span className="apCount">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="apTableWrap">
            {loading ? (
              <div className="apLoading">Loading payouts…</div>
            ) : filtered.length === 0 ? (
              <div className="apEmpty">No payout requests found.</div>
            ) : (
              <table className="apTable">
                <thead>
                  <tr>
                    <th>Fundraiser</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Requested On</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <Link
                          href={`/admin/campaigns/${x.fundraiserId}`}
                          className="apCampaignLink"
                        >
                          {x.fundraiserName ?? "Fundraiser"}
                        </Link>
                        <div className="apFundraiserId">{x.fundraiserId?.slice(0, 8)}…</div>
                      </td>

                      <td className="apAmount">{fmt(Number(x.amount) || 0)}</td>

                      <td>
                        <span className={STATUS_COLORS[x.status] || "apBadge"}>
                          {x.status}
                        </span>
                      </td>

                      <td className="apReason">
                        {x.status === "REJECTED"
                          ? x.reviewReason || "—"
                          : x.status === "FAILED"
                          ? x.failedReason || "—"
                          : "—"}
                      </td>

                      <td className="apDate">
                        {new Date(x.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td>
                        {x.status === "PAID" ? (
                          <button
                            className="apViewBtn"
                            onClick={() => setActivePayout(x)}
                          >
                            View
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {totalPages > 1 && (
              <div className="apPagination">
                <button
                  className="apPageBtn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span className="apPageInfo">Page {page} of {totalPages}</span>
                <button
                  className="apPageBtn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Payout Detail Modal */}
      {activePayout && (
        <div className="apModalBackdrop" onClick={() => setActivePayout(null)}>
          <div className="apModal" onClick={(e) => e.stopPropagation()}>
            <div className="apModalHeader">
              <h3 className="apModalTitle">Payout Details</h3>
              <button className="apModalClose" onClick={() => setActivePayout(null)}>✕</button>
            </div>

            <div className="apModalBody">
              <div className="apModalRow">
                <span className="apModalLabel">Fundraiser</span>
                <span className="apModalValue">{activePayout.fundraiserName ?? "—"}</span>
              </div>
              <div className="apModalRow">
                <span className="apModalLabel">Amount</span>
                <span className="apModalValue apModalAmount">{fmt(Number(activePayout.amount) || 0)}</span>
              </div>
              <div className="apModalRow">
                <span className="apModalLabel">Status</span>
                <span className={STATUS_COLORS[activePayout.status] || "apBadge"}>
                  {activePayout.status}
                </span>
              </div>
              <div className="apModalRow">
                <span className="apModalLabel">Requested</span>
                <span className="apModalValue">
                  {new Date(activePayout.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>

              {activePayout.processedAt && (
                <div className="apModalRow">
                  <span className="apModalLabel">Processed</span>
                  <span className="apModalValue">
                    {new Date(activePayout.processedAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {activePayout.transactionId && (
                <div className="apModalRow">
                  <span className="apModalLabel">Transaction ID</span>
                  <span className="apModalValue apModalMono">{activePayout.transactionId}</span>
                </div>
              )}

              {activePayout?.payout?.notes?.trim() && (
                <div className="apModalRow">
                  <span className="apModalLabel">Note</span>
                  <span className="apModalValue">{activePayout.payout.notes.trim()}</span>
                </div>
              )}

              {activePayout?.payout?.proofImageUrl && (
                <div className="apModalProof">
                  <span className="apModalLabel">Payment Proof</span>
                  <img
                    src={activePayout.payout.proofImageUrl}
                    alt="Payment proof"
                    className="apProofImg"
                  />
                  <button
                    className="apBtn apBtnPrimary"
                    style={{ marginTop: 8 }}
                    onClick={() => window.open(activePayout.payout.proofImageUrl, "_blank")}
                  >
                    View Full Image
                  </button>
                </div>
              )}
            </div>

            <div className="apModalFooter">
              <button className="apBtn" onClick={() => setActivePayout(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
