"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import "./adminDonations.css";
import { adminAnalytics } from "@/services/adminAnalytics.service";

type DonorRow = {
  id: string;
  fundraiserId: string;

  donorId: string | null;

  donor?: {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string| null;
  } | null;

  guestName: string | null;
  guestEmail: string | null;
  guestMobile: string | null;

  donationAmount: string;
  platformTipAmount: string;
  totalAmount: string;
  currency: string;

  isAnonymous: boolean;
  message: string | null;
  status: string;
  createdAt: string;
};


const ROWS_PER_PAGE = 25;

export default function AdminAllDonationsPage() {
  const [items, setItems] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status")?.toUpperCase() || null;

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAnalytics.listAllDonors(statusFilter ?? undefined);
      setItems(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(items.length / ROWS_PER_PAGE));
  const paginated = items.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <>
      <div className="admin-donations-page admin-page-wrapper">
        <div className="admin-donations-head">
          <h2>{statusFilter ? `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Payments` : "All Donations"}</h2>
          <span className="count">{items.length} records</span>
        </div>

        <div className="admin-donations-table-wrap">
          <table className="admin-donations-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Contact</th>
                <th>Donation</th>
                <th>Foundation Fund</th>
                <th>Total Paid</th>
                <th>Status</th>
                <th>Date</th>
                <th>Fundraiser</th>
              </tr>
            </thead>

            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="skeleton-cell" /></td>
                  ))}
                </tr>
              ))}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    No donations found
                  </td>
                </tr>
              )}

              {paginated.map((x) => (
                <tr key={x.id}>
                  {/* Donor */}
                  <td>
                    <strong>
                      {x.isAnonymous
                        ? "Anonymous"
                        : x.donor?.firstName
                          ? `${x.donor.firstName} ${x.donor.lastName ?? ""}`
                          : x.guestName || "—"}
                    </strong>

                    <div style={{ marginTop: 4 }}>
                      {x.isAnonymous && (
                        <span className="tag anonymous">Anonymous</span>
                      )}

                      {!x.isAnonymous && x.donorId && (
                        <span className="tag user">User</span>
                      )}

                      {!x.isAnonymous && !x.donorId && (
                        <span className="tag guest">Guest</span>
                      )}
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <div className="sub">
                      {x.isAnonymous ? "—" : x.donor?.email || x.guestEmail || "—"}
                    </div>

                    <div className="sub">
                      {x.isAnonymous
                        ? "—"
                        : x.donor?.phoneNumber || x.guestMobile || "—"}
                    </div>
                  </td>

                  {/* Donation */}
                  <td>
                    ₹{Number(x.donationAmount).toLocaleString()}
                    
                  </td>
                  <td>
                     ₹{Number(x.platformTipAmount).toLocaleString()}
                    </td>

                  {/* Total */}
                  <td>
                    <strong>₹{Number(x.totalAmount).toLocaleString()}</strong>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`tag ${x.status === "SUCCESS" ? "user" : x.status === "FAILED" ? "anonymous" : "guest"}`}>
                      {x.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td>
                    {new Date(x.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  {/* Fundraiser */}
                  
                  <td>
                    {/* <span className="fundraiser-link">
                      {x.fundraiserId.slice(0, 8)}…
                    </span> */}

                    <button
                      type="button"
                      className="view-btn"
                      onClick={() => router.push(`/admin/campaigns/${x.fundraiserId}`)}
                    >
                      View
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="donations-pagination">
              <button
                className="donations-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="donations-page-info">Page {page} of {totalPages}</span>
              <button
                className="donations-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
