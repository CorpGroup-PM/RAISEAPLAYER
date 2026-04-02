"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type PublicVolunteer = {
  id: string;
  city: string;
  createdAt: string;
  user: { firstName: string; lastName: string; profileImageUrl: string | null };
};

const LIMIT = 12;
const VOL_SIDEBAR = 5;
const VOL_MODAL = 20;

export default function VolunteersPage() {
  const router = useRouter();

  const [activities, setActivities]     = useState<Activity[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [selected, setSelected]         = useState<Activity | null>(null);

  // sidebar
  const [recentVols, setRecentVols]     = useState<PublicVolunteer[]>([]);
  const [totalVols, setTotalVols]       = useState(0);

  // all-volunteers modal
  const [showVolsModal, setShowVolsModal]   = useState(false);
  const [allVols, setAllVols]               = useState<PublicVolunteer[]>([]);
  const [allVolsPage, setAllVolsPage]       = useState(1);
  const [loadingAllVols, setLoadingAllVols] = useState(false);
  const [loadingMoreVols, setLoadingMoreVols] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      VolunteerService.getAllPublicActivities(1, LIMIT),
      VolunteerService.getPublicVolunteers(1, VOL_SIDEBAR),
    ])
      .then(([actRes, volRes]) => {
        setActivities(actRes.data?.data ?? []);
        setTotal(actRes.data?.total ?? 0);
        setPage(1);
        setRecentVols(volRes.data?.data ?? []);
        setTotalVols(volRes.data?.total ?? 0);
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

  const openVolsModal = () => {
    setShowVolsModal(true);
    if (allVols.length === 0) {
      setLoadingAllVols(true);
      VolunteerService.getPublicVolunteers(1, VOL_MODAL)
        .then((res) => {
          setAllVols(res.data?.data ?? []);
          setAllVolsPage(1);
        })
        .catch(() => {})
        .finally(() => setLoadingAllVols(false));
    }
  };

  const loadMoreVols = () => {
    const nextPage = allVolsPage + 1;
    setLoadingMoreVols(true);
    VolunteerService.getPublicVolunteers(nextPage, VOL_MODAL)
      .then((res) => {
        setAllVols((prev) => [...prev, ...(res.data?.data ?? [])]);
        setAllVolsPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMoreVols(false));
  };

  const hasMore = activities.length < total;
  const hasMoreVols = allVols.length < totalVols;

  const initials = (v: PublicVolunteer) =>
    (v.user.firstName?.[0] ?? "?").toUpperCase();

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
          <div className="vi-two-col">

            {/* ── Left: activities ── */}
            <div className="vi-main-col">
              <div className="vi-section-header">
                <span className="vi-section-title">All Volunteer Activities</span>
                <div className="vi-section-right">
                  <span className="vi-section-count">{String(total).padStart(2, "0")} TOTAL</span>
                </div>
              </div>
              <div className="vi-section-divider" />

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
                        Impacted by: <span>{act.volunteer.user.firstName} {act.volunteer.user.lastName}</span>
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
            </div>

            {/* ── Right: recent volunteers panel ── */}
            <div className="vi-sidebar-col">
              <div className="rv-panel">
                <div className="rv-head">
                  <h3 className="rv-title">Recent Volunteers</h3>
                  {totalVols > 0 && (
                    <span className="rv-count-badge">{totalVols} total</span>
                  )}
                </div>

                <div className="rv-list">
                  {recentVols.length === 0 ? (
                    <p className="rv-empty">No volunteers yet.</p>
                  ) : (
                    recentVols.map((v) => (
                      <div key={v.id} className="rv-row" style={{ cursor: "pointer" }} onClick={() => router.push(`/volunteers/${v.id}`)}>
                        {v.user.profileImageUrl ? (
                          <img
                            src={v.user.profileImageUrl}
                            alt={v.user.firstName}
                            className="rv-avatar-img"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="rv-avatar-letter">{initials(v)}</div>
                        )}
                        <div className="rv-info">
                          <span className="rv-name">{v.user.firstName} {v.user.lastName}</span>
                          <span className="rv-city">{v.city}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="rv-view-all-btn" onClick={openVolsModal}>
                  View all volunteers
                </button>
              </div>
            </div>
          </div>

          {/* ── CTA below two-col so sidebar stops before it ── */}
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

      {/* ── Activity detail modal ── */}
      {selected && (
        <div className="vi-modal-overlay" onClick={() => setSelected(null)}>
          <div className="vi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vi-modal-img-wrap">
              <img
                src={selected.imageUrl}
                alt="Activity"
                className="vi-modal-img"
                onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }}
              />
              <button className="vi-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
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

      {/* ── All Volunteers modal ── */}
      {showVolsModal && (
        <div className="vi-modal-overlay" onClick={() => setShowVolsModal(false)}>
          <div className="vi-vols-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vi-vols-modal-header">
              <h2 className="vi-vols-modal-title">All Volunteers</h2>
              <button className="vi-vols-modal-close" onClick={() => setShowVolsModal(false)}>✕</button>
            </div>

            <div className="vi-vols-modal-body">
              {loadingAllVols ? (
                <div className="vi-loading" style={{ minHeight: "200px" }}>
                  <div className="vi-spinner" />
                  <p>Loading...</p>
                </div>
              ) : allVols.length === 0 ? (
                <p className="rv-empty" style={{ padding: "24px", textAlign: "center" }}>No volunteers found.</p>
              ) : (
                <>
                  {allVols.map((v) => (
                    <div
                      key={v.id}
                      className="vi-vols-row"
                      onClick={() => { setShowVolsModal(false); router.push(`/volunteers/${v.id}`); }}
                    >
                      {v.user.profileImageUrl ? (
                        <img
                          src={v.user.profileImageUrl}
                          alt={v.user.firstName}
                          className="vi-vols-avatar-img"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="vi-vols-avatar-letter">{initials(v)}</div>
                      )}
                      <div className="vi-vols-info">
                        <span className="vi-vols-name">{v.user.firstName} {v.user.lastName}</span>
                        <span className="vi-vols-city">{v.city}</span>
                      </div>
                      <svg className="vi-vols-arrow" width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path d="M9 18l6-6-6-6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  ))}

                  {hasMoreVols && (
                    <div style={{ padding: "12px 16px" }}>
                      <button className="vi-load-btn" style={{ width: "100%" }} onClick={loadMoreVols} disabled={loadingMoreVols}>
                        {loadingMoreVols ? (
                          <><span className="vi-load-spinner" /> Loading...</>
                        ) : (
                          `Load more (${totalVols - allVols.length} remaining)`
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
