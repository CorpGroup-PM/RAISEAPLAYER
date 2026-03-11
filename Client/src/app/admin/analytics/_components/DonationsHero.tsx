"use client";

import { Line, Doughnut } from "react-chartjs-2";
import { inr, n, num, pct } from "@/lib/format";
import { PanelSkeleton } from "./Skeletons";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  ArcElement,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  ArcElement,
  Legend,
);

function prettyStatus(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DonationsHerochart({
  data,
  loading,
}: {
  data: any;
  loading: boolean;
}) {
  if (loading) return <PanelSkeleton />;

  const points = data?.donationsOverTime || [];
  const guest = n(data?.guestVsRegistered?.guest);
  const registered = n(data?.guestVsRegistered?.registered);
  const successRate = n(data?.successRate);
  const tipPct = n(data?.platformTips?.tipPercentage);
  const totalTips = n(data?.platformTips?.totalTips);
  const anon = data?.anonymousBreakdown || {};
  const status = data?.statusBreakdown || [];

  const totalDonations = points.reduce(
    (sum: number, x: any) => sum + n(x.totalAmount),
    0,
  );
  const totalCount = points.reduce(
    (sum: number, x: any) => sum + n(x.count),
    0,
  );

  const lineData = {
    labels: points.map((x: any) => x.date),
    datasets: [
      {
        label: "Donation Amount",
        data: points.map((x: any) => n(x.totalAmount)),
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true,
        backgroundColor: "rgba(79,70,229,0.07)",
        borderColor: "rgba(79,70,229,0.8)",
      },
    ],
  };

  const donutData = {
    labels: ["Guest", "Registered"],
    datasets: [
      {
        data: [guest, registered],
        backgroundColor: ["rgba(59,130,246,0.8)", "rgba(79,70,229,0.8)"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="aaCard aaPanel">
      <div className="aaPanelHeader">
        <div>
          <h3 className="aaPanelTitle">Donations</h3>
          <p className="aaPanelSub">Revenue trend &amp; donor composition</p>
        </div>

        <div className="aaPillGroup">
          <span
            className={`aaPill ${successRate >= 95 ? "aaPillGood" : "aaPillWarn"}`}
          >
            Success rate: <b>{pct(successRate, 0)}</b>
          </span>
          <span className="aaPill">
            Tip rate: <b>{pct(tipPct, 2)}</b>
          </span>
        </div>
      </div>

      {/* Stats summary */}
      <div className="aaStatRow" style={{ marginTop: 16 }}>
        <div className="aaStatItem">
          <div className="aaStatLabel">Total Revenue</div>
          <div className="aaStatValue">{inr(totalDonations)}</div>
          <div className="aaStatSub">in selected range</div>
        </div>
        <div className="aaStatItem">
          <div className="aaStatLabel">Donations</div>
          <div className="aaStatValue">{num(totalCount)}</div>
          <div className="aaStatSub">successful transactions</div>
        </div>
        <div className="aaStatItem">
          <div className="aaStatLabel">Platform Tips</div>
          <div className="aaStatValue">{inr(totalTips)}</div>
          <div className="aaStatSub">{pct(tipPct, 1)} of total</div>
        </div>
        <div className="aaStatItem">
          <div className="aaStatLabel">Anonymous</div>
          <div className="aaStatValue">{num(n(anon?.anonymous))}</div>
          <div className="aaStatSub">of {num(n(anon?.anonymous) + n(anon?.nonAnonymous))} donors</div>
        </div>
      </div>

      <div className="aaDivider" />

      <div className="aaTwoCols">
        <div className="aaChartBox">
          <div className="aaChartHead">Revenue over time</div>
          <div className="aaChartWrap">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "rgba(15,23,42,0.9)",
                    titleColor: "#94a3b8",
                    bodyColor: "#f1f5f9",
                    padding: 10,
                    callbacks: {
                      label: (ctx) => ` ${inr(ctx.parsed.y)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { size: 11 } },
                  },
                  y: {
                    grid: { color: "rgba(226,232,240,0.8)" },
                    ticks: {
                      color: "#94a3b8",
                      font: { size: 11 },
                      callback: (v) =>
                        `₹${Number(v).toLocaleString("en-IN")}`,
                    },
                  },
                },
              }}
            />
          </div>

          {status.length > 0 && (
            <div className="aaBadgeLine" style={{ marginTop: 12 }}>
              {status.map((s: any) => (
                <span key={s.status} className="aaPill">
                  {prettyStatus(s.status)}: <b>{num(s.count)}</b>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="aaChartBox">
          <div className="aaChartHead">Guest vs Registered donors</div>
          <div className="aaChartWrap">
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#64748b",
                      font: { size: 12 },
                      padding: 16,
                      usePointStyle: true,
                      pointStyleWidth: 8,
                    },
                  },
                  tooltip: {
                    backgroundColor: "rgba(15,23,42,0.9)",
                    titleColor: "#94a3b8",
                    bodyColor: "#f1f5f9",
                    padding: 10,
                    callbacks: {
                      label: (ctx) => ` ${ctx.label}: ${num(ctx.parsed)}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
