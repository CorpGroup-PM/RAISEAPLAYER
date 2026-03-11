"use client";

import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

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
  const [statusFilter, setStatusFilter] = useState("ALL");

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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

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
    <div className="apPanel">
      {/* Header */}
      <div className="apPanelHeader">
        <h3 className="apPanelTitle">Payout Requests</h3>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 13,
              color: "#0f172a",
              background: "#fff",
              cursor: "pointer",
            }}
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

          <button className="apBtn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="apTableWrap">
        <table className="apTable">
          <thead>
            <tr>
              <th>Fundraiser</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Request Date</th>
              {(statusFilter === "ALL" || statusFilter === "PAID") && (
                <th>View More</th>
              )}
              {(statusFilter === "REJECTED" ||
                statusFilter === "FAILED" ||
                statusFilter === "ALL") && <th>Reason</th>}
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="apEmpty">
                  {loading ? "Loading…" : "No payout requests found."}
                </td>
              </tr>
            )}

            {items.map((x) => {
              const requestId = getRequestId(x);

              return (
                <tr key={x._rowKey}>
                  <td style={{ fontWeight: 600, color: "#0f172a" }}>
                    {x.creator?.name ?? "—"}
                  </td>

                  <td className="apAmount">₹{x.amount}</td>

                  <td>
                    <AdminStatusBadge status={x.status} />
                  </td>

                  <td>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {x.status === "PENDING" && (
                        <>
                          <button
                            className="apBtn apBtnPrimary"
                            onClick={() => doApprove(x)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
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
                          <button
                            className="apBtn apBtnPrimary"
                            onClick={() => doProcessing(x)}
                          >
                            Processing
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
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
                          <button
                            className="apBtn apBtnPrimary"
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
                            className="btn btn-danger btn-sm"
                            data-bs-toggle="modal"
                            data-bs-target={`#processModal-${requestId}`}
                            onClick={() => {
                              setActiveRequestId(requestId!);
                              setActiveMode("FAIL");
                            }}
                          >
                            Fail
                          </button>

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
                                          updateReason(
                                            x._rowKey,
                                            e.target.value,
                                          )
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
                    </div>
                  </td>

                  <td className="apDate">
                    {new Date(x.createdAt).toLocaleDateString("en-IN")}
                  </td>

                  {(statusFilter === "ALL" || statusFilter === "PAID") && (
                    <td>
                      {x.status === "PAID" ? (
                        <button
                          className="apViewBtn"
                          onClick={() => {
                            setActivePayout(x);
                            setShowModal(true);
                          }}
                        >
                          View
                        </button>
                      ) : (
                        <span className="apDate">—</span>
                      )}
                    </td>
                  )}

                  {(statusFilter === "REJECTED" ||
                    statusFilter === "FAILED" ||
                    statusFilter === "ALL") && (
                    <td className="apReason">
                      {x.status === "REJECTED"
                        ? x.reviewReason || "—"
                        : x.status === "FAILED"
                          ? x.failReason || "—"
                          : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payout Detail Modal */}
      {showModal && activePayout && (
        <div className="apModalBackdrop">
          <div className="apModal">
            <div className="apModalHeader">
              <h3 className="apModalTitle">Payout Details</h3>
              <button
                className="apModalClose"
                onClick={() => {
                  setShowModal(false);
                  setActivePayout(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="apModalBody">
              <div className="apModalRow">
                <span className="apModalLabel">Request ID</span>
                <span className="apModalValue apModalMono">
                  {activePayout.requestId}
                </span>
              </div>

              <div className="apModalRow">
                <span className="apModalLabel">Amount</span>
                <span className="apModalValue apModalAmount">
                  ₹{activePayout.amount}
                </span>
              </div>

              <div className="apModalRow">
                <span className="apModalLabel">Status</span>
                <AdminStatusBadge status={activePayout.status} />
              </div>

              <div className="apModalRow">
                <span className="apModalLabel">Request Date</span>
                <span className="apModalValue">
                  {new Date(activePayout.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>

              {activePayout.processedAt && (
                <div className="apModalRow">
                  <span className="apModalLabel">Processed At</span>
                  <span className="apModalValue">
                    {new Date(activePayout.processedAt).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="apModalRow">
                <span className="apModalLabel">Note</span>
                <span className="apModalValue">
                  {activePayout.notes || "—"}
                </span>
              </div>

              {activePayout?.proofImageUrl && (
                <div className="apModalProof">
                  <span className="apModalLabel">Payment Proof</span>
                  <img
                    src={activePayout.proofImageUrl}
                    alt="Payment proof"
                    className="apProofImg"
                  />
                  <button
                    className="apBtn apBtnPrimary"
                    onClick={() =>
                      window.open(activePayout.proofImageUrl, "_blank")
                    }
                  >
                    View Full Image
                  </button>
                </div>
              )}
            </div>

            <div className="apModalFooter">
              <button
                className="apBtn"
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

      {/* Reject Modal */}
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
