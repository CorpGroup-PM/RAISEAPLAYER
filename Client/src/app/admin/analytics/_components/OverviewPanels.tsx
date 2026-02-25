import { PanelSkeleton } from "./Skeletons";
import { inr, num, n } from "@/lib/format";

export default function OverviewPanels({
  loading,
  overview,
}: {
  loading: boolean;
  overview: any;
}) {
  if (loading) return <PanelSkeleton />;

  const cards = overview?.cards || {};
  return (
    <div className="aaCard aaPanel">
      <div className="aaPanelHeader">
        <div>
          <h3 className="aaPanelTitle">Overview</h3>
          <p className="aaPanelSub">High-level operational snapshot</p>
        </div>
        <div className="aaPill aaPillGood">Live snapshot</div>
      </div>

      <div className="aaDivider" />

      <div className="aaKeyGrid">
        <div className="aaKey">
          <div className="aaKeyLabel">Total donations</div>
          <div className="aaKeyValue">{inr(cards.totalDonations)}</div>
        </div>
        <div className="aaKey">
          <div className="aaKeyLabel">Platform tips</div>
          <div className="aaKeyValue">{inr(cards.platformTips)}</div>
        </div>
        <div className="aaKey">
          <div className="aaKeyLabel">Paid payouts</div>
          <div className="aaKeyValue">{inr(cards.paidPayouts)}</div>
        </div>
        <div className="aaKey">
          <div className="aaKeyLabel">Pending withdrawals</div>
          <div className="aaKeyValue">{num(cards.pendingWithdrawals)}</div>
        </div>
      </div>

      <div className="aaHint">
        Tip: Use filters above to generate investor snapshots for specific
        periods.
      </div>
    </div>
  );
}
