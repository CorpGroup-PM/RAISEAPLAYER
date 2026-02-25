"use client";

import { useEffect, useState } from "react";
import "./adminPlatformTips.css";
import { adminAnalytics } from "@/services/adminAnalytics.service";

type PlatformTip = {
  donationId: string;
  platformTipAmount: string;
  donorName: string;
  donorEmail: string;
  isGuest: boolean;
  isAnonymous: boolean;
  createdAt: string;
};

export default function AdminPlatformTipsPage() {
  const [items, setItems] = useState<PlatformTip[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await adminAnalytics.getPlatformTips();
      setItems(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalTips = items.reduce(
    (sum, x) => sum + Number(x.platformTipAmount || 0),
    0,
  );

  return (
    <>
      <div className="admin-platform-tips-page">
        <h1>Foundation Funds</h1>

        {/* SUMMARY */}
        <div className="tips-summary">
          <div className="tips-card">
            <span>Total Tips Collected</span>
            <strong>₹{totalTips}</strong>
          </div>

          <div className="tips-card">
            <span>Total Records</span>
            <strong>{items.length}</strong>
          </div>
        </div>

        {/* TABLE */}
        <div className="tips-table-wrapper">
          <table className="tips-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Email</th>
                <th>Tip Amount</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="loading-cell">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No platform tips found
                  </td>
                </tr>
              )}

              {items.map((x) => (
                <tr key={x.donationId}>
                  <td>
                    <strong>{x.isAnonymous ? "Anonymous" : x.donorName}</strong>

                    <div className="donation-id">
                      {x.donationId.slice(0, 8)}
                    </div>
                  </td>


                  <td>
                    {x.donorEmail}
                  </td>


                  <td className="amount">₹{x.platformTipAmount}</td>

                  <td>
                    {x.isGuest && <span className="tag guest">Guest</span>}
                    {!x.isGuest && <span className="tag user">User</span>}
                  </td>

                  <td>{new Date(x.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
