"use client";

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

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

function prettyStatus(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysBetweenInclusive(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diff = b.getTime() - a.getTime();
  if (!Number.isFinite(diff) || diff < 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export default function FundraisersPanel({
  loading,
  data,
}: {
  loading: boolean;
  data: any;
}) {
  if (loading) return <PanelSkeleton />;

  const created = Array.isArray(data?.createdOverTime) ? data.createdOverTime : [];
  const status = Array.isArray(data?.statusBreakdown) ? data.statusBreakdown : [];
  const topSports = Array.isArray(data?.topSports) ? data.topSports : [];
  const appr = data?.approvalEfficiency || {};
  const range = data?.range || {};

  const totalCreated = created.reduce((a: number, x: any) => a + n(x.count), 0);

  const daysInRange = daysBetweenInclusive(String(range?.from), String(range?.to));
  const avgPerDay = daysInRange ? totalCreated / daysInRange : 0;

  const peak = created.length
    ? created.reduce((best: any, x: any) => (n(x.count) > n(best?.count) ? x : best), created[0])
    : null;

  const chartData = {
    labels: created.map((x: any) => x.date),
    datasets: [
      {
        label: "New fundraisers",
        data: created.map((x: any) => n(x.count)),
        tension: 0.35,
        borderWidth: 2,
        pointRadius: created.length <= 10 ? 4 : 2, // ✅ visible when few points
        pointHoverRadius: 6,
        fill: true,
        backgroundColor: "rgba(79,70,229,0.06)",
        borderColor: "rgba(79,70,229,0.75)",
      },
    ],
  };

  return (
    <div className="aaCard aaPanel">
      <div className="aaPanelHeader">
        <div>
          <h3 className="aaPanelTitle">Fundraisers</h3>
          <p className="aaPanelSub">Creation trend, status mix, top sports</p>
        </div>

        <div className="aaPillGroup">
          <div className="aaPill">
            Approved: <b>{num(appr?.approvedCount)}</b>
          </div>
          <div
            className={`aaPill ${
              n(appr?.averageApprovalTimeHours) <= 48 ? "aaPillGood" : "aaPillWarn"
            }`}
          >
            Avg approval: <b>{n(appr?.averageApprovalTimeHours).toFixed(2)} hrs</b>
          </div>
        </div>
      </div>

      <div className="aaBadgeLine">
        {status.length ? (
          status.map((s: any) => (
            <span key={s.status} className="aaPill">
              <b>{prettyStatus(s.status)}</b>: {num(s.count)}
            </span>
          ))
        ) : (
          <span className="aaPill">No status data</span>
        )}
      </div>

      <div className="aaDivider" />

      <div className="aaMiniStats">
        <div className="aaMiniStat">
          <div className="aaMiniLabel">Total created</div>
          <div className="aaMiniValue">{num(totalCreated)}</div>
        </div>

        <div className="aaMiniStat">
          <div className="aaMiniLabel">Avg/day (range)</div>
          <div className="aaMiniValue">{avgPerDay.toFixed(2)}</div>
        </div>

        <div className="aaMiniStat">
          <div className="aaMiniLabel">Peak day</div>
          <div className="aaMiniValue">
            {peak ? `${peak.date} (${num(peak.count)})` : "—"}
          </div>
        </div>
      </div>

      <div className="aaChartBox" style={{ marginTop: 10 }}>
        {created.length ? (
          <>
            <div className="aaChartHead">New fundraisers per active day</div>
            <div className="aaChartWrap">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` ${num(ctx.parsed.y)} fundraisers`,
                      },
                    },
                  },
                  scales: {
                    x: { grid: { display: false } },
                    y: {
                      beginAtZero: true,
                      ticks: { precision: 0 },
                      grid: { color: "rgba(230,234,242,0.9)" },
                    },
                  },
                }}
              />
            </div>
            <div className="aaHint">
              Average is computed across the full date range ({daysInRange} day(s)), not only active days.
            </div>
          </>
        ) : (
          <div className="aaEmpty">No fundraiser creation activity in this range.</div>
        )}
      </div>

      <div className="aaDivider" />

      <div className="aaSectionTitle">Top sports</div>
      {topSports.length ? (
        <div className="aaList">
          {topSports.map((s: any, idx: number) => (
            <div className="aaRow" key={s.sport || idx}>
              <div className="aaRowLeft">
                <div className="aaRank">#{idx + 1}</div>
                <div>
                  <div className="aaRowTitle">{s.sport || "Unknown"}</div>
                  <div className="aaRowSub">{num(s.fundraiserCount)} fundraiser(s)</div>
                </div>
              </div>
              <div className="aaRowRight">{inr(s.totalRaised)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="aaEmpty">No sport-wise data available in this range.</div>
      )}
    </div>
  );
}


