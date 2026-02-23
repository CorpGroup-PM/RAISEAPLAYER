"use client";
import { useEffect, useState } from "react";
import { PayoutRequestsService } from "@/services/payoutRequests.service";
import StatusCard from "./FundraiserStatusBadge";
import "./payouts.css";


export default function WithdrawalHistoryTable({
  fundraiserId,
}: {
  fundraiserId: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("PAID");
  const filteredItems =
    statusFilter === "ALL"
      ? items
      : items.filter((x) => x.status === statusFilter);

  const [showModal, setShowModal] = useState(false);
  const [activePayout, setActivePayout] = useState<any>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);



  const load = async () => {
    const res = await PayoutRequestsService.list(fundraiserId);
    setItems(res.data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id: string) => {
    if (!confirm("Cancel this payout request?")) return;
    await PayoutRequestsService.cancel(fundraiserId, id);
    load();
  };

  return (

    <div className="withdraw-history">
      <div className="withdraw-header">
        <h4>Withdrawal History</h4>
        <div className="withdraw-filter">
          <label>Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="APPROVED">Approved</option>
            <option value="CANCELLED">Cancelled</option>

          </select>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            {(statusFilter === "ALL" ||
              statusFilter === "FAILED" ||
              statusFilter === "REJECTED") && <th>Reason</th>}

            <th>Action</th>
            {(statusFilter === "PAID" || statusFilter === "ALL") && (
              <th>View More</th>
            )}

          </tr>
        </thead>

        <tbody>
          {filteredItems.length === 0 && (
            <tr>
              <td colSpan={statusFilter === "PAID" ? 6 : 5}>
                No withdrawals for selected status
              </td>
            </tr>
          )}

          {filteredItems.map((x) => (
            <tr key={x.id}>
              <td>{new Date(x.createdAt).toLocaleDateString("en-IN")}</td>
              <td>₹{x.amount}</td>
              <td>
                <StatusCard status={x.status} />
              </td>
              {(statusFilter === "ALL" ||
                statusFilter === "FAILED" ||
                statusFilter === "REJECTED") && (
                  <td>
                    {x.status === "REJECTED"
                      ? x.reviewReason || "-"
                      : x.status === "FAILED"
                        ? x.failedReason || "-"
                        : "-"}
                  </td>
                )}

              <td>
                {x.status === "PENDING" && (
                  <button onClick={() => cancel(x.id)}>Cancel</button>
                )}
              </td>

              {(statusFilter === "ALL" || statusFilter === "PAID") && (
                <td>
                  {x.status === "PAID" ? (
                    <button
                      className="view-btn"
                      onClick={() => {
                        setActivePayout(x);
                        setShowModal(true);
                      }}
                    >
                      View
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>

      </table>

      {showModal && activePayout && (
        <div className="rp-modal-backdrop">
          <div className="rp-modal">
            <h3>Payout Details</h3>

            <div className="modal-row">
              <span className="label">Amount</span>
              <span className="value">₹{activePayout.amount}</span>
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

            <div className="modal-row">
              <span className="label">Processed On</span>
              <span className="value">
                {new Date(activePayout.processedAt).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="modal-row">
              <span className="label">Transaction ID</span>
              <span className="value">{activePayout.transactionId}</span>
            </div>

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
                  <button
                    className="proof-btn"
                    onClick={() => setShowImageViewer(true)}
                  >
                    View Full Screen
                  </button>

                  {/* <a
                    href={activePayout.proofImageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proof-btn outline"
                  >
                    Download
                  </a> */}
                </div>
              </div>
            )}


            <div className="rp-modal-actions">
              <button
                className="action-btn"
                onClick={() => {
                  setShowModal(false);
                  setActivePayout(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {showImageViewer && (
        <div
          className="image-viewer-backdrop"
          onClick={() => setShowImageViewer(false)}
        >
          <div
            className="image-viewer"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePayout.proofImageUrl}
              alt="Payment proof full view"
            />

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
