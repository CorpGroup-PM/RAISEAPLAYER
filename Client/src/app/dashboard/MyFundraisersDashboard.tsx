"use client";

import React, { useEffect, useState } from "react";
import "./dashboard.css";
import { FundraiserService } from "@/services/fundraiser.service";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { useStartFundraiser } from "@/hooks/useStartFundraiser";
import PanKycModal from "@/components/Pan-Kyc-Modal/PanKycModal";

const MyFundraisersDashboard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const {
    handleStartFundraiser,
    kycCheckLoading,
    isKycModalOpen,
    closeKycModal,
  } = useStartFundraiser();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const res = await FundraiserService.getMyCampaigns();
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
              onClick={handleStartFundraiser}
              disabled={kycCheckLoading}
            >
              {kycCheckLoading ? "Checking..." : "Start Your First Fundraiser"}
            </button>
          </section>
        )}

        {/* ACTIVE CAMPAIGNS */}
        {campaigns.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2>My Fundraisers</h2>
              <button
                className="primary-btn"
                onClick={handleStartFundraiser}
                disabled={kycCheckLoading}
              >
                {kycCheckLoading ? "Checking..." : "Start Fundraiser"}
              </button>
            </div>

            <div className="card-grid">
              {campaigns.map((campaign) => {
                // console.log("Dashboard campaign:", campaign);
                const supporters = Number(campaign.totalSupporters || 0);

                const raised = Number(campaign.raisedAmount || 0);
                const goal = Number(campaign.goalAmount || 1);
                const progress = Math.min(
                  Math.round((raised / goal) * 100),
                  100,
                );

                return (
                  <div
                    className="campaignCard"
                    key={campaign.id}
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                  >
                    <div className="campaignImageWrap">
                      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}>
                        <StatusBadge status={campaign.status} />
                      </div>
                      <img
                        src={
                          campaign.coverImageURL
                            ? `${campaign.coverImageURL}?t=${campaign.updatedAt}`
                            : "/background.png"
                        }
                        alt={campaign.title || "Campaign cover"}
                        loading="lazy"
                        className="campaignImage"
                      />
                    </div>

                    <div className="campaignBody">
                      <h3 className="campaignTitle">{campaign.title}</h3>
                      {campaign.shortDescription && (
                        <p className="campaignShortDesc">{campaign.shortDescription}</p>
                      )}
                      <p className="campaignMeta">
                        {campaign.sport && `${campaign.sport} • `}
                        {campaign.city}
                        {campaign.state && `, ${campaign.state}`}
                      </p>

                      <div className="campaignMoneyRow">
                        <span className="campaignRaised">Raised: ₹{raised.toLocaleString()}</span>
                        <span className="campaignGoal">Goal: ₹{goal.toLocaleString()}</span>
                      </div>

                      <div className="campaignProgressTrack">
                        <div className="campaignProgressFill" style={{ width: `${progress}%` }} />
                      </div>

                      {campaign.createdAt && (
                        <p className="campaign-created-at">
                          Created:{" "}
                          {new Date(campaign.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}

                      <div className="campaignFooterRow">
                        <span className="campaignSupporters">
                          {supporters.toLocaleString()} supporter{supporters !== 1 && "s"}
                        </span>
                        <button
                          className="campaignDonateBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/campaigns/${campaign.id}`);
                          }}
                        >
                          Manage →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <PanKycModal isOpen={isKycModalOpen} onClose={closeKycModal} />
    </div>
  );
};

export default MyFundraisersDashboard;
