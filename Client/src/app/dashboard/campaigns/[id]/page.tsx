"use client";

import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FundraiserService } from "@/services/fundraiser.service";
import "./campaign-details.css";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import DonorsList from "@/components/donation/DonorsList";
import CreateWithdrawalModal from "@/components/payouts/WithdrawForm";
import WithdrawalHistoryTable from "@/components/payouts/WithdrawalHistoryTable";
import { PayoutRequestsService } from "@/services/payoutRequests.service";
import AlertModal from "@/components/ui/AlertModal";
import { useAuth } from "@/context/AuthContext";
import type { CampaignDetail, RecipientAccount } from "@/types/campaign.types";
import type { PayoutItem } from "@/types/payout.types";

const CampaignUpdatesSection = lazy(() => import("./_components/CampaignUpdatesSection"));
const DocumentsSection = lazy(() => import("./_components/DocumentsSection"));
const MediaSection = lazy(() => import("./_components/MediaSection"));
const RecipientBankSection = lazy(() => import("./_components/RecipientBankSection"));

function addCacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoaded } = useAuth();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string>("");

  const [expandedStory, setExpandedStory] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const storyRef = useRef<HTMLParagraphElement | null>(null);

  const [payoutRequests, setPayoutRequests] = useState<PayoutItem[]>([]);
  const [payoutRefreshKey, setPayoutRefreshKey] = useState(0);
  const [availableAmount, setAvailableAmount] = useState(0);

  const [alertMsg, setAlertMsg] = useState("");

  const isRejected = campaign?.status === "REJECTED";


  /* ================= FETCH HELPERS ================= */

  const fetchPayouts = async () => {
    if (!id) return;
    try {
      const res = await PayoutRequestsService.list(id as string);
      setPayoutRequests(res.data.data);
    } catch {
      setPayoutRequests([]);
    }
    setPayoutRefreshKey((k) => k + 1);
  };

  const fetchCampaign = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setFetchError(false);
      const res = await FundraiserService.getCampaignById(id);
      const data: CampaignDetail = res.data.data;
      setCampaign(data);
      if (data.coverImageURL) {
        setCoverUrl((prev) => prev || data.coverImageURL!);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch campaign", err);
      }
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (!id || !isLoaded) return;
    const load = async () => {
      await fetchCampaign();
      await fetchPayouts();
    };
    load();
  }, [id, isLoaded]);

  useEffect(() => {
    if (!campaign) return;
    const reserved = payoutRequests
      .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
      .reduce((s, r) => s + Number(r.amount), 0);
    const paid = payoutRequests
      .filter((r) => r.status === "PAID")
      .reduce((s, r) => s + Number(r.amount), 0);
    setAvailableAmount(Number(campaign.raisedAmount || 0) - reserved - paid);
  }, [campaign, payoutRequests]);

  useEffect(() => {
    const el = storyRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      setShowReadMore(el.scrollHeight > el.clientHeight);
    });
  }, [campaign?.story]);

  /* ================= LOADING / ERROR ================= */

  if (loading) return <div className="dashboard-center">Loading campaign…</div>;

  if (fetchError) {
    return (
      <div className="dashboard-center">
        Unable to load campaign details. Please check your connection and try again.
      </div>
    );
  }

  if (!campaign) return <div className="dashboard-center">Campaign not found.</div>;

  /* ================= DERIVED VALUES ================= */

  const raised = Math.max(0, Number(campaign.raisedAmount) || 0);
  const goal = Math.max(0, Number(campaign.goalAmount) || 0);
  const progress = goal === 0 ? 0 : Math.min(Math.round((raised / goal) * 100), 100);

  /* ================= COVER UPLOAD ================= */

  const handleCoverUpload = async (file: File) => {
    if (!id) return;
    try {
      setUploadingCover(true);
      const res = await FundraiserService.uploadCoverImage(id, file);
      const newUrl = res?.data?.fundraiser?.coverImageURL;
      if (newUrl) {
        setCoverUrl(addCacheBust(newUrl));
        setCampaign((prev) => prev ? { ...prev, coverImageURL: newUrl } : prev);
      }
    } catch (err) {
      console.error("Cover upload failed", err);
    } finally {
      setUploadingCover(false);
    }
  };
  

  /* ================= RENDER ================= */

  return (
    <div className="campaign-page">

      {/* TOP BAR */}
      <header className="campaign-topbar">
        <button className="back-btn" onClick={() => router.push("/dashboard")}>← My Fundraisers</button>
        <span className="manage-text">Manage</span>
        <StatusBadge status={campaign.status} />
      </header>

      {/* REJECTION BANNER */}
      {campaign.status === "REJECTED" && campaign.rejectionReason && (
        <section className="rejection-banner">
          <div className="rejection-icon">❌</div>
          <div className="rejection-content">
            <h4>Campaign Rejected</h4>
            <p className="rejection-reason">{campaign.rejectionReason}</p>
          </div>
        </section>
      )}

      {/* HEADER */}
      <section className="campaign-header">
        <h1>{campaign.title}</h1>
        <p className="subtitle">{campaign.shortDescription}</p>
      </section>

      {/* TWO-COLUMN GRID */}
      <div className="campaign-main-grid">

        {/* LEFT COLUMN */}
        <div className="campaign-left-column">

          {/* COVER */}
          <section className="cover-section">
            <div className="cover-box">
              <img
                src={coverUrl || campaign.coverImageURL || "/background.png"}
                alt="Campaign cover"
                className="cover-image"
              />
              <div className="cover-overlay">
                {!isRejected && (
                  <label className="cover-btn">
                    {uploadingCover ? "Uploading…" : "Add / Edit Cover Image"}
                    <input
                      type="file" accept="image/*" hidden
                      onChange={(e) => e.target.files && handleCoverUpload(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* HIGHLIGHTS */}
          <section className="highlights-card">
            <div className="highlight-row">
              <div className="highlight-item full">
                <span className="highlight-label">Sport</span>
                <span className="skill-chip">{campaign.sport}</span>
              </div>
            </div>
            {campaign.level && (
              <div className="highlight-row">
                <div className="highlight-item full">
                  <span className="highlight-label">Level</span>
                  <span className="skill-chip">{campaign.level}</span>
                </div>
              </div>
            )}
            <div className="highlight-row">
              <div className="highlight-item full">
                <span className="highlight-label">Discipline</span>
                <span className="skill-chip">{campaign.discipline || "—"}</span>
              </div>
            </div>
            <div className="highlight-row">
              <div className="highlight-item full">
                <span className="highlight-label">Location</span>
                <span className="skill-chip">{campaign.city}, {campaign.state}, {campaign.country}</span>
              </div>
            </div>
            {Array.isArray(campaign.skills) && campaign.skills.length > 0 && (
              <div className="highlight-row">
                <div className="highlight-item full">
                  <span className="highlight-label">Key Skills</span>
                  <div className="skill-chip-row">
                    {campaign.skills.map((skill: string, idx: number) => (
                      <span className="skill-chip" key={idx}>{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* BENEFICIARY */}
          <section className="beneficiary-section">
            <span className="highlight-label">Beneficiary</span>
            {campaign.campaignFor === "SELF" && campaign.beneficiaryUser && (
              <div className="beneficiary-inline">
                <div className="beneficiary-avatar">{campaign.beneficiaryUser.firstName?.[0]}</div>
                <div className="beneficiary-info">
                  <strong>{campaign.beneficiaryUser.firstName} {campaign.beneficiaryUser.lastName}</strong>
                  <span className="beneficiary-meta">Organizer • Self</span>
                </div>
              </div>
            )}
            {campaign.campaignFor === "OTHER" && campaign.beneficiaryOther && (
              <div className="beneficiary-inline">
                <div className="beneficiary-avatar">{campaign.beneficiaryOther.fullName?.[0]}</div>
                <div className="beneficiary-info">
                  <strong>{campaign.beneficiaryOther.fullName}</strong>
                  <span className="beneficiary-meta">{campaign.beneficiaryOther.relationshipToCreator}</span>
                </div>
              </div>
            )}
          </section>

          {/* STORY */}
          <section className="story-section">
            <h3>My Journey</h3>
            {campaign.story ? (
              <>
                <p ref={storyRef} className={`story-text ${expandedStory ? "expanded" : "collapsed"}`}>
                  {campaign.story}
                </p>
                {showReadMore && (
                  <button className="read-more-story-btn" onClick={() => setExpandedStory((p) => !p)}>
                    {expandedStory ? "Read less" : "Read more"}
                  </button>
                )}
              </>
            ) : (
              <p className="story-empty">No story added yet.</p>
            )}
          </section>

        </div>

        {/* RIGHT COLUMN */}
        <div className="campaign-right-column">

          {/* PROGRESS */}
          <section className="progress-card">
            <div className="progress-card-header">
              <div>
                <div className="total-raised">₹{raised.toLocaleString()}</div>
                <div className="goal-text">of ₹{goal.toLocaleString()}</div>
              </div>
              <div className="progress-percent">{progress}%</div>
            </div>
            <div className="progress-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
          </section>

          {/* DONORS */}
          {campaign.donations && (
            <DonorsList donations={campaign.donations} fundraiserId={campaign.id} maxItems={5} />
          )}

        </div>
      </div>

      {/* MEDIA */}
      <Suspense fallback={<div className="dashboard-center">Loading media…</div>}>
        <MediaSection campaignId={id as string} initialMedia={campaign.media ?? []} isRejected={isRejected} />
      </Suspense>

      {/* DOCUMENTS */}
      <Suspense fallback={<div className="dashboard-center">Loading documents…</div>}>
        <DocumentsSection fundraiserId={id as string} isRejected={isRejected} onAlert={setAlertMsg} />
      </Suspense>

      {/* RECIPIENT BANK ACCOUNT */}
      <Suspense fallback={<div className="dashboard-center">Loading bank details…</div>}>
        <RecipientBankSection
          campaignId={id as string}
          existingAccount={campaign.recipientAccount ?? null}
          isRejected={isRejected}
          onSaved={(account: RecipientAccount) =>
            setCampaign((prev) => prev ? { ...prev, recipientAccount: account } : prev)
          }
        />
      </Suspense>

      {/* WITHDRAWAL */}
      {(campaign.status === "ACTIVE" || campaign.status === "COMPLETED") && (
        <CreateWithdrawalModal fundraiserId={id} available={availableAmount} onSuccess={fetchPayouts} />
      )}

      <WithdrawalHistoryTable fundraiserId={id} onRefresh={fetchPayouts} refreshKey={payoutRefreshKey} />

      {/* UPDATES */}
      {campaign.status === "ACTIVE" && (
        <Suspense fallback={<div className="dashboard-center">Loading updates…</div>}>
          <CampaignUpdatesSection rawUpdates={campaign.fundraiserupdates ?? []} fundraiserId={id as string} />
        </Suspense>
      )}

      {alertMsg && <AlertModal message={alertMsg} type="error" onClose={() => setAlertMsg("")} />}
    </div>
  );
}
