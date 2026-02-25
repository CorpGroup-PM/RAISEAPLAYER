"use client";

import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { AdminPayoutsService } from "@/services/adminPayouts.service";
import AdminStatusBadge from "./AdminStatusBadge";
import AdminProcessForm from "./AdminProcessForm";
import "./adminPayouts.css";

type AdminPayoutRow = {
  id?: string;
  requestId?: string;
  fundraiserId?: string;
  amount?: string | number;
  creator?: { name?: string };
  status: string;
  createdAt: string;

  reviewReason?: string;
  failReason?: string;

  reason?: string;
  _rowKey: string;
};

export default function AdminPayoutList({
  fundraiserId,
}: {
  fundraiserId: string;
}) {
  const [items, setItems] = useState<AdminPayoutRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PAID");

  const [rejectRowKey, setRejectRowKey] = useState<string | null>(null);

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"PAID" | "FAIL" | null>(null);
  const [activePayout, setActivePayout] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  /* ================= LOAD ================= */

  const load = async () => {
    if (!fundraiserId) return;

    try {
      setLoading(true);
      const res = await AdminPayoutsService.list({
        fundraiserId,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });

      const raw = res?.data?.data?.items ?? [];

      setItems(
        raw.map((x: any) => ({
          ...x,
          reason: x.failReason ?? x.reviewReason ?? "",
          _rowKey: String(x.id ?? crypto.randomUUID()),
        })),
      );
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [fundraiserId, statusFilter]);

  const getRequestId = (x: AdminPayoutRow) => x.id ?? x.requestId;

  const updateReason = (rowKey: string, reason: string) => {
    setItems((prev) =>
      prev.map((r) => (r._rowKey === rowKey ? { ...r, reason } : r)),
    );
  };

  /* ================= ACTIONS ================= */

  const doApprove = async (x: AdminPayoutRow) => {
    const id = getRequestId(x);
    if (!id) return;
    await AdminPayoutsService.approve(id);
    load();
  };

  const doProcessing = async (x: AdminPayoutRow) => {
    const id = getRequestId(x);
    if (!id) return;
    await AdminPayoutsService.processing(id);
    load();
  };

  const doReject = async () => {
    const row = items.find((i) => i._rowKey === rejectRowKey);
    if (!row?.reason?.trim()) return;

    const id = getRequestId(row);
    if (!id) return;

    await AdminPayoutsService.reject(id, row.reason.trim());
    load();
  };

  const doFail = async (x: AdminPayoutRow) => {
    const id = getRequestId(x);
    if (!id || !x.reason?.trim()) return;
    await AdminPayoutsService.fail(id, x.reason.trim());
    load();
  };

  /* ================= UI ================= */

  return (
    <div className="admin-payouts">
      <div className="admin-payouts-head">
        <h3>Payout Requests</h3>

        <div className="admin-payout-controls">
          <select
            className="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Fundraiser</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
            <th>Request date</th>
            {/* {items.some(i => i.status === "REJECTED"||i.status === "FAILED ||i.status === "FAILED") && <th>Reason</th>} */}
            {(statusFilter === "ALL" || statusFilter === "PAID") && (
              <th>View More</th>
            )}
            {(statusFilter === "REJECTED" ||
              statusFilter === "FAILED" ||
              statusFilter === "ALL") && (
                <th>Reason</th>
              )}


          </tr>
        </thead>

        <tbody>
          {items.map((x) => {
            const requestId = getRequestId(x);

            return (
              <tr key={x._rowKey}>
                <td>{x.creator?.name ?? "—"}</td>
                <td>₹{x.amount}</td>

                <td className="admin-status-cell">
                  <AdminStatusBadge status={x.status} />

                  {x.reason &&
                    (x.status === "REJECTED" || x.status === "FAILED") && (
                      <span className="admin-reason-tooltip-wrapper">
                        ⓘ
                        <span className="admin-reason-tooltip">{x.reason}</span>
                      </span>
                    )}
                </td>

                <td>
                  {x.status === "PENDING" && (
                    <>
                      <button onClick={() => doApprove(x)}>Approve</button>

                      <button
                        className="btn btn-danger"
                        data-bs-toggle="modal"
                        data-bs-target="#rejectModal"
                        onClick={() => setRejectRowKey(x._rowKey)}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {x.status === "APPROVED" && (
                    <>
                      <button onClick={() => doProcessing(x)}>
                        Processing
                      </button>

                      <button
                        className="btn btn-danger"
                        data-bs-toggle="modal"
                        data-bs-target="#rejectModal"
                        onClick={() => setRejectRowKey(x._rowKey)}
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {x.status === "PROCESSING" && (
                    <>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-primary"
                          data-bs-toggle="modal"
                          data-bs-target={`#processModal-${requestId}`}
                          onClick={() => {
                            setActiveRequestId(requestId!);
                            setActiveMode("PAID");
                          }}
                        >
                          Mark Paid
                        </button>

                        <button
                          className="btn btn-danger"
                          data-bs-toggle="modal"
                          data-bs-target={`#processModal-${requestId}`}
                          onClick={() => {
                            setActiveRequestId(requestId!);
                            setActiveMode("FAIL");
                          }}
                        >
                          Fail
                        </button>
                      </div>
                      <div
                        className="modal fade"
                        id={`processModal-${requestId}`}
                        tabIndex={-1}
                      >
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                          <div className="modal-content">
                            <div className="modal-header">
                              <h5 className="modal-title">
                                {activeMode === "PAID"
                                  ? "Process Payout"
                                  : "Fail Payout"}
                              </h5>
                              <button
                                className="btn-close"
                                data-bs-dismiss="modal"
                              />
                            </div>

                            <div className="modal-body">
                              {activeMode === "PAID" && (
                                <AdminProcessForm
                                  requestId={requestId!}
                                  onDone={load}
                                />
                              )}

                              {activeMode === "FAIL" && (
                                <>
                                  <label>Failure Reason</label>
                                  <textarea
                                    className="form-control"
                                    rows={4}
                                    value={x.reason ?? ""}
                                    onChange={(e) =>
                                      updateReason(x._rowKey, e.target.value)
                                    }
                                  />
                                </>
                              )}
                            </div>

                            <div className="modal-footer">
                              <button
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                              >
                                Close
                              </button>

                              {activeMode === "FAIL" && (
                                <button
                                  className="btn btn-danger"
                                  data-bs-dismiss="modal"
                                  onClick={() => doFail(x)}
                                >
                                  Fail Payout
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </td>
                <td>{new Date(x.createdAt).toLocaleDateString("en-IN")}</td>
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
                {(statusFilter === "REJECTED" ||
                  statusFilter === "FAILED" ||
                  statusFilter === "ALL") && (
                    <td>
                      {x.status === "REJECTED"
                        ? x.reviewReason || "-"
                        : x.status === "FAILED"
                          ? x.failReason || "-"
                          : "-"}
                    </td>
                  )}


              </tr>
            );
          })}
        </tbody>
      </table>

      {showModal && activePayout && (
        <div className="rp-modal-backdrop">
          <div className="rp-modal">
            <h3>Payout Details</h3>

            {/* <div className="modal-row">
              <span className="label">Fundraiser ID</span>
              <span className="value">
                {activePayout.fundraiserId?.slice(0, 8)}
              </span>
            </div> */}

            <div className="modal-row">
              <span className="label">Request ID</span>
              <span className="value">
                {activePayout.requestId}
              </span>
            </div>

            <div className="modal-row">
              <span className="label">Amount</span>
              <span className="value">₹{activePayout.amount}</span>
            </div>

            <div className="modal-row">
              <span className="label">Status</span>
              <AdminStatusBadge status={activePayout.status} />
            </div>

            <div className="modal-row">
              <span className="label">Request Date</span>
              <span className="value">
                {new Date(activePayout.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>

            {activePayout.processedAt && (
              <div className="modal-row">
                <span className="label">Process Date</span>
                <span className="value">
                  {new Date(activePayout.processedAt).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <div className="modal-row">
              <span className="label">Note</span>
              <span className="value">
                {activePayout.notes || "-"}
              </span>
            </div>

            {activePayout?.proofImageUrl && (
              <div className="modal-proof">
                <span className="label">Payment Proof</span>

                <img
                  src={activePayout.proofImageUrl}
                  alt="Payment proof"
                  className="proof-preview"
                />

                <div className="proof-actions">
                  <button
                    className="view-full-btn"
                    onClick={() =>
                      window.open(activePayout.proofImageUrl, "_blank")
                    }
                  >
                    View Full Image
                  </button>
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


      {/* ✅ SINGLE REJECT MODAL */}
      <div className="modal fade" id="rejectModal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Reject Payout</h5>
              <button className="btn-close" data-bs-dismiss="modal" />
            </div>

            <div className="modal-body">
              <label>Reason *</label>
              <textarea
                className="form-control"
                rows={4}
                value={
                  items.find((i) => i._rowKey === rejectRowKey)?.reason ?? ""
                }
                onChange={(e) =>
                  rejectRowKey && updateReason(rejectRowKey, e.target.value)
                }
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>

              <button
                className="btn btn-danger"
                data-bs-dismiss="modal"
                disabled={
                  !items.find((i) => i._rowKey === rejectRowKey)?.reason?.trim()
                }
                onClick={doReject}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
