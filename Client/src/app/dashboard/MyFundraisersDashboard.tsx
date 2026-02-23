"use client";

import React, { useEffect, useState } from "react";
import "./dashboard.css";
import { FundraiserService } from "@/services/fundraiser.service";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge/StatusBadge";

const MyFundraisersDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const res = await FundraiserService.getMyCampaigns();
        console.log(res);
        setCampaigns(res.data);
      } catch (err) {
        console.error("Failed to fetch campaigns", err);
        setCampaigns([]);
      } finally {
        setLoading(false); // 🔥 THIS WAS MISSING
      }
    };

    fetchCampaigns();

    window.addEventListener("focus", fetchCampaigns);
    return () => window.removeEventListener("focus", fetchCampaigns);
  }, []);

  if (loading) {
    return <div className="dashboard-center">Loading...</div>;
  }

  return (
    <div className="dashboard-root">
      <main className="dashboard-main">
        {/* EMPTY STATE */}
        {campaigns.length === 0 && (
          <section className="empty-state">
            <span className="material-symbols-outlined big-icon">campaign</span>
            <h3>No Fundraisers Yet</h3>
            <p>
              It looks like you haven't started any campaigns yet. Launch your
              first fundraiser to begin.
            </p>
            <button
              className="primary-btn large"
              onClick={() => router.push("/start-fundraiser")}
            >
              Start Your First Fundraiser
            </button>
          </section>
        )}

        {/* ACTIVE CAMPAIGNS */}
        {campaigns.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2>My Campaigns</h2>
            </div>

            <div className="card-grid">
              {campaigns.map((campaign) => {
                // console.log("Dashboard campaign:", campaign);
                const supporters = Number(campaign.totalSupporters || 0);

                const raised = Number(campaign.raisedAmount || 0);
                const goal = Number(campaign.goalAmount || 1);
                const progress = Math.min(
                  Math.round((raised / goal) * 100),
                  100
                );

                return (
                  <article className="card" key={campaign.id}>
                    <div className="card-image">
                      <img
                        src={
                          campaign.coverImageURL
                            ? `${campaign.coverImageURL}?t=${campaign.updatedAt}`
                            : "/background.png"
                        }
                        alt={campaign.title || "Campaign cover"}
                        loading="lazy"
                        className="card-image-img"
                      />

                      <div className="card-image-overlay">
                        <StatusBadge status={campaign.status} />
                      </div>
                    </div>

                    <div className="card-body">
                      <h3>{campaign.title}</h3>
                      <p className="meta">
                        {campaign.sport}
                        {campaign.level && ` • ${campaign.level}`}
                      </p>

                      <p className="location">
                        {campaign.city}
                        {campaign.state && `, ${campaign.state}`}
                      </p>

                      <div className="progress-box">
                      
                        <div className="progress-row">
                          <div>
                            <strong style={{ color: "orange" }}>
                              Raised:{" "}
                            </strong>
                            <strong style={{ color: "orange" }}>
                              ₹{raised.toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <span>Goal: </span>
                            <span>₹{goal.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="progress-bar">
                          <div style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <button
                        className="primary-btn"
                        onClick={() =>
                          router.push(`/dashboard/campaigns/${campaign.id}`)
                        }
                      >
                        View / Manage →
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
  );
};

export default MyFundraisersDashboard;
