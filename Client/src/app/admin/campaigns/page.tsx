"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AdminCampaignsService,
  CampaignStatus,
} from "@/services/admin-campaigns.service";
import "./campaigns.css";

const STATUS_OPTIONS: { value: CampaignStatus; label: string; cls: string }[] = [
  { value: "PENDING_REVIEW", label: "Pending Review", cls: "pending_review" },
  { value: "APPROVED",       label: "Approved",       cls: "approved" },
  { value: "ACTIVE",         label: "Active",          cls: "active_camp" },
  { value: "REJECTED",       label: "Rejected",        cls: "rejected" },
  { value: "SUSPENDED",      label: "Suspended",       cls: "suspended" },
  { value: "COMPLETED",      label: "Completed",       cls: "completed" },
];

type FilterTab = CampaignStatus | "ALL" | "GOAL_REACHED";

function AdminCampaignsContent() {
  const searchParams  = useSearchParams();
  const initialTab    = (searchParams.get("status") as FilterTab) || "ALL";

  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [counts, setCounts]       = useState<Record<string, number>>({});
  const router = useRouter();

  /* fetch all 6 statuses merged */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        STATUS_OPTIONS.map((s) =>
          AdminCampaignsService.listCampaigns(s.value)
            .then((res) => res.data.data.campaigns || [])
            .catch(() => [])
        )
      );
      const merged = results.flat();
      setCampaigns(merged);                         // always set — no closure dependency
      const map: Record<string, number> = {};
      STATUS_OPTIONS.forEach((s, i) => { map[s.value] = results[i].length; });
      map["ALL"] = merged.length;
      setCounts(map);
    } finally {
      setLoading(false);
    }
  };

  /* fetch a single status */
  const fetchByStatus = async (s: CampaignStatus) => {
    setLoading(true);
    try {
      const res  = await AdminCampaignsService.listCampaigns(s);
      const list = res.data.data.campaigns || [];
      setCampaigns(list);
      setCounts((prev) => ({ ...prev, [s]: list.length }));
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  /* load counts for all tabs in background (called when starting on a specific status) */
  const loadAllCounts = () => {
    Promise.all(
      STATUS_OPTIONS.map((s) =>
        AdminCampaignsService.listCampaigns(s.value)
          .then((res) => ({ s: s.value, n: (res.data.data.campaigns || []).length }))
          .catch(() => ({ s: s.value, n: 0 }))
      )
    ).then((results) => {
      const map: Record<string, number> = {};
      results.forEach((r) => { map[r.s] = r.n; });
      map["ALL"] = results.reduce((acc, r) => acc + r.n, 0);
      setCounts(map);
    });
  };

  /* fetch ACTIVE campaigns and filter goal-reached client-side */
  const fetchGoalReached = async () => {
    setLoading(true);
    try {
      const res  = await AdminCampaignsService.listCampaigns("ACTIVE");
      const list = (res.data.data.campaigns || []).filter(
        (c: any) => Number(c.raisedAmount) >= Number(c.goalAmount) && Number(c.goalAmount) > 0
      );
      setCampaigns(list);
      setCounts((prev) => ({ ...prev, GOAL_REACHED: list.length }));
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTab === "ALL") {
      fetchAll();
    } else if (initialTab === "GOAL_REACHED") {
      fetchGoalReached();
      loadAllCounts();
    } else {
      fetchByStatus(initialTab as CampaignStatus);
      loadAllCounts();
    }
  }, []);

  const handleTab = (tab: FilterTab) => {
    setActiveTab(tab);
    router.replace(`/admin/campaigns?status=${tab}`);
    if (tab === "ALL") {
      fetchAll();
    } else if (tab === "GOAL_REACHED") {
      fetchGoalReached();
    } else {
      fetchByStatus(tab as CampaignStatus);
    }
  };

  /* ── summary ── */
  const total       = campaigns.length;
  const totalRaised = campaigns.reduce((s, c) => s + (Number(c.raisedAmount) || 0), 0);
  const totalGoal   = campaigns.reduce((s, c) => s + (Number(c.goalAmount) || 0), 0);
  const avgProgress = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

  function fmt(n: number) {
    return "₹" + n.toLocaleString("en-IN");
  }

  const currentLabel =
    activeTab === "ALL"
      ? "All Campaigns"
      : STATUS_OPTIONS.find((s) => s.value === activeTab)?.label ?? "Campaigns";

  return (
    <div className="acPage">
      <div className="acContainer">

        {/* Header */}
        <div className="acHeader admin-page-wrapper">
          <div>
            <h1 className="acTitle">CAMPAIGNS</h1>
            <p className="acSubtitle">Manage and review all fundraiser campaigns</p>
          </div>
          <button
            className="acBtn acBtnPrimary"
            onClick={() => activeTab === "ALL" ? fetchAll() : fetchByStatus(activeTab as CampaignStatus)}
            disabled={loading}
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="acSummary">
          <div className="acSummaryCard">
            <div className="acSummaryLabel">{currentLabel}</div>
            <div className="acSummaryValue accent">{total}</div>
          </div>
          <div className="acSummaryCard">
            <div className="acSummaryLabel">Total Raised</div>
            <div className="acSummaryValue good">{fmt(totalRaised)}</div>
          </div>
          <div className="acSummaryCard">
            <div className="acSummaryLabel">Total Goal</div>
            <div className="acSummaryValue">{fmt(totalGoal)}</div>
          </div>
          <div className="acSummaryCard">
            <div className="acSummaryLabel">Avg Progress</div>
            <div className={`acSummaryValue ${avgProgress >= 80 ? "good" : avgProgress >= 40 ? "accent" : "warn"}`}>
              {avgProgress}%
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="acFilters">
          <button
            className={`acFilterBtn${activeTab === "ALL" ? " active" : ""}`}
            onClick={() => handleTab("ALL")}
          >
            All{counts["ALL"] !== undefined ? ` (${counts["ALL"]})` : ""}
          </button>

          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              className={`acFilterBtn${activeTab === s.value ? ` active ${s.cls}` : ""}`}
              onClick={() => handleTab(s.value)}
            >
              {s.label}{counts[s.value] !== undefined ? ` (${counts[s.value]})` : ""}
            </button>
          ))}

          <button
            className={`acFilterBtn${activeTab === "GOAL_REACHED" ? " active goal_reached" : ""}`}
            onClick={() => handleTab("GOAL_REACHED")}
            title="Active campaigns that have reached their goal — mark as Completed"
          >
            🎯 Goal Reached{counts["GOAL_REACHED"] !== undefined ? ` (${counts["GOAL_REACHED"]})` : ""}
          </button>
        </div>

        {/* Table Panel */}
        <div className="acPanel">
          <div className="acPanelHeader">
            <h3 className="acPanelTitle">{currentLabel}</h3>
            <span className="acCount">{total} campaign{total !== 1 ? "s" : ""}</span>
          </div>

          <div className="acTableWrap">
            {loading ? (
              <div className="acLoading">Loading campaigns…</div>
            ) : campaigns.length === 0 ? (
              <div className="acEmpty">No campaigns found.</div>
            ) : (
              <table className="acTable">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Creator</th>
                    <th>Location</th>
                    <th>Progress</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const raised   = Number(c.raisedAmount) || 0;
                    const goal     = Number(c.goalAmount) || 1;
                    const progress = Math.min(Math.round((raised / goal) * 100), 100);

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="acCampaignCell">
                            <img
                              className="acThumb"
                              src={c.coverImageURL || "/background.png"}
                              alt={c.title}
                            />
                            <div className="acCampaignInfo">
                              <div className="acCampaignTitle">{c.title}</div>
                              <div className="acCampaignFor">{c.campaignFor}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="acCreatorName">
                            {c.creator.firstName} {c.creator.lastName}
                          </div>
                          <div className="acCreatorEmail">{c.creator.email}</div>
                        </td>

                        <td className="acLocation">
                          {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                        </td>

                        <td>
                          <div className="acProgressWrap">
                            <div className="acProgressRow">
                              <span className="acProgressRaised">{fmt(raised)}</span>
                              <span>of {fmt(goal)}</span>
                            </div>
                            <div className="acProgressBar">
                              <div className="acProgressFill" style={{ width: `${progress}%` }} />
                            </div>
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>
                              {progress}%
                            </div>
                          </div>
                        </td>

                        <td className="acDate">
                          {new Date(c.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>

                        <td>
                          <span className={`acStatusBadge ${c.status}`}>
                            {c.status.replace("_", " ")}
                          </span>
                        </td>

                        <td>
                          <button
                            className="acManageBtn"
                            onClick={() =>
                              router.push(`/admin/campaigns/${c.id}?status=${activeTab}`)
                            }
                          >
                            Manage →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminCampaignsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>}>
      <AdminCampaignsContent />
    </Suspense>
  );
}
