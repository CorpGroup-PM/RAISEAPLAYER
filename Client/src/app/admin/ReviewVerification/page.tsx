"use client";

import { useEffect, useState } from "react";
import { AdminReviewsService } from "@/services/admin-reviews.service";
import "./reviewverification.css";

/* ================= TYPES ================= */
type Review = {
  id: string;
  name?: string;
  rating?: number;
  message?: string;
  isVerified?: boolean;
  createdAt?: string;
};

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* ================= STATUS ================= */
  const getStatus = (review: Review) => {
    return review.isVerified ? "APPROVED" : "PENDING";
  };

  /* ================= LOAD REVIEWS ================= */
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

  useEffect(() => {
    load();
  }, []);

  /* ================= APPROVE ================= */
  const doApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await AdminReviewsService.approve(id);

      setItems(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, isVerified: true }
            : r
        )
      );
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= DELETE ================= */
  const doDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;

    try {
      setProcessingId(id);
      await AdminReviewsService.deleteReview(id);

      // REMOVE FROM UI
      setItems(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setProcessingId(null);
    }
  };

  /* ================= FILTER ================= */
  const filteredItems =
    statusFilter === "ALL"
      ? items
      : items.filter(
        (x) => getStatus(x) === statusFilter
      );

  /* ================= UI ================= */
  return (
    <div className="admin-review-page">
      <h2 className="page-title">Campaign Reviews</h2>

      {/* FILTER */}
      <div className="review-filter">
        <label>Status:</label>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Reviewed</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="review-table-wrapper">
        {loading ? (
          <p className="loading">Loading reviews...</p>
        ) : (
          <table className="review-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((x) => {
                const status = getStatus(x);

                return (
                  <tr key={x.id}>
                    <td>{x.name || "-"}</td>
                    <td>{x.rating ?? "-"}</td>

                    <td className="comment">
                      {x.message || "-"}
                    </td>

                    <td>
                      {x.createdAt
                        ? new Date(x.createdAt).toLocaleDateString("en-IN")
                        : "-"}

                    </td>

                    <td>
                      {status === "PENDING" ? (
                        <div className="actions">
                          <button
                            className="approve-btn"
                            disabled={
                              processingId === x.id
                            }
                            onClick={() =>
                              doApprove(x.id)
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="delete-btn"
                            disabled={
                              processingId === x.id
                            }
                            onClick={() =>
                              doDelete(x.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="status APPROVED">
                          APPROVED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    No reviews found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
