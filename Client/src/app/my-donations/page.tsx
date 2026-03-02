"use client";

import { useEffect, useState } from "react";
import { UserDonationsService } from "@/services/userDonations.service";
import "./myDonations.css";

type Donation = {
  donationId: string;
  fundraiserId: string;
  fundraiserTitle: string;
  donationAmount: string;
  platformTipAmount: string;
  totalPaid: string;
  currency: string;
  status: string;
  donatedAt: string;
  receiptDownloadUrl?: string;
};

export default function MyDonationsPage() {
  const [items, setItems] = useState<Donation[]>([]);
  const [status] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await UserDonationsService.list({ status });
      setItems(res.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const downloadReceipt = async (donationId: string) => {
    try {
      const res = await UserDonationsService.downloadReceipt(donationId);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Donation_Receipt_${donationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download receipt");
    }
  };

  return (
    <div className="my-donations-page">
      <h1>My Donations</h1>

      {/* ── DESKTOP TABLE ── */}
      <div className="donations-table-wrapper desktop-only">
        <table className="donations-table">
          <thead>
            <tr>
              <th>Fundraiser</th>
              <th>Donation</th>
              <th>Foundation Fund</th>
              <th>Total Paid</th>
              <th>Status</th>
              <th>Date</th>
              <th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="loading-cell">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-cell">
                  No donations found
                </td>
              </tr>
            )}
            {items.map((x) => (
              <tr key={x.donationId}>
                <td>
                  <strong>{x.fundraiserTitle}</strong>
                  <div className="donation-id">
                    {x.fundraiserId.slice(0, 8)}
                  </div>
                </td>
                <td>₹{Number(x.donationAmount).toLocaleString()}</td>
                <td>₹{Number(x.platformTipAmount).toLocaleString()}</td>
                <td>
                  <strong>₹{Number(x.totalPaid).toLocaleString()}</strong>
                </td>
                <td>
                  <span className={`donation-status ${x.status.toLowerCase()}`}>
                    {x.status}
                  </span>
                </td>
                <td>{new Date(x.donatedAt).toLocaleDateString("en-IN")}</td>
                <td>
                  {x.status === "SUCCESS" && x.receiptDownloadUrl && (
                    <button
                      className="download-receipt-btn"
                      onClick={() => downloadReceipt(x.donationId)}
                    >
                      Download Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE CARDS ── */}
      <div className="mobile-only">
        {loading && <p className="loading-cell">Loading...</p>}
        {!loading && items.length === 0 && (
          <p className="empty-cell">No donations found</p>
        )}
        {items.map((x) => (
          <div key={x.donationId} className="donation-card">
            {/* Header */}
            <div className="card-header">
              <div>
                <div className="card-title">{x.fundraiserTitle}</div>
                <div className="donation-id">{x.fundraiserId.slice(0, 8)}</div>
              </div>
              <span className={`donation-status ${x.status.toLowerCase()}`}>
                {x.status}
              </span>
            </div>

            {/* Amount grid */}
            <div className="card-amounts">
              <div className="card-amount-item">
                <span className="card-amount-label">Donation</span>
                <span className="card-amount-value">
                  ₹{Number(x.donationAmount).toLocaleString()}
                </span>
              </div>
              <div className="card-amount-item">
                <span className="card-amount-label">Foundation Fund</span>
                <span className="card-amount-value">
                  ₹{Number(x.platformTipAmount).toLocaleString()}
                </span>
              </div>
              <div className="card-amount-item">
                <span className="card-amount-label">Total Paid</span>
                <span className="card-amount-value card-total">
                  ₹{Number(x.totalPaid).toLocaleString()}
                </span>
              </div>
              <div className="card-amount-item">
                <span className="card-amount-label">Date</span>
                <span className="card-amount-value">
                  {new Date(x.donatedAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Download button */}
            {x.status === "SUCCESS" && x.receiptDownloadUrl && (
              <button
                className="download-receipt-btn card-receipt-btn"
                onClick={() => downloadReceipt(x.donationId)}
              >
                Download Receipt
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
