import { Line, Doughnut } from "react-chartjs-2";
import { inr, n, num, pct } from "@/lib/format";

export default function DonationsHero({ data }: any) {
  const points = data?.donationsOverTime || [];
  const guest = n(data?.guestVsRegistered?.guest);
  const registered = n(data?.guestVsRegistered?.registered);
  const successRate = n(data?.successRate);
  const tipPct = n(data?.platformTips?.tipPercentage);

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

  const status = data?.statusBreakdown || [];
  const anon = data?.anonymousBreakdown || {};
  const tips = data?.platformTips || {};

  return (
    <div className="card hero">
      <div className="heroHeader">
        <div className="heroTitle">
          <small>Donations</small>
          <h2>Performance & composition</h2>
        </div>

        <div className="pillGroup">
          <span
            className={`pill ${successRate >= 95 ? "pillGood" : "pillWarn"}`}
          >
            Success rate: {pct(successRate, 0)}
          </span>
          <span className="pill">Tip %: {pct(tipPct, 2)}</span>
        </div>
      </div>

      <div className="heroGrid">
        <div className="chartCard">
          <p>Donations over time</p>
          <div className="chartWrap">
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
                      callback: (v) => `₹${Number(v).toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </div>

          <div className="badgeLine">
            {status.map((s: any) => (
              <span key={s.status} className="pill">
                {s.status}: {num(s.count)}
              </span>
            ))}
          </div>
        </div>

        <div className="chartCard">
          <p>Guest vs registered</p>
          <div className="chartWrap">
            <Doughnut
              data={donutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      color: "rgba(100,116,139,0.95)",
                      // font: { weight: "700" },
                    },
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

          <div className="badgeLine">
            <span className="pill">
              Anonymous: {num(anon?.anonymous)} / Non-anon:{" "}
              {num(anon?.nonAnonymous)}
            </span>
            <span className="pill">Tips total: {inr(tips?.totalTips)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
