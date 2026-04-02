"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { VolunteerService } from "@/services/volunteer.service";
import "./volunteer.css";

type VolunteerData = {
  id: string;
  city: string;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
};

type Activity = {
  id: string;
  imageUrl: string;
  date: string;
  note: string;
  helpedCampaign: string;
  createdAt: string;
};

export default function VolunteerPage() {
  const { user, isAuthenticated, isLoaded } = useAuth();
  const router = useRouter();

  const [volunteer, setVolunteer] = useState<VolunteerData | null | undefined>(undefined);

  // Apply form
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Portal login
  const [volunteerId, setVolunteerId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [portalUnlocked, setPortalUnlocked] = useState(false);

  // Activities
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [actImage, setActImage] = useState<File | null>(null);
  const [actDate, setActDate] = useState("");
  const [actNote, setActNote] = useState("");
  const [actCampaign, setActCampaign] = useState("");
  const [actSubmitting, setActSubmitting] = useState(false);
  const [actError, setActError] = useState("");
  const [actPreview, setActPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Delete confirm modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Activity detail modal
  const [viewActivity, setViewActivity] = useState<Activity | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    VolunteerService.getMyStatus()
      .then((res) => {
        const data = res.data;
        const v = data && data.status ? data : null;
        setVolunteer(v);
        if (v?.status === "ACCEPTED") setVolunteerId(v.id);
      })
      .catch(() => setVolunteer(null));
  }, [isLoaded, isAuthenticated]);

  // Load activities once portal is unlocked
  useEffect(() => {
    if (!portalUnlocked) return;
    setActivitiesLoading(true);
    VolunteerService.getMyActivities()
      .then((res) => setActivities(res.data?.data ?? []))
      .catch(() => setActivities([]))
      .finally(() => setActivitiesLoading(false));
  }, [portalUnlocked]);

  if (!isLoaded || volunteer === undefined) {
    return (
      <div className="vp-loading-screen">
        <div className="vp-spinner" />
        <p>Loading volunteer status...</p>
      </div>
    );
  }

  // ── Apply form ────────────────────────────────────────────────────────────
  const handleApply = async () => {
    setFormError("");
    if (!city.trim()) { setFormError("City is required."); return; }
    setSubmitting(true);
    try {
      const res = await VolunteerService.apply({ city: city.trim(), message: message.trim() || undefined });
      setVolunteer(res.data?.volunteer ?? null);
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Portal verify ─────────────────────────────────────────────────────────
  const handleVerify = async () => {
    setVerifyError("");
    if (!volunteerId.trim()) { setVerifyError("Please enter your Volunteer ID."); return; }
    setVerifying(true);
    try {
      await VolunteerService.verifyPortal({ volunteerId: volunteerId.trim(), password: password || undefined });
      setPortalUnlocked(true);
    } catch (err: any) {
      setVerifyError(err?.response?.data?.message ?? "Verification failed. Please check your credentials.");
    } finally {
      setVerifying(false);
    }
  };

  // ── Add activity ──────────────────────────────────────────────────────────
  const handleAddActivity = async () => {
    setActError("");
    if (!actImage)    { setActError("Please upload an image."); return; }
    if (!actDate)     { setActError("Please select a date."); return; }
    if (!actNote.trim())     { setActError("Please add a note."); return; }
    if (!actCampaign.trim()) { setActError("Please enter who you helped."); return; }

    setActSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("image", actImage);
      fd.append("date", actDate);
      fd.append("note", actNote.trim());
      fd.append("helpedCampaign", actCampaign.trim());

      const res = await VolunteerService.addActivity(fd);
      setActivities((prev) => [res.data.activity, ...prev]);
      setActImage(null); setActPreview(null);
      setActDate(""); setActNote(""); setActCampaign("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      setActError(err?.response?.data?.message ?? "Failed to log activity.");
    } finally {
      setActSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      if (!file.type.startsWith("image/")) {
        setActError("Only image files are allowed.");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setActError("Image must be under 5 MB.");
        if (fileRef.current) fileRef.current.value = "";
        return;
      }
    }
    setActError("");
    setActImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setActPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setActPreview(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await VolunteerService.deleteActivity(deleteId);
      setActivities((prev) => prev.filter((a) => a.id !== deleteId));
    } catch {
      // silently ignore
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  // ── No application ────────────────────────────────────────────────────────
  if (volunteer === null) {
    return (
      <div className="vp-container">
        <div className="vp-card">
          <div className="vp-icon-circle neutral">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="#9ca3af"/>
            </svg>
          </div>
          <h2 className="vp-title">Become a Volunteer</h2>
          <p className="vp-subtitle">Join the Navyug RaiseAPlayer Foundation and help support the next generation of athletes across India.</p>
          <div className="vp-apply-form">
            <div className="vp-field">
              <label htmlFor="apply-city">City <span className="vp-required">*</span></label>
              <input id="apply-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" disabled={submitting} />
            </div>
            <div className="vp-field">
              <label htmlFor="apply-message">Why do you want to volunteer? <span className="vp-optional">(optional)</span></label>
              <textarea id="apply-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us a bit about yourself..." rows={3} disabled={submitting} />
            </div>
            {formError && <p className="vp-form-error">{formError}</p>}
            <button className="vp-btn-primary" onClick={handleApply} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PENDING ───────────────────────────────────────────────────────────────
  if (volunteer.status === "PENDING") {
    return (
      <div className="vp-container">
        <div className="vp-card">
          <div className="vp-icon-circle pending">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#d97706" strokeWidth="2"/>
              <path d="M12 7v5l3 3" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="vp-title">Application Under Review</h2>
          <p className="vp-subtitle">Your volunteer application is being reviewed by our team. We will notify you via email once a decision is made.</p>
          <div className="vp-info-row">
            <span className="vp-info-label">City</span>
            <span className="vp-info-value">{volunteer.city}</span>
          </div>
          <div className="vp-info-row">
            <span className="vp-info-label">Applied On</span>
            <span className="vp-info-value">{new Date(volunteer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── REJECTED ──────────────────────────────────────────────────────────────
  if (volunteer.status === "REJECTED") {
    return (
      <div className="vp-container">
        <div className="vp-card">
          <div className="vp-icon-circle rejected">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="vp-title">Application Not Approved</h2>
          <p className="vp-subtitle">Unfortunately your volunteer application was not approved at this time. You can still support our mission by donating to active campaigns.</p>
          <button className="vp-btn-secondary" onClick={() => router.push("/donate")}>Explore Campaigns</button>
        </div>
      </div>
    );
  }

  // ── ACCEPTED — safety guard ───────────────────────────────────────────────
  if (volunteer.status !== "ACCEPTED") {
    return (
      <div className="vp-container">
        <div className="vp-card">
          <h2 className="vp-title">Something went wrong</h2>
          <p className="vp-subtitle">Unable to load your volunteer status. Please refresh the page.</p>
          <button className="vp-btn-primary" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </div>
    );
  }

  // ── ACCEPTED ──────────────────────────────────────────────────────────────
  return (
    <>
    {!portalUnlocked ? (
      /* ── Portal login (keep card layout) ─────────────────────────────── */
      <div className="vp-container">
        <div className="vp-card accepted">
          <div className="vp-accepted-header">
            <div className="vp-icon-circle accepted">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#065f46"/>
                <path d="M7 12.5l3.5 3.5 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="vp-title">Active Volunteer</h2>
              <p className="vp-subtitle">Welcome back, {user?.firstName}!</p>
            </div>
          </div>
          <div className="vp-id-card">
            <p className="vp-id-label">Your Volunteer ID</p>
            <p className="vp-id-code">{volunteer.id}</p>
            <p className="vp-id-hint">Use this ID to log into the volunteer portal</p>
          </div>
          <div className="vp-divider" />
          <div className="vp-login-section">
            <h3 className="vp-login-title">Volunteer Portal Login</h3>
            <div className="vp-field">
              <label htmlFor="vol-id">Volunteer ID</label>
              <input id="vol-id" type="text" value={volunteerId} readOnly />
            </div>

            {user?.provider !== "GOOGLE" && (
              <div className="vp-field">
                <label htmlFor="vol-pass">Password</label>
                <div className="vp-password-wrapper">
                  <input id="vol-pass" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your account password" />
                  <button type="button" className="vp-eye-btn" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="#6b7280" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="vp-pass-hint">Enter the password you used to sign up on RaiseAPlayer.</p>
              </div>
            )}

            {verifyError && <p className="vp-form-error">{verifyError}</p>}
            <button className="vp-btn-primary" onClick={handleVerify} disabled={verifying}>
              {verifying ? "Verifying..." : "Login to Volunteer Portal"}
            </button>
          </div>
        </div>
      </div>
    ) : (
      /* ── Portal unlocked — dashboard layout ───────────────────────────── */
      <div className="vp-dashboard">

        {/* LEFT — welcome + form */}
        <div className="vp-dash-left">
          <div className="vp-welcome">
            <h1 className="vp-welcome-title">Welcome back, <span className="vp-welcome-name">{user?.firstName}!</span></h1>
            <p className="vp-welcome-sub">Your contribution today makes a difference in the lives of young athletes. Let&apos;s create more impact together.</p>
          </div>

          <div className="vp-act-form vp-dash-form">
            <div className="vp-dash-form-header">
              <h4 className="vp-act-form-title">Log a Help Activity</h4>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#065f46" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <div className="vp-image-upload vp-dash-upload" onClick={() => fileRef.current?.click()}>
              {actPreview ? (
                <img src={actPreview} alt="Preview" className="vp-image-preview" />
              ) : (
                <div className="vp-image-placeholder">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="#9ca3af" strokeWidth="1.5"/>
                    <line x1="12" y1="9" x2="12" y2="7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="14" y1="7" x2="10" y2="7" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p>Upload Activity Proof</p>
                  <span>JPEG, PNG up to 5MB</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
            </div>

            <div className="vp-act-row">
              <div className="vp-field">
                <label>DATE</label>
                <input type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} max={new Date().toISOString().split("T")[0]} placeholder="dd/mm/yyyy" />
              </div>
              <div className="vp-field" style={{ flex: 2 }}>
                <label>HELPED WHOM / CAMPAIGN <span style={{ fontWeight: 400, color: actCampaign.length > 80 ? "#dc2626" : "#9ca3af" }}>({actCampaign.length}/80)</span></label>
                <input type="text" value={actCampaign} onChange={(e) => { if (e.target.value.length <= 80) setActCampaign(e.target.value); }} placeholder="e.g. Arjun Sharma - Football Club" maxLength={80} />
              </div>
            </div>

            <div className="vp-field">
              <label>NOTE <span style={{ fontWeight: 400, color: actNote.length > 300 ? "#dc2626" : "#9ca3af" }}>({actNote.length}/300)</span></label>
              <textarea value={actNote} onChange={(e) => { if (e.target.value.length <= 300) setActNote(e.target.value); }} placeholder="Brief description of the impact created..." rows={3} maxLength={300} />
            </div>

            {actError && <p className="vp-form-error">{actError}</p>}
            <button className="vp-dash-save-btn" onClick={handleAddActivity} disabled={actSubmitting}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 21 17 13 7 13 7 21" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 3 7 8 15 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {actSubmitting ? "Saving..." : "Save Activity"}
            </button>
          </div>
        </div>

        {/* RIGHT — ID card + activities + pulse */}
        <div className="vp-dash-right">

          {/* Membership card */}
          <div className="vp-membership-card">
            <div className="vp-mc-top">
              <span className="vp-mc-type">ACTIVE VOLUNTEER</span>
              <span className="vp-mc-status">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.3)"/>
                  <path d="M7 12.5l3.5 3.5 6-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                STATUS: UNLOCKED
              </span>
            </div>
            <p className="vp-mc-name">{user?.firstName}</p>
            <p className="vp-mc-id-label">VOLUNTEER ID</p>
            <p className="vp-mc-id">{volunteer.id}</p>
            <p className="vp-mc-level">🏆 Volunteer Impact</p>
          </div>

          {/* Activities list */}
          <div className="vp-dash-acts">
            <div className="vp-dash-acts-header">
              <h3 className="vp-dash-acts-title">My Activities ({activities.length})</h3>
            </div>
            {activitiesLoading ? (
              <div className="vp-act-loading"><div className="vp-spinner" /></div>
            ) : activities.length === 0 ? (
              <p className="vp-no-activities">No activities yet. Log your first one!</p>
            ) : (
              <div className="vp-dash-act-list">
                {activities.slice(0, 5).map((act) => (
                  <div key={act.id} className="vp-dash-act-item" onClick={() => setViewActivity(act)} style={{ cursor: "pointer" }}>
                    <img src={act.imageUrl} alt="Activity" className="vp-dash-act-thumb" onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }} />
                    <div className="vp-dash-act-info">
                      <p className="vp-dash-act-campaign">{act.helpedCampaign}</p>
                      <p className="vp-dash-act-date">{new Date(act.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <button className="vp-act-delete" onClick={(e) => { e.stopPropagation(); setDeleteId(act.id); }} aria-label="Delete activity">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M10 11v6M14 11v6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Community pulse */}
          <div className="vp-pulse-card">
            <p className="vp-pulse-label">COMMUNITY PULSE</p>
            <p className="vp-pulse-count">{activities.length}</p>
            <p className="vp-pulse-sub">Activities Logged</p>
          </div>

        </div>
      </div>
    )}

    {/* Activity detail modal */}
    {viewActivity && (
      <div className="vp-modal-overlay" onClick={() => setViewActivity(null)}>
        <div className="vp-act-detail-modal" onClick={(e) => e.stopPropagation()}>
          <img src={viewActivity.imageUrl} alt="Activity" className="vp-act-detail-img" onError={(e) => { (e.target as HTMLImageElement).src = "/icon.png"; }} />
          <div className="vp-act-detail-body">
            <p className="vp-act-detail-campaign">{viewActivity.helpedCampaign}</p>
            <p className="vp-act-detail-date">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#065f46" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="#065f46" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="#065f46" strokeWidth="2"/>
              </svg>
              {new Date(viewActivity.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="vp-act-detail-note">{viewActivity.note}</p>
            <button className="vp-modal-cancel" style={{ width: "100%", marginTop: "8px" }} onClick={() => setViewActivity(null)}>Close</button>
          </div>
        </div>
      </div>
    )}

    {/* Delete confirmation modal */}
    {deleteId && (
      <div className="vp-modal-overlay" onClick={() => !deleting && setDeleteId(null)}>
        <div className="vp-modal" onClick={(e) => e.stopPropagation()}>
          <div className="vp-modal-icon">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 11v6M14 11v6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="vp-modal-title">Delete Activity?</h3>
          <p className="vp-modal-text">This activity will be permanently deleted and cannot be recovered.</p>
          <div className="vp-modal-actions">
            <button className="vp-modal-cancel" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
            <button className="vp-modal-confirm" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );

  
}
