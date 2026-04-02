"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { VolunteerService } from "@/services/volunteer.service";
import "../volunteers.css";

type VolunteerInfo = {
  id: string;
  city: string;
  user: { firstName: string; lastName: string; profileImageUrl: string | null };
};

type Activity = {
  id: string;
  imageUrl: string;
  date: string;
  note: string;
  helpedCampaign: string;
};

export default function VolunteerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [volunteer, setVolunteer] = useState<VolunteerInfo | null | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Activity | null>(null);

  useEffect(() => {
    if (!id) return;
    VolunteerService.getPublicActivities(id)
      .then((res) => {
        setVolunteer(res.data?.volunteer ?? null);
        setActivities(res.data?.data ?? []);
      })
      .catch(() => setVolunteer(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || volunteer === undefined) {
    return (
      <div className="vi-loading" style={{ minHeight: "60vh" }}>
        <div className="vi-spinner" />
        <p>Loading volunteer profile...</p>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="vi-empty" style={{ minHeight: "60vh" }}>
        <svg width="52" height="52" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="1.5"/>
          <path d="M15 9l-6 6M9 9l6 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p>Volunteer not found.</p>
        <button className="vd-back-btn" onClick={() => router.push("/volunteers")}>← Back to Volunteers</button>
      </div>
    );
  }

  return (
    <div className="vi-page">
      {/* Hero */}
      <div className="vi-hero vd-hero">
        <button className="vd-back-link" onClick={() => router.push("/volunteers")}>← Back</button>
        <img
          src={volunteer.user.profileImageUrl || "/icon.png"}
          alt={`${volunteer.user.firstName} ${volunteer.user.lastName}`}
          className="vd-hero-avatar"
          onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }}
        />
        <h1 className="vi-hero-title">{volunteer.user.firstName} {volunteer.user.lastName}</h1>
        <p className="vi-hero-sub">{volunteer.city} · {volunteer.id}</p>
        <div className="vi-badge vd-hero-badge">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#065f46"/>
            <path d="M7 12.5l3.5 3.5 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Active Volunteer
        </div>
      </div>

      {/* Activities */}
      <div className="vi-content">
        <p className="vi-count">{activities.length} activit{activities.length !== 1 ? "ies" : "y"} logged</p>

        {activities.length === 0 ? (
          <div className="vi-empty" style={{ minHeight: "30vh" }}>
            <p>No activities logged yet by this volunteer.</p>
          </div>
        ) : (
          <div className="vd-grid">
            {activities.map((act) => (
              <div key={act.id} className="vd-act-card" onClick={() => setSelected(act)}>
                <div className="vd-act-img-wrap">
                  <img
                    src={act.imageUrl}
                    alt="Activity"
                    className="vd-act-img"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }}
                  />
                  <span className="vd-act-date-badge">
                    {new Date(act.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="vd-act-body">
                  <p className="vd-act-campaign">{act.helpedCampaign}</p>
                  <p className="vd-act-note">{act.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity detail modal */}
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
