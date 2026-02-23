"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalyticsService } from "@/services/analytics.service";
import { getLast7DaysISO, getTodayISO } from "@/lib/date-utils";
import DateFilterBar from "./DateFilterBar";
import KPICards from "./KPICards";
import OverviewPanels from "./OverviewPanels";
import DonationsPanel from "./FundraisersPanel";
import WithdrawalsPanel from "./WithdrawalsPanel";
import FundraisersPanel from "./FundraisersPanel";
import DonationsHerochart from "./DonationsHero";

type DashboardData = {
  overview: any;
  fundraisers: any;
  donations: any;
  withdrawals: any;
};

export default function AnalyticsDashboardClient() {
  const [from, setFrom] = useState(getLast7DaysISO());
  const [to, setTo] = useState(getTodayISO());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [data, setData] = useState<DashboardData | null>(null);

  const load = async (range?: { from: string; to: string }) => {
    const f = range?.from ?? from;
    const t = range?.to ?? to;

    setLoading(true);
    setError("");

    try {
      const [overview, fundraisers, donations, withdrawals, payouts] = await Promise.all(
        [
          AnalyticsService.overview({ from: f, to: t }),
          AnalyticsService.fundraisers({ from: f, to: t }),
          AnalyticsService.donations({ from: f, to: t }),
          AnalyticsService.withdrawals({ from: f, to: t }),
          AnalyticsService.payouts({ from: f, to: t }),
        ],
      );

      const withdrawalsData = withdrawals.data;
      const payoutsData = payouts.data;

      setData({
        overview: overview.data,
        fundraisers: fundraisers.data,
        donations: donations.data,

        withdrawals: {
          ...withdrawalsData,

          totals: {
            ...withdrawalsData?.totals,
            payouts: {
              count: payoutsData?.totalPayouts ?? 0,
              totalAmount: payoutsData?.totalPaidAmount ?? 0,
            },
          },

          payoutsOverTime: payoutsData?.payoutsOverTime ?? [],
          payoutsActivity: payoutsData?.payoutsActivity ?? [],
        },
      });


      setFrom(f);
      setTo(t);
      setLastUpdated(new Date().toLocaleString("en-IN"));
    } catch (e: any) {
      setData(null);
      setError(e?.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ from, to }); // ✅ initial load with default last 7 days
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = data?.overview?.cards;

  return (
    <div className="aaPage">
      <div className="aaContainer">
        <div className="aaHeader">
          <div>
            <h1 className="aaTitle">DASHBOARD</h1>

          </div>

          <div className="aaHeaderRight">
            <div className="aaRefresh">
              <div className="aaRefreshLabel">Last refreshed</div>
              <div className="aaRefreshValue">{lastUpdated || "—"}</div>
            </div>
          </div>
        </div>
        <DateFilterBar
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          loading={loading}
          onApply={load} // ✅ single click presets
        />
        {error ? <div className="aaError">{error}</div> : null}
        <DonationsHerochart loading={loading} data={data?.donations} />
        <KPICards
          loading={loading}
          cards={cards}
          from={from}
          to={to}
          lastUpdated={lastUpdated}
        />
        <div className="aaGrid">
          {/* <OverviewPanels loading={loading} overview={data?.overview} /> */}
          <FundraisersPanel loading={loading} data={data?.fundraisers} />
        </div>
        <div className="aaGrid">
          {/* <DonationsPanel loading={loading} data={data?.donations} /> */}
          <WithdrawalsPanel loading={loading} data={data?.withdrawals} />
        </div>
      </div>
    </div>
  );
}
