"use client";
import { useEffect, useState } from "react";
import { PayoutRequestsService } from "@/services/payoutRequests.service";
import StatusCard from "./FundraiserStatusBadge";
import "./payouts.css";

export default function WithdrawalHistoryTable({
  fundraiserId,
  onRefresh,
  refreshKey = 0,
}: {
  fundraiserId: string;
  onRefresh?: () => void;
  refreshKey?: number;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [activePayout, setActivePayout] = useState<any>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const [cancelId, setCancelId] = useState<string | null>(null);

  const filteredItems =
    statusFilter === "ALL"
      ? items
      : items.filter((x) => x.status === statusFilter);

  const load = async () => {
    try {
      setLoading(true);
      const res = await PayoutRequestsService.list(fundraiserId);
      setItems(res.data.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const confirmCancel = async () => {
    if (!cancelId) return;
    await PayoutRequestsService.cancel(fundraiserId, cancelId);
    setCancelId(null);
    await load();
    onRefresh?.();
  };

  /** Returns a human-readable note for the row (rejection / failure reason). */
  const getNote = (x: any): string => {
    if (x.status === "REJECTED") return x.reviewReason || "—";
    if (x.status === "FAILED") return x.failedReason || "—";
    return "—";
  };

  const closeModal = () => {
    setShowModal(false);
    setActivePayout(null);
  };

  return (
    <div className="withdrawal-card">

      {/* HEADER */}
      <div className="withdraw-header">
        <h4>Withdrawal History</h4>
        <div className="withdraw-filter">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PAID">Paid</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="withdraw-empty">Loading…</div>
      ) : filteredItems.length === 0 ? (
        <div className="withdraw-empty">No withdrawals for this filter.</div>
      ) : (
        <div className="withdraw-table-wrap">
          <table className="withdraw-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((x) => (
                <tr key={x.id}>
                  <td>{new Date(x.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="wt-amount">₹{Number(x.amount).toLocaleString("en-IN")}</td>
                  <td><StatusCard status={x.status} /></td>
                  <td className="wt-note">{getNote(x)}</td>
                  <td>
                    <div className="wt-actions">
                      {x.status === "PENDING" && (
                        <button className="wt-cancel-btn" onClick={() => setCancelId(x.id)}>
                          Cancel
                        </button>
                      )}
                      {x.status === "PAID" && (
                        <button
                          className="view-btn"
                          onClick={() => {
                            setActivePayout(x);
                            setShowModal(true);
                          }}
                        >
                          View
                        </button>
                      )}
                      {x.status !== "PENDING" && x.status !== "PAID" && (
                        <span className="wt-dash">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAYOUT DETAIL MODAL */}
      {showModal && activePayout && (
        <div className="rp-modal-backdrop" onClick={closeModal}>
          <div className="rp-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Payout Details</h3>

            <div className="modal-row">
              <span className="label">Amount</span>
              <span className="value">₹{Number(activePayout.amount).toLocaleString("en-IN")}</span>
            </div>

            <div className="modal-row">
              <span className="label">Status</span>
              <StatusCard status={activePayout.status} />
            </div>

            <div className="modal-row">
              <span className="label">Requested On</span>
              <span className="value">
                {new Date(activePayout.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>

            {activePayout.processedAt && (
              <div className="modal-row">
                <span className="label">Processed On</span>
                <span className="value">
                  {new Date(activePayout.processedAt).toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {activePayout.transactionId && (
              <div className="modal-row">
                <span className="label">Transaction ID</span>
                <span className="value">{activePayout.transactionId}</span>
              </div>
            )}

            {activePayout.proofImageUrl && (
              <div className="modal-proof">
                <span className="label">Payment Proof</span>
                <img
                  src={activePayout.proofImageUrl}
                  alt="Payment proof"
                  className="proof-preview"
                  onClick={() => setShowImageViewer(true)}
                />
                <div className="proof-actions">
                  <button className="proof-btn" onClick={() => setShowImageViewer(true)}>
                    View Full Screen
                  </button>
                </div>
              </div>
            )}

            <div className="rp-modal-actions">
              <button className="action-btn" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelId && (
        <div className="confirm-backdrop" onClick={() => setCancelId(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3 className="confirm-title">Cancel Withdrawal</h3>
            <p className="confirm-desc">
              Are you sure you want to cancel this withdrawal request? This action cannot be undone.
            </p>

            <div className="confirm-actions">
              <button className="confirm-btn confirm-btn-secondary" onClick={() => setCancelId(null)}>
                No, Keep It
              </button>
              <button className="confirm-btn confirm-btn-danger" onClick={confirmCancel}>
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN IMAGE VIEWER */}
      {showImageViewer && (
        <div
          className="image-viewer-backdrop"
          onClick={() => setShowImageViewer(false)}
        >
          <div className="image-viewer" onClick={(e) => e.stopPropagation()}>
            <img src={activePayout?.proofImageUrl} alt="Payment proof full view" />
            <button
              className="image-viewer-close"
              onClick={() => setShowImageViewer(false)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
