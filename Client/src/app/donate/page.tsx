"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FundraiserService } from "@/services/fundraiser.service";
import "../dashboard/dashboard.css";
import ShareButton from "@/components/ShareButton/ShareButton";

type Fundraiser = {
  id: string;
  title: string;
  shortDescription: string;
  coverImageURL?: string;
  goalAmount: number;
  raisedAmount: number;
  sport: string;
  level?: string;
  city: string;
  state?: string;
  status: string;
  updatedAt?: string;
  totalSupporters?: number;

  creator?: {
    firstName: string;
    lastName: string;
  };
};

const ExploreFundraisersPage: React.FC = () => {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const [search, setSearch] = useState("");
  const [sportFilter, _setSportFilter] = useState("");
  const [cityFilter, _setCityFilter] = useState("");
  const [totalResults, setTotalResults] = useState(0);


  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCampaigns = async (searchText?: string) => {
    try {
      setIsSearching(true);
      setLoading(true);

      const res = await FundraiserService.getPublicFundraisers({
        page: 0,
        limit: 20,
        ...(searchText ? { search: searchText } : {}),
        ...(sportFilter ? { sport: sportFilter } : {}),
        ...(cityFilter ? { city: cityFilter } : {}),
      });

      const fundraisers = res?.data?.data?.fundraisers ?? [];
      setCampaigns(fundraisers);
      setTotalResults(res?.data?.data?.total ?? fundraisers.length);
    } catch (err) {
      console.error("Failed to fetch fundraisers", err);
      setCampaigns([]);
      setTotalResults(0);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Search + Filters (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!search.trim() && !sportFilter && !cityFilter) {
      debounceRef.current = setTimeout(() => {
        fetchCampaigns();
      }, 300);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchCampaigns(search.trim());
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, sportFilter, cityFilter]);

  if (loading && !isSearching) {
    return <div className="dashboard-center">Loading...</div>;
  }

  return (
    <div className="dashboard-root">
      <main className="dashboard-main">
        <section className="section">
          {/* 🔍 STICKY SEARCH HEADER */}
          {/* SEARCH BAR */}
          <div className="explore-search-wrapper">
            <div className="explore-search-bar">
              {/* <span className="material-symbols-outlined explore-search-icon">
                search
              </span> */}

              <input
                type="text"
                placeholder="Search by player, sport or title"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="explore-search-input"
              />

              {search && (
                <button
                  className="explore-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* {!isSearching && (
              <div className="explore-result-count">
                {totalResults} fundraisers found
              </div>
            )} */}
          </div>

          {/* SKELETON */}
          {isSearching && (
            <div className="card-grid">
              {[...Array(6)].map((_, i) => (
                <div className="skeleton-card" key={i} />
              ))}
            </div>
          )}

          {/* EMPTY */}
          {!isSearching && campaigns.length === 0 && (
            <div className="empty-state">
              <h3>No Fundraisers Found</h3>
            </div>
          )}

          {/* CARDS */}
          {!isSearching && campaigns.length > 0 && (
            <div className="card-grid">
              {campaigns.map((campaign) => {
                const raised = campaign.raisedAmount ?? 0;
                const goal = campaign.goalAmount ?? 0;
                const progress =
                  goal === 0
                    ? 0
                    : Math.min(Math.round((raised / goal) * 100), 100);

                return (
                  <div
                    className="campaignCard"
                    key={campaign.id}
                    onClick={() => router.push(`/donate/${campaign.id}`)}
                  >
                    <div className="campaignImageWrap">
                      <span className="campaignVerified">Verified</span>
                      <img
                        src={
                          campaign.coverImageURL
                            ? `${campaign.coverImageURL}?t=${campaign.updatedAt}`
                            : "/background.png"
                        }
                        alt={campaign.title}
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
                        {campaign.sport}
                        {campaign.level && ` • ${campaign.level}`}
                        {(campaign.sport || campaign.level) && campaign.city ? " • " : ""}
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

                      {campaign.creator && (
                        <p className="created-by">
                          Created by{" "}
                          <strong>
                            {campaign.creator.firstName} {campaign.creator.lastName}
                          </strong>
                        </p>
                      )}

                      <div className="campaignFooterRow">
                        <span className="campaignSupporters">
                          {(campaign.totalSupporters ?? 0).toLocaleString()} supporter
                          {(campaign.totalSupporters ?? 0) !== 1 && "s"}
                        </span>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ShareButton fundraiserId={campaign.id} title={campaign.title} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default ExploreFundraisersPage;
