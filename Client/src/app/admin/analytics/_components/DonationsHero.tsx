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

  const status = data?.statusBreakdown || [];
  const anon = data?.anonymousBreakdown || {};
  const tips = data?.platformTips || {};

  const lineData = {
    labels: points.map((x: any) => x.date),
    datasets: [
      {
        label: "Donation Amount",
        data: points.map((x: any) => n(x.totalAmount)),
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        backgroundColor: "rgba(79,70,229,0.08)",
        borderColor: "rgba(79,70,229,0.75)",
      },
    ],
  };

  const donutData = {
    labels: ["Guest", "Registered"],
    datasets: [
      {
        data: [guest, registered],
        backgroundColor: ["rgba(59,130,246,0.75)", "rgba(79,70,229,0.75)"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="aaCard aaPanel">
      <div className="aaPanelHeader">
        <div>
          <h3 className="aaPanelTitle">Donations</h3>
          <p className="aaPanelSub">Performance & composition</p>
        </div>

        <div className="aaPillGroup">
          <span
            className={`aaPill ${successRate >= 95 ? "aaPillGood" : "aaPillWarn"}`}
          >
            Success rate: <b>{pct(successRate, 0)}</b>
          </span>
          <span className="aaPill">
            Tip %: <b>{pct(tipPct, 2)}</b>
          </span>
        </div>
      </div>

      <div className="aaDivider" />

      <div className="aaTwoCols">
        <div className="aaChartBox">
          <div className="aaChartHead">Donations over time</div>

          <div className="aaChartWrap">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${inr(ctx.parsed.y)}`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "rgba(100,116,139,0.9)" },
                  },
                  y: {
                    grid: { color: "rgba(230,234,242,0.9)" },
                    ticks: {
                      color: "rgba(100,116,139,0.9)",
                      callback: (v) => `₹${Number(v).toLocaleString("en-IN")}`,
                    },
                  },
                },
              }}
            />
          </div>

          <div className="aaBadgeLine" style={{ marginTop: 10 }}>
            {status.map((s: any) => (
              <span key={s.status} className="aaPill">
                <b>{s.status}</b>: {num(s.count)}
              </span>
            ))}
          </div>
        </div>

        <div className="aaChartBox">
          <div className="aaChartHead">Guest vs registered</div>

          <div className="aaChartWrap">
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: { color: "rgba(100,116,139,0.95)" },
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.label}: ${num(ctx.parsed)}`,
                    },
                  },
                },
              }}
            />
          </div>

          <div className="aaBadgeLine" style={{ marginTop: 10 }}>
            <span className="aaPill">
              Anonymous: <b>{num(anon?.anonymous)}</b> / Non-anon:{" "}
              <b>{num(anon?.nonAnonymous)}</b>
            </span>
            <span className="aaPill">
              Tips total: <b>{inr(tips?.totalTips)}</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
