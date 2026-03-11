"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  IndianRupee, TrendingUp, Users, Target, Clock,
  FileText, Building2, Star, XCircle, CreditCard, ArrowUpCircle, AlertTriangle,
} from "lucide-react";
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

const ITEMS = [
  {
    label: "Total Donations",
    key: "totalDonations",
    fmt: (v: number) => inr(v),
    link: "/admin/donations",
    iconType: "good" as const,
    Icon: IndianRupee,
  },
  {
    label: "Platform Tips",
    key: "platformTips",
    fmt: (v: number) => inr(v),
    link: "/admin/FoundationFunds",
    iconType: "good" as const,
    Icon: TrendingUp,
  },
  {
    label: "New Users",
    key: "newUsers",
    fmt: (v: number) => num(v),
    link: "/admin/users",
    iconType: "accent" as const,
    Icon: Users,
  },
  {
    label: "Active Fundraisers",
    key: "activeFundraisers",
    fmt: (v: number) => num(v),
    link: "/admin/campaigns?status=ACTIVE",
    iconType: "accent" as const,
    Icon: Target,
  },
  {
    label: "Action Required",
    key: "goalReachedCampaigns",
    fmt: (v: number) => num(v),
    link: "/admin/campaigns?status=GOAL_REACHED",
    iconType: "warn" as const,
    Icon: AlertTriangle,
    isAlert: true,
  },
  {
    label: "Pending Reviews",
    key: "pendingReviewFundraisers",
    fmt: (v: number) => num(v),
    link: "/admin/campaigns?status=PENDING_REVIEW",
    iconType: "warn" as const,
    Icon: Clock,
    isAlert: true,
  },
  {
    label: "Unverified Banks",
    key: "unverifiedBankAccounts",
    fmt: (v: number) => num(v),
    link: "/admin/bank-accounts",
    iconType: "warn" as const,
    Icon: Building2,
    isAlert: true,
  },
  {
    label: "Unverified Reviews",
    key: "unverifiedReviews",
    fmt: (v: number) => num(v),
    link: "/admin/ReviewVerification",
    iconType: "warn" as const,
    Icon: Star,
    isAlert: true,
  },
  {
    label: "Failed Payments",
    key: "failedPayments",
    fmt: (v: number) => num(v),
    link: "/admin/Payouts",
    iconType: "bad" as const,
    Icon: XCircle,
    isAlert: true,
  },
  {
    label: "Paid Payouts",
    key: "paidPayouts",
    fmt: (v: number) => inr(v),
    link: "/admin/Payouts",
    iconType: "good" as const,
    Icon: CreditCard,
  },
  {
    label: "Pending Withdrawals",
    key: "pendingWithdrawals",
    fmt: (v: number) => num(v),
    link: "/admin/Payouts",
    iconType: "warn" as const,
    Icon: ArrowUpCircle,
    isAlert: true,
  },
];

export default function KPICards({
  loading,
  cards,
  from,
  to,
}: {
  loading: boolean;
  cards: any;
  from: string;
  to: string;
  lastUpdated?: string;
}) {
  const router = useRouter();

  return (
    <div className="aaKpiGrid">
      {ITEMS.map((x) => {
        const value = n(cards?.[x.key]);
        const needsAttention = !!x.isAlert && value > 0;
        const { Icon } = x;

        return (
          <motion.div
            key={x.label}
            className={`aaCard aaKpi${needsAttention ? " aaKpiWarn" : ""}`}
            whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
            transition={{ duration: 0.12 }}
            onClick={() => x.link && router.push(x.link)}
            style={{ cursor: x.link ? "pointer" : "default" }}
          >
            <div className="aaKpiTop">
              <div className="aaKpiMeta">
                <div className="aaKpiLabel">{x.label}</div>
                <span
                  className={`aaPill ${needsAttention ? "aaPillWarn" : "aaPillGood"}`}
                  style={{ fontSize: 10, padding: "2px 8px", width: "fit-content" }}
                >
                  {needsAttention ? "Needs attention" : "Healthy"}
                </span>
              </div>
              <div className={`aaKpiIconBox ${x.iconType}`}>
                <Icon size={17} strokeWidth={2.2} />
              </div>
            </div>

            <div className="aaKpiValue">
              {loading ? (
                <Skeleton className="aaSkelBig" />
              ) : (
                <AnimatedText value={value} format={x.fmt} />
              )}
            </div>

            <div className="aaKpiFoot">
              <span>{from} → {to}</span>
              {x.link && (
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  View →
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
