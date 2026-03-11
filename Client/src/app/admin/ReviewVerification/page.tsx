"use client";

import { useEffect, useState } from "react";
import { AdminReviewsService } from "@/services/admin-reviews.service";
import AdminModal from "@/components/admin/AdminModal";
import "./reviewverification.css";

type Review = {
  id: string;
  name?: string;
  rating?: number;
  message?: string;
  isVerified?: boolean;
  createdAt?: string;
};

type Filter = "ALL" | "PENDING" | "APPROVED";

function StarRating({ rating }: { rating?: number }) {
  if (!rating) return <span style={{ color: "#94a3b8" }}>—</span>;
  return (
    <span className="rvStars">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
      <span className="rvRatingNum">{rating}/5</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const [items, setItems]           = useState<Review[]>([]);
  const [loading, setLoading]       = useState(false);
  const [filter, setFilter]         = useState<Filter>("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [errorModal, setErrorModal]     = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const load = async () => {
    try {
      setLoading(true);
      const res = await AdminReviewsService.getAll();
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await AdminReviewsService.approve(id);
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, isVerified: true } : r));
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  const doDeleteClick = (id: string) => {
    setConfirmModal({ open: true, id });
  };

  const doDeleteConfirm = async () => {
    const id = confirmModal.id!;
    setConfirmModal({ open: false, id: null });
    try {
      setProcessingId(id);
      await AdminReviewsService.deleteReview(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setErrorModal({ open: true, message: err?.response?.data?.message || "Delete failed." });
    } finally {
      setProcessingId(null);
    }
  };

  /* ── summary ── */
  const total    = items.length;
  const pending  = items.filter((x) => !x.isVerified).length;
  const approved = items.filter((x) => x.isVerified).length;
  const ratings  = items.filter((x) => x.rating).map((x) => x.rating!);
  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
    : "—";

  const filtered = items.filter((x) => {
    if (filter === "PENDING")  return !x.isVerified;
    if (filter === "APPROVED") return x.isVerified;
    return true;
  });

  return (
    <>
    <div className="rvPage">
      <div className="rvContainer">

        {/* Header */}
        <div className="rvHeader admin-page-wrapper">
          <div>
            <h1 className="rvTitle">REVIEW VERIFICATION</h1>
            <p className="rvSubtitle">Moderate and approve campaign reviews</p>
          </div>
          <button className="rvBtn rvBtnPrimary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="rvSummary">
          <div className="rvSummaryCard">
            <div className="rvSummaryLabel">Total Reviews</div>
            <div className="rvSummaryValue">{total}</div>
          </div>
          <div className="rvSummaryCard">
            <div className="rvSummaryLabel">Pending</div>
            <div className={`rvSummaryValue ${pending > 0 ? "warn" : ""}`}>{pending}</div>
          </div>
          <div className="rvSummaryCard">
            <div className="rvSummaryLabel">Approved</div>
            <div className="rvSummaryValue good">{approved}</div>
          </div>
          <div className="rvSummaryCard">
            <div className="rvSummaryLabel">Avg Rating</div>
            <div className="rvSummaryValue accent">{avgRating}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="rvFilters">
          {(["ALL", "PENDING", "APPROVED"] as Filter[]).map((f) => {
            const count = f === "ALL" ? total : f === "PENDING" ? pending : approved;
            return (
              <button
                key={f}
                className={`rvFilterBtn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? `All (${total})` : `${f.charAt(0) + f.slice(1).toLowerCase()} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Table Panel */}
        <div className="rvPanel">
          <div className="rvPanelHeader">
            <h3 className="rvPanelTitle">
              {filter === "PENDING" ? "Pending Reviews" : filter === "APPROVED" ? "Approved Reviews" : "All Reviews"}
            </h3>
            <span className="rvCount">{filtered.length} review{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="rvTableWrap">
            {loading ? (
              <div className="rvLoading">Loading reviews…</div>
            ) : filtered.length === 0 ? (
              <div className="rvEmpty">No reviews found.</div>
            ) : (
              <table className="rvTable">
                <thead>
                  <tr>
                    <th>Reviewer</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <div className="rvName">{x.name || "—"}</div>
                        <div className="rvId">{x.id.slice(0, 8)}…</div>
                      </td>

                      <td><StarRating rating={x.rating} /></td>

                      <td>
                        {x.message ? (
                          <div className="rvCommentWrapper">
                            <div className="rvCommentClamp">{x.message}</div>
                            <div className="rvCommentTooltip">{x.message}</div>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      <td className="rvDate">
                        {x.createdAt
                          ? new Date(x.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td>
                        <span className={`rvStatusBadge ${x.isVerified ? "approved" : "pending"}`}>
                          {x.isVerified ? "Approved" : "Pending"}
                        </span>
                      </td>

                      <td>
                        {!x.isVerified ? (
                          <div className="rvActions">
                            <button
                              className="rvApproveBtn"
                              disabled={processingId === x.id}
                              onClick={() => doApprove(x.id)}
                            >
                              {processingId === x.id ? "…" : "Approve"}
                            </button>
                            <button
                              className="rvDeleteBtn"
                              disabled={processingId === x.id}
                              onClick={() => doDeleteClick(x.id)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <button
                            className="rvDeleteBtn"
                            disabled={processingId === x.id}
                            onClick={() => doDeleteClick(x.id)}
                          >
                            Delete
                          </button>
                        )}
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

    {/* Confirm Delete Modal */}
    <AdminModal
      open={confirmModal.open}
      variant="error"
      title="Delete Review"
      message="Are you sure you want to delete this review? This action cannot be undone."
      confirmLabel="Yes, Delete"
      cancelLabel="Cancel"
      onConfirm={doDeleteConfirm}
      onClose={() => setConfirmModal({ open: false, id: null })}
    />

    {/* Error Modal */}
    <AdminModal
      open={errorModal.open}
      variant="error"
      title="Action Failed"
      message={errorModal.message}
      onClose={() => setErrorModal({ open: false, message: "" })}
    />
    </>
  );
}
