"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import "./adminDonations.css";
import AdminNavbar from "@/components/admin/AdminNavbar";
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


export default function AdminAllDonationsPage() {
  const [items, setItems] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAnalytics.listAllDonors();
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <AdminNavbar />
      <div className="admin-donations-page">
        <div className="admin-donations-head">
          <h2>All Donations</h2>
          <span className="count">{items.length} records</span>
        </div>

        <div className="admin-donations-table-wrap">
          <table className="admin-donations-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Contact</th>

                <th>Donation</th>
                <th>Platform Fund</th>
                <th>Total Paid</th>
                <th>Date</th>
                <th>Fundraiser</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="empty">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    No donations found
                  </td>
                </tr>
              )}

              {items.map((x) => (
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
        </div>
      </div>
    </>
  );
}
