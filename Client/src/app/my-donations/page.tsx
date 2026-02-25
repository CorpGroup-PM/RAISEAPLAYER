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

// const STATUS_TABS = [
//   { label: "All", value: undefined },
//   { label: "Success", value: "SUCCESS" },
//   { label: "Pending", value: "PENDING" },
//   { label: "Failed", value: "FAILED" },
// ];

export default function MyDonationsPage() {
  const [items, setItems] = useState<Donation[]>([]);
  const [status, setStatus] = useState<string | undefined>(undefined);
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

  // ✅ DOWNLOAD RECEIPT HANDLER
  const downloadReceipt = async (donationId: string) => {
    try {
      const res = await UserDonationsService.downloadReceipt(donationId);

      const blob = new Blob([res.data], {
        type: "application/pdf",
      });

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

      {/* STATUS FILTER */}
      {/* <div className="donation-status-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            className={`status-tab ${status === tab.value ? "active" : ""}`}
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div> */}

      {/* TABLE */}
      <div className="donations-table-wrapper">
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

                {/* Donation */}
                <td>
                  <div className="amount-row">

                    ₹{Number(x.donationAmount).toLocaleString()}
                  </div>
                </td>
                <td>
                  <div className="amount-row">

                    ₹{Number(x.platformTipAmount).toLocaleString()}

                  </div>
                </td>


                {/* Total */}
                <td>
                  <strong>₹{Number(x.totalPaid).toLocaleString()}</strong>
                </td>

                <td>
                  <div className="status-with-action">
                    <span className={`donation-status ${x.status.toLowerCase()}`}>
                      {x.status}
                    </span>

                  </div>
                </td>

                <td>{new Date(x.donatedAt).toLocaleDateString("en-IN")}</td>
                <td>
                  <div>
                    {x.status === "SUCCESS" && x.receiptDownloadUrl && (

                      <button
                        className="download-receipt-btn"
                        onClick={() => downloadReceipt(x.donationId)}
                      >
                        Download Receipt
                      </button>

                    )}
                  </div>
                </td>
              </tr>
            ))}

            
          </tbody>
        </table>
      </div>
    </div>
  );
}
