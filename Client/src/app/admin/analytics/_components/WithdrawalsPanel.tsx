import { useMemo, useState } from "react";
import { PanelSkeleton } from "./Skeletons";
import { inr, n, num } from "@/lib/format";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
);

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
  const [mode, setMode] = useState<"count" | "amount">("count");

  if (loading) return <PanelSkeleton />;

  // const totalsW = data?.totals?.withdrawals || { count: 0, totalAmount: 0 };
  // const totalsP = data?.totals?.payouts || { count: 0, totalAmount: 0 };

  const withdrawalsOverTime = data?.withdrawalsOverTime || [];
  const payoutsOverTime = data?.payoutsOverTime || [];

  const withdrawalsActivity = data?.withdrawalsActivity || [];
  const payoutsActivity = data?.payoutsActivity || [];

  const pipeline = data?.statusPipeline || [];
  const proc = data?.processingEfficiency || {};
  const paidPipeline = pipeline.find((x: any) => x.status === "PAID") || {
      count: 0,
      totalAmount: 0,
    };


  const chartW = useMemo(() => {
    const key = mode === "count" ? "count" : "totalAmount";
    return {
      labels: withdrawalsOverTime.map((x: any) => x.date),
      datasets: [
        {
          data: withdrawalsOverTime.map((x: any) => n(x[key])),
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          backgroundColor: "rgba(79,70,229,0.08)",
          borderColor: "rgba(79,70,229,0.65)",
        },
      ],
    };
  }, [withdrawalsOverTime, mode]);

  const chartP = useMemo(() => {
    const key = mode === "count" ? "count" : "totalAmount";
    return {
      labels: payoutsOverTime.map((x: any) => x.date),
      datasets: [
        {
          data: payoutsOverTime.map((x: any) => n(x[key])),
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          backgroundColor: "rgba(16,185,129,0.08)",
          borderColor: "rgba(16,185,129,0.65)",
        },
      ],
    };
  }, [payoutsOverTime, mode]);

  const maxPipeline = Math.max(1, ...pipeline.map((x: any) => n(x.count)));

  return (
    <div className="aaCard aaPanel">
      <div className="aaPanelHeader">
        <div>
          <h3 className="aaPanelTitle">Withdrawals & Payouts</h3>
          <p className="aaPanelSub">Operational pipeline + trend + activity</p>
        </div>

        <div className="aaPillGroup">
          <div className="aaPill">
            Processed: <b>{num(proc?.processedCount)}</b>
          </div>
          <div
            className={`aaPill ${n(proc?.averageProcessingTimeHours) <= 48 ? "aaPillGood" : "aaPillWarn"}`}
          >
            Avg processing:{" "}
            <b>{n(proc?.averageProcessingTimeHours).toFixed(2)} hrs</b>
          </div>
        </div>
      </div>

      <div className="aaDivider" />

      {/* totals */}
      {/* <div className="aaTwinCards">
        <div className="aaTinyCard">
          <div className="aaTinyLabel">Withdrawals</div>
          <div className="aaTinyValue">
            {mode === "count" ? num(totalsW.count) : inr(totalsW.totalAmount)}
          </div>
          <div className="aaTinySub">Total in selected range</div>
        </div>
        <div className="aaTinyCard">
          <div className="aaTinyLabel">Payouts</div>
          <div className="aaTinyValue">
            {mode === "count" ? num(totalsP.count) : inr(totalsP.totalAmount)}
          </div>
          <div className="aaTinySub">Total in selected range</div>
        </div>
        <div className="aaModeSwitch">
          <button
            className={`aaBtnSm ${mode === "count" ? "aaBtnSmActive" : ""}`}
            onClick={() => setMode("count")}
          >
            Count
          </button>
          <button
            className={`aaBtnSm ${mode === "amount" ? "aaBtnSmActive" : ""}`}
            onClick={() => setMode("amount")}
          >
            Amount
          </button>
        </div>
      </div> */}

      <div className="aaTwinCards">
        {/* TOTAL PAYOUT COUNT */}
        <div className="aaTinyCard">
          <div className="aaTinyLabel">Total Payouts</div>
          <div className="aaTinyValue">
            {num(paidPipeline.count)}
          </div>
          <div className="aaTinySub">Total count till date</div>
        </div>

        {/* TOTAL PAYOUT AMOUNT */}
        <div className="aaTinyCard">
          <div className="aaTinyLabel">Total Amount Paid</div>
          <div className="aaTinyValue">
            {inr(paidPipeline.totalAmount)}
          </div>
          <div className="aaTinySub">Total amount till date</div>
        </div>
      </div>


      {/* pipeline */}
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

      {/* charts */}
      {/* <div className="aaDivider" /> */}

      {/* <div className="aaSectionTitle">Trend</div>
      <div className="aaTwoCols">
        <div className="aaChartBox">
          <div className="aaChartHead">Withdrawals over time</div>
          <div className="aaChartWrap">
            <Line
              data={chartW}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: "rgba(230,234,242,0.9)" } },
                },
              }}
            />
          </div>
        </div>

        <div className="aaChartBox">
          <div className="aaChartHead">Payouts over time</div>
          <div className="aaChartWrap">
            <Line
              data={chartP}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: "rgba(230,234,242,0.9)" } },
                },
              }}
            />
          </div>
        </div>
      </div> */}

      {/* activity */}
      {/* <div className="aaDivider" /> */}

      {/* <div className="aaSectionTitle">Recent activity (non-zero days)</div>
      <div className="aaTwoCols">
        <div className="aaActivity">
          <div className="aaActivityHead">Withdrawals activity</div>
          {withdrawalsActivity.length ? (
            <div className="aaActivityList">
              {withdrawalsActivity.map((x: any) => (
                <div className="aaActivityRow" key={x.date}>
                  <div className="aaActivityDate">{x.date}</div>
                  <div className="aaActivityMeta">
                    <span className="aaDot" />
                    <span>{num(x.count)} req</span>
                    <span className="aaSep">•</span>
                    <span>{inr(x.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="aaEmpty">No withdrawal activity in this range.</div>
          )}
        </div>

        <div className="aaActivity">
          <div className="aaActivityHead">Payouts activity</div>
          {payoutsActivity.length ? (
            <div className="aaActivityList">
              {payoutsActivity.map((x: any) => (
                <div className="aaActivityRow" key={x.date}>
                  <div className="aaActivityDate">{x.date}</div>
                  <div className="aaActivityMeta">
                    <span className="aaDot aaDotGreen" />
                    <span>{num(x.count)} payouts</span>
                    <span className="aaSep">•</span>
                    <span>{inr(x.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="aaEmpty">No payout activity in this range.</div>
          )}
        </div>
      </div> */}
    </div>
  );
}
