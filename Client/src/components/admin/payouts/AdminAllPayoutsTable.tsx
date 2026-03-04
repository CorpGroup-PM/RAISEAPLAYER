"use client";

import { useEffect, useState } from "react";
import { AdminPayoutsService } from "@/services/adminPayouts.service";
import AdminStatusBadge from "./AdminStatusBadge";
import "./adminPayouts.css";
import { useRouter } from "next/navigation";

export default function AdminAllPayoutsTable() {
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("PAID");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [activePayout, setActivePayout] = useState<any>(null);


  const load = async () => {
    setLoading(true);

    const res =
      status === "ALL"
        ? await AdminPayoutsService.allList()
        : await AdminPayoutsService.allList(status);

    setItems(res.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [status]);

  const updateReason = (id: string, reason: string) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, reason } : r)));
  };

  return (
    <div className="admin-payouts-root admin-page-wrapper">
      <div className="admin-payouts-head">
        <h2>Payout Requests</h2>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PROCESSING">Processing</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <table className="admin-payouts-table">
        <thead>
          <tr>
            <th>FundraiserId</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
            <th>Request On</th>
            {items.some((i) => i.status === "PAID") && (
              <th>View More</th>
            )}
            {items.some((i) => i.status === "REJECTED"||i.status === "FAILED") && (
              <th>Reason</th>
            )}
          </tr>
        </thead>

        <tbody>
          {items.map((x) => (
            <tr key={x.id}>
              <td
                className="fundraiser-cell clickable"
                onClick={() =>
                  router.push(`/admin/campaigns/${x.fundraiserId}`)
                }
              >
                <div className="fundraiser-owner">
                  <strong>{x.fundraiserName ?? "Fundraiser"}</strong>
                  <div className="fundraiser-id">
                    {x.fundraiserId?.slice(0, 8)}
                  </div>
                </div>
              </td>

              <td>₹{x.amount}</td>
              <td>
                <AdminStatusBadge status={x.status} />
              </td>

              <td></td>

              <td>{new Date(x.createdAt).toLocaleDateString("en-IN")}</td>
              {items.some((i) => i.status === "PAID") && (
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

              {items.some((i) => i.status === "REJECTED" || i.status === "FAILED") && (
                <td>
                  {x.status === "REJECTED"
                    ? x.reviewReason || "-"
                    : x.status === "FAILED"
                      ? x.failedReason || "-"
                      : "-"}
                </td>

              )}


            </tr>
          ))}
        </tbody>
      </table>

      {loading && <p>Loading...</p>}

      {showModal && activePayout && (
        <div className="rp-modal-backdrop">
          <div className="rp-modal">
            <h3>Payout Details</h3>

            {/* <div className="modal-row">
              <span className="label">Fundraiser ID</span>
              <span className="value">{activePayout.fundraiserId?.slice(0, 8)}</span>
            </div> */}

            <div className="modal-row">
              <span className="label">Amount</span>
              <span className="value">₹{activePayout.amount}</span>
            </div>

            <div className="modal-row">
              <span className="label">Status</span>
              <AdminStatusBadge status={activePayout.status} />
            </div>
            <div className="modal-row">
              <span className="label">Request date</span>
              <span className="value">
                {new Date(activePayout.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
            {activePayout.status === "PAID" && (
              <>
                {activePayout.processedAt && (
                  <div className="modal-row">
                    <span className="label">Process Date</span>
                    <span className="value">
                      {new Date(activePayout.processedAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {activePayout.transactionId && (
                  <div className="modal-row">
                    <span className="label">Transaction ID</span>
                    <span className="value">
                      {activePayout.transactionId}
                    </span>
                  </div>
                )}
                {activePayout?.payout && (
                  <div className="modal-row">
                    <span className="label">Note</span>
                    <span className="value">
                      {activePayout.payout.notes?.trim() || "-"}
                    </span>
                  </div>
                )}


                {activePayout?.payout?.proofImageUrl && (
                  <div className="modal-proof">
                    <span className="label">Payment Proof</span>

                    <img
                      src={activePayout.payout.proofImageUrl}
                      alt="Payment proof"
                      className="proof-preview"
                    />

                    <div className="proof-actions">
                      <button
                        className="view-full-btn"
                        onClick={() =>
                          window.open(activePayout.payout.proofImageUrl, "_blank")
                        }
                      >
                        View Full Image
                      </button>
                    </div>
                  </div>
                )}

              </>
            )}

            {activePayout.reason && (
              <div className="modal-row">
                <span className="label">Reason</span>
                <span className="value">{activePayout.reason}</span>
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
    </div>
  );
}
