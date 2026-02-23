"use client";

import { useEffect, useState } from "react";
import { PublicPayoutsService } from "@/services/publicPayouts.service";
import "./payoutSummary.css";

export default function PayoutSummary({ fundraiserId }: { fundraiserId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await PublicPayoutsService.getSummary(fundraiserId);
      console.log(res);
      
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [fundraiserId]);

  if (loading) {
    return (
      <div className="payout-skeleton">
        <div className="skel-row" />
        <div className="skel-row" />
        <div className="skel-table" />
      </div>
    );
  }

  if (!data || data.payoutCount === 0) {
    return (
      <div className="payout-card">
        <h3>Fund Utilization</h3>
        <p className="empty">No withdrawals yet</p>
      </div>
    );
  }

  return (
    <div className="payout-card">
      <h3>Fund Utilization</h3>


      <div className="summary-footer">
        {data.lastPayoutAt && (
          <span>
            Last payout on{" "}
            {new Date(data.lastPayoutAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
        <span>{data.payoutCount} withdrawals</span>
      </div>

      {/* Payout table */}
      <table className="payout-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Transferred To</th>
            <th>Account</th>
          </tr>
        </thead>

        <tbody>
          {data.items.map((p: any, i: number) => (
            <tr key={i}>
              <td>{new Date(p.date).toLocaleDateString()}</td>
              <td>₹{Number(p.amountTransferred).toLocaleString()}</td>
              <td>{p.accountHolder}</td>
              <td>{p.accountDetails}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
