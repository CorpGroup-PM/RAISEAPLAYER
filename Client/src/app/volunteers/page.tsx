"use client";

import { useEffect, useState } from "react";
import { VolunteerService } from "@/services/volunteer.service";
import "./volunteers.css";

type Activity = {
  id: string;
  imageUrl: string;
  date: string;
  note: string;
  helpedCampaign: string;
  volunteer: {
    id: string;
    city: string;
    user: { firstName: string; lastName: string; profileImageUrl: string | null };
  };
};

const LIMIT = 12;

export default function VolunteersPage() {
  const [activities, setActivities]     = useState<Activity[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [selected, setSelected]         = useState<Activity | null>(null);

  useEffect(() => {
    setLoading(true);
    VolunteerService.getAllPublicActivities(1, LIMIT)
      .then((res) => {
        setActivities(res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        setPage(1);
      })
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    VolunteerService.getAllPublicActivities(nextPage, LIMIT)
      .then((res) => {
        setActivities((prev) => [...prev, ...(res.data?.data ?? [])]);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const hasMore = activities.length < total;

  return (
    <div className="vi-page">

      {/* Hero */}
      <div className="vi-hero">
        <h1 className="vi-hero-title">Volunteer Impact</h1>
        <p className="vi-hero-sub">
          Documenting the profound legacy of individuals driving social change through the Navyug RaiseAPlayer Foundation.
        </p>
      </div>

      {/* Main */}
      <div className="vi-content">
        {loading ? (
          <div className="vi-loading">
            <div className="vi-spinner" />
            <p>Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="vi-empty">
            <svg width="52" height="52" fill="none" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="#9ca3af" strokeWidth="1.5"/>
            </svg>
            <p>No activities logged yet.</p>
          </div>
        ) : (
          <>
            {/* Section header */}
            <div className="vi-section-header">
              <span className="vi-section-title">All Volunteer Activities</span>
              <div className="vi-section-right">
                <a href="/volunteers/list" className="vi-view-volunteers-btn">View Volunteers</a>
                <span className="vi-section-count">{String(total).padStart(2, "0")} TOTAL</span>
              </div>
            </div>
            <div className="vi-section-divider" />

            {/* Activity grid */}
            <div className="vi-act-grid">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="vi-act-card"
                  onClick={() => setSelected(act)}
                >
                  <div className="vi-act-img-wrap">
                    <img
                      src={act.imageUrl}
                      alt="Activity"
                      className="vi-act-img"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }}
                    />
                    <span className="vi-act-date-badge">
                      {new Date(act.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="vi-act-body">
                    <p className="vi-act-campaign">{act.helpedCampaign}</p>
                    <p className="vi-act-note">{act.note}</p>
                    <p className="vi-act-by">
                      Volunteered by: <span>{act.volunteer.user.firstName} {act.volunteer.user.lastName}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="vi-load-more">
                <button className="vi-load-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? (
                    <><span className="vi-load-spinner" /> Loading...</>
                  ) : (
                    `Load more (${total - activities.length} remaining)`
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
              <button className="vi-cta-btn" onClick={() => window.location.href = "/volunteer"}>
                BECOME A MEMBER
              </button>
            </div>
          </>
        )}
      </div>

      {/* Volunteer detail modal */}
      {selected && (
        <div className="vi-modal-overlay" onClick={() => setSelected(null)}>
          <div className="vi-modal" onClick={(e) => e.stopPropagation()}>
            {/* Activity image */}
            <div className="vi-modal-img-wrap">
              <img
                src={selected.imageUrl}
                alt="Activity"
                className="vi-modal-img"
                onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }}
              />
              <button className="vi-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Volunteer info */}
            <div className="vi-modal-body">
              <div className="vi-modal-volunteer">
                <img
                  src={selected.volunteer.user.profileImageUrl || "/icon.png"}
                  alt={selected.volunteer.user.firstName}
                  className="vi-modal-avatar"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }}
                />
                <div>
                  <p className="vi-modal-vol-name">
                    {selected.volunteer.user.firstName} {selected.volunteer.user.lastName}
                  </p>
                  <p className="vi-modal-vol-meta">
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#6b7280" strokeWidth="2"/>
                      <circle cx="12" cy="9" r="2.5" stroke="#6b7280" strokeWidth="2"/>
                    </svg>
                    {selected.volunteer.city}
                  </p>
                  <p className="vi-modal-vol-id">ID: {selected.volunteer.id}</p>
                </div>
                <span className="vi-modal-badge">
                  <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="#065f46"/>
                    <path d="M7 12.5l3.5 3.5 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Active
                </span>
              </div>

              <div className="vi-modal-divider" />

              {/* Activity detail */}
              <p className="vi-modal-campaign">{selected.helpedCampaign}</p>
              <p className="vi-modal-date">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#065f46" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="#065f46" strokeWidth="2"/>
                </svg>
                {new Date(selected.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="vi-modal-note">{selected.note}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
