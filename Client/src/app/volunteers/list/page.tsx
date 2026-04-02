"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VolunteerService } from "@/services/volunteer.service";
import "../volunteers.css";

type PublicVolunteer = {
  id: string;
  city: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
};

const LIMIT = 12;

export default function VolunteersListPage() {
  const router = useRouter();
  const [volunteers, setVolunteers]     = useState<PublicVolunteer[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);

  useEffect(() => {
    setLoading(true);
    VolunteerService.getPublicVolunteers(1, LIMIT)
      .then((res) => {
        setVolunteers(res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        setPage(1);
      })
      .catch(() => setVolunteers([]))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    VolunteerService.getPublicVolunteers(nextPage, LIMIT)
      .then((res) => {
        setVolunteers((prev) => [...prev, ...(res.data?.data ?? [])]);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const hasMore = volunteers.length < total;

  return (
    <div className="vi-page">

      {/* Hero */}
      <div className="vi-hero">
        <h1 className="vi-hero-title">Our Volunteers</h1>
        <p className="vi-hero-sub">
          Meet the dedicated volunteers of the Navyug RaiseAPlayer Foundation helping young athletes across India.
        </p>
      </div>

      {/* Main */}
      <div className="vi-content">
        {loading ? (
          <div className="vi-loading">
            <div className="vi-spinner" />
            <p>Loading volunteers...</p>
          </div>
        ) : volunteers.length === 0 ? (
          <div className="vi-empty">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#9ca3af" strokeWidth="1.5"/>
            </svg>
            <p>No volunteers yet.</p>
          </div>
        ) : (
          <>
            {/* Section header */}
            <div className="vi-section-header">
              <span className="vi-section-title">Active Foundation Members</span>
              <div className="vi-section-right">
                <a href="/volunteers" className="vi-view-volunteers-btn">View Activities</a>
                <span className="vi-section-count">{String(total).padStart(2, "0")} TOTAL</span>
              </div>
            </div>
            <div className="vi-section-divider" />

            {/* List */}
            <div className="vi-list">
              {volunteers.map((v) => (
                <div key={v.id} className="vi-row">
                  <img
                    src={v.user.profileImageUrl || "/icon.png"}
                    alt={`${v.user.firstName} ${v.user.lastName}`}
                    className="vi-row-avatar"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }}
                  />
                  <div className="vi-row-info">
                    <div className="vi-row-name-wrap">
                      <span className="vi-row-name">{v.user.firstName} {v.user.lastName}</span>
                      <span className="vi-row-dot" />
                    </div>
                    <div className="vi-row-city-wrap">
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#9ca3af" strokeWidth="2"/>
                        <circle cx="12" cy="9" r="2.5" stroke="#9ca3af" strokeWidth="2"/>
                      </svg>
                      <span className="vi-row-city">{v.city}</span>
                    </div>
                    <span className="vi-row-id">ID: {v.id}</span>
                  </div>
                  <button
                    className="vi-portfolio-btn"
                    onClick={() => router.push(`/volunteers/${v.id}`)}
                  >
                    VERIFIED PORTFOLIO
                  </button>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="vi-load-more">
                <button className="vi-load-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? (
                    <><span className="vi-load-spinner" /> Loading...</>
                  ) : (
                    `Load more (${total - volunteers.length} remaining)`
                  )}
                </button>
              </div>
            )}

            {/* CTA card */}
            <div className="vi-cta-card">
              <p className="vi-cta-label">LEGACY &amp; FUTURE</p>
              <h2 className="vi-cta-title">Shape the Next Chapter of Social Evolution.</h2>
              <p className="vi-cta-sub">
                We invite dedicated visionaries to join our steward network of over 200+ volunteers crafting a sustainable impact across the Indian landscape.
              </p>
              <button className="vi-cta-btn" onClick={() => router.push("/volunteer")}>
                BECOME A MEMBER
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
