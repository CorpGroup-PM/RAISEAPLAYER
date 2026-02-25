"use client";

import React, { useEffect, useState } from "react";
import "../../dashboard/dashboard.css";
import AdminNavbar from "@/components/admin/AdminNavbar";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import {
  AdminCampaignsService,
  CampaignStatus,
} from "@/services/admin-campaigns.service";
import { useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS: CampaignStatus[] = [
  "PENDING_REVIEW",
  "APPROVED",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
  "COMPLETED",
];

const AdminCampaignsPage: React.FC = () => {
  const searchParams = useSearchParams();

  const initialStatus =
    (searchParams.get("status") as CampaignStatus) || "ACTIVE";

  const [status, setStatus] =
    useState<CampaignStatus>(initialStatus);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /* ================= FETCH CAMPAIGNS ================= */
  const fetchCampaigns = async (selectedStatus: CampaignStatus) => {
    try {
      setLoading(true);
      const res =
        await AdminCampaignsService.listCampaigns(selectedStatus);

      setCampaigns(res.data.data.campaigns);
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(status);
  }, [status]);

  return (
    <>
      <AdminNavbar />

      <div className="dashboard-root">
        <main className="dashboard-main" >
 

          {/* ================= FILTER ================= */}
          <div className="admin-page-header">
            <h1 className="admin-page-title">Campaigns</h1>

            <div className="status-filter-box">
              <span className="status-filter-label">Filter by status</span>

              <select
                className={`status-filter-select status-${status.toLowerCase()}`}
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as CampaignStatus;
                  setStatus(newStatus);

                  router.replace(`/admin/campaigns?status=${newStatus}`);
                }}

              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>


          {/* ================= LOADING ================= */}
          {loading && (
            <div className="dashboard-center">Loading...</div>
          )}

          {/* ================= EMPTY STATE ================= */}
          {!loading && campaigns.length === 0 && (
            <section className="empty-state">
              <span className="material-symbols-outlined big-icon">
                campaign
              </span>
              <h3>No Campaigns Found</h3>
              <p>No campaigns available for this status.</p>
            </section>
          )}

          {/* ================= CAMPAIGN CARDS ================= */}
          {!loading && campaigns.length > 0 && (
            <section className="section">
              <div className="card-grid">
                {campaigns.map((campaign) => {
                  const raised = campaign.raisedAmount ?? 0;
                  const goal = campaign.goalAmount;
                  const progress = Math.min(
                    Math.round((raised / goal) * 100),
                    100
                  );

                  return (
                    <article className="card" key={campaign.id}>
                      {/* IMAGE */}
                      <div className="card-image">
                        <img
                          src={
                            campaign.coverImageURL
                              ? `${campaign.coverImageURL}?t=${campaign.updatedAt}`
                              : "/background.png"
                          }
                          alt={campaign.title}
                          className="card-image-img"
                        />

                        <div className="card-image-overlay">
                          <StatusBadge status={campaign.status} />
                        </div>
                      </div>

                      {/* BODY */}
                      <div className="card-body">
                        <h3>{campaign.title}</h3>

                        <p className="meta">
                          {campaign.campaignFor}
                        </p>

                        <p className="location">
                          {campaign.city}
                          {campaign.state && `, ${campaign.state}`}
                        </p>

                        {/* PROGRESS */}
                        <div className="progress-box">
                          <div className="progress-row">
                            <div>
                              <strong style={{ color: "orange" }}>
                                Raised:
                              </strong>{" "}
                              ₹{raised.toLocaleString()}
                            </div>
                            <div>
                              <span>Goal:</span>{" "}
                              ₹{goal.toLocaleString()}
                            </div>
                          </div>

                          <div className="progress-bar">
                            <div
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <p className="created-by">
                          Created by{" "}
                          <strong>
                            {campaign.creator.firstName} {campaign.creator.lastName}
                          </strong>
                        </p>

                        {/* CTA */}
                        <button
                          className="primary-btn"
                          onClick={() =>
                            router.push(
                              `/admin/campaigns/${campaign.id}?status=${status}`
                            )

                          }
                        >
                          Review / Manage →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

            </section>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminCampaignsPage;
