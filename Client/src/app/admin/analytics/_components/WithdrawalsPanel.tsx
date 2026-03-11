"use client";

import { PanelSkeleton } from "./Skeletons";
import { inr, n, num } from "@/lib/format";

const tone = (s: string) => {
  const x = (s || "").toUpperCase();
  if (["FAILED", "REJECTED"].includes(x)) return "bad";
  if (["PENDING", "APPROVED"].includes(x)) return "warn";
  if (["PROCESSING"].includes(x)) return "info";
  return "good";
};

export default function WithdrawalsPanel({
  loading,
  data,
}: {
  loading: boolean;
  data: any;
}) {
  if (loading) return <PanelSkeleton />;

  const pipeline = data?.statusPipeline || [];
  const proc = data?.processingEfficiency || {};
  const paidPipeline = pipeline.find((x: any) => x.status === "PAID") || {
    count: 0,
    totalAmount: 0,
  };

  const maxPipeline = Math.max(1, ...pipeline.map((x: any) => n(x.count)));

  return (
    <div className="aaCard aaPanel">
      <div className="aaPanelHeader">
        <div>
          <h3 className="aaPanelTitle">Withdrawals &amp; Payouts</h3>
          <p className="aaPanelSub">All-time status pipeline &amp; processing efficiency</p>
        </div>

        <div className="aaPillGroup">
          <div className="aaPill">
            Processed: <b>{num(proc?.processedCount)}</b>
          </div>
          <div
            className={`aaPill ${n(proc?.averageProcessingTimeHours) > 0 && n(proc?.averageProcessingTimeHours) <= 48 ? "aaPillGood" : n(proc?.averageProcessingTimeHours) > 48 ? "aaPillWarn" : ""}`}
          >
            Avg processing:{" "}
            <b>
              {n(proc?.averageProcessingTimeHours) > 0
                ? `${n(proc.averageProcessingTimeHours).toFixed(2)} hrs`
                : "—"}
            </b>
          </div>
        </div>
      </div>

      <div className="aaTwinCards">
        <div className="aaTinyCard">
          <div className="aaTinyLabel">Total Payouts</div>
          <div className="aaTinyValue">{num(paidPipeline.count)}</div>
          <div className="aaTinySub">All-time paid count</div>
        </div>
        <div className="aaTinyCard">
          <div className="aaTinyLabel">Total Amount Paid</div>
          <div className="aaTinyValue">{inr(paidPipeline.totalAmount)}</div>
          <div className="aaTinySub">All-time paid amount</div>
        </div>
      </div>

      <div className="aaDivider" />

      <div className="aaSectionTitle">Status pipeline</div>
      <div className="aaPipeline">
        {pipeline.map((p: any) => {
          const t = tone(p.status);
          const width = Math.round((n(p.count) / maxPipeline) * 100);
          return (
            <div className="aaPipeRow" key={p.status}>
              <div className={`aaTag aaTag_${t}`}>{p.status}</div>
              <div className="aaPipeTrack">
                <div
                  className={`aaPipeFill aaPipeFill_${t}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <div className="aaPipeNum">{num(p.count)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
