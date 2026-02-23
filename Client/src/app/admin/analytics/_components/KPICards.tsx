import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { inr, n, num } from "@/lib/format";
import { Skeleton } from "./Skeletons";

function AnimatedText({
  value,
  format,
}: {
  value: number;
  format: (v: number) => string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (latest) => format(Math.round(latest)));

  useEffect(() => {
    const controls = animate(mv, value || 0, {
      duration: 0.85,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [mv, value]);

  return <motion.span>{text}</motion.span>;
}

export default function KPICards({
  loading,
  cards,
  from,
  to,
  lastUpdated,
}: {
  loading: boolean;
  cards: any;
  from: string;
  to: string;
  lastUpdated: string;
}) {
  const items = [
    {
      label: "Total Donations",
      value: n(cards?.totalDonations),
      fmt: (v: number) => inr(v),
    },
    {
      label: "Platform Tips",
      value: n(cards?.platformTips),
      fmt: (v: number) => inr(v),
    },
    {
      label: "Active Fundraisers",
      value: n(cards?.activeFundraisers),
      fmt: (v: number) => num(v),
    },
    {
      label: "Pending Reviews",
      value: n(cards?.pendingReviewFundraisers),
      fmt: (v: number) => num(v),
    },
    {
      label: "Paid Payouts",
      value: n(cards?.paidPayouts),
      fmt: (v: number) => inr(v),
    },
    {
      label: "Pending Withdrawals",
      value: n(cards?.pendingWithdrawals),
      fmt: (v: number) => num(v),
    },
  ];

  return (
    <div className="aaKpiGrid">
      {items.map((x) => {
        const needsAttention =
          x.label.toLowerCase().includes("pending") && x.value > 0;

        return (
          <motion.div
            key={x.label}
            className="aaCard aaKpi"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.12 }}
          >
            <div className="aaKpiTop">
              <div className="aaKpiLabel">{x.label}</div>
              <div
                className={`aaPill ${needsAttention ? "aaPillWarn" : "aaPillGood"}`}
              >
                {needsAttention ? "Needs attention" : "Healthy"}
              </div>
            </div>

            <div className="aaKpiValue">
              {loading ? (
                <Skeleton className="aaSkelBig" />
              ) : (
                <AnimatedText value={x.value} format={x.fmt} />
              )}
            </div>

            <div className="aaKpiFoot">
              <span>
                Range: {from} → {to}
              </span>
              <span>Refreshed: {lastUpdated || "—"}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
