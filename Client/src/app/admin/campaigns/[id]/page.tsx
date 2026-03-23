"use client";

import React, { useEffect, useState, useRef } from "react";
import "./admin.css";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { AdminCampaignsService } from "@/services/admin-campaigns.service";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RecipientAccountService } from "@/services/recipientAccount.service";
import { FundraiserDocumentsService } from "@/services/fundraiserDocuments.service";
import DonorsList from "@/components/donation/DonorsList";
import { CampaignStatus } from "@/services/admin-campaigns.service";
import AdminPayoutList from "@/components/admin/payouts/AdminPayoutList";
import InstagramEmbed from "@/components/instagram/instagram";

type VideoMedia = {
  embedUrl: string;
  originalUrl: string;
};

const isInstagramUrl = (url: string) => url.includes("instagram.com");

function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] || null;
    const pathMatch = u.pathname.match(/\/(?:shorts|live|embed)\/([^/?&]+)/);
    if (pathMatch) return pathMatch[1];
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

type CampaignUpdate = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};


export default function AdminCampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const status =
    (searchParams.get("status") as CampaignStatus) || "PENDING_REVIEW";


  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [imageMedia, setImageMedia] = useState<string[]>([]);
  const [videoMedia, setVideoMedia] = useState<VideoMedia[]>([]);
  const [instagramMedia, setInstagramMedia] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [currentInstagram, setCurrentInstagram] = useState(0);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // B-8-1: confirmation before irreversible actions
  const [confirmAction, setConfirmAction] = useState<{
    label: string;
    warning: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // B-8-2: rejection reason quick-select templates
  const REJECTION_TEMPLATES = [
    "Incomplete or missing information",
    "Unverified or fake claims",
    "Missing required documents",
    "Goal amount seems unrealistic",
    "Violates platform policies",
  ];

  const SUSPENSION_TEMPLATES = [
    "Violation of platform guidelines",
    "Suspicious activity detected",
    "Pending document verification",
    "Fraudulent claims reported",
    "Under review by admin",
  ];
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const account = campaign?.recipientAccount;

  const [documents, setDocuments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
    const updateRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
    const [overflowingUpdates, setOverflowingUpdates] = useState<Record<string, boolean>>({});

  const [showPan, setShowPan] = useState(false);

  const fetchDocuments = async () => {
    if (!id) return;

    try {
      const res = await FundraiserDocumentsService.getDocuments(id);

      const docs = Array.isArray(res?.data)
        ? res.data
        : [];

      setDocuments(docs);
    } catch (err) {
      console.error("Failed to fetch documents", err);
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  /* ================= FETCH CAMPAIGN ================= */
  const fetchCampaign = async () => {
    if (!id) return;

    try {
      const res = await AdminCampaignsService.getCampaignById(id);

      // ✅ correct object from backend
      const campaignData = res?.data?.data;

      setCampaign(campaignData);

      // ✅ fundraiser updates from backend key
      const updatesFromBE = Array.isArray(campaignData?.fundraiserupdates)
        ? campaignData.fundraiserupdates
        : [];

      setUpdates(
        updatesFromBE.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (err) {
      console.error("Failed to fetch campaign", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const nextImage = () => {
    setCurrentImage((prev) =>
      prev === imageMedia.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImage((prev) =>
      prev === 0 ? imageMedia.length - 1 : prev - 1
    );
  };

  const nextVideo = () => {
    setCurrentVideo((prev) =>
      prev === videoMedia.length - 1 ? 0 : prev + 1
    );
  };

  const prevVideo = () => {
    setCurrentVideo((prev) =>
      prev === 0 ? videoMedia.length - 1 : prev - 1
    );
  };

  const nextInstagram = () =>
    setCurrentInstagram((prev) => (prev === instagramMedia.length - 1 ? 0 : prev + 1));
  const prevInstagram = () =>
    setCurrentInstagram((prev) => (prev === 0 ? instagramMedia.length - 1 : prev - 1));

  /* ================= MEDIA NORMALIZATION ================= */
  useEffect(() => {
    if (!campaign?.media) return;

    const images: string[] = [];
    const videos: VideoMedia[] = [];
    const instagrams: string[] = [];

    campaign.media.forEach((item: any) => {
      if (Array.isArray(item.playerImages)) {
        images.push(...item.playerImages);
      }

      if (Array.isArray(item.youTubeUrl)) {
        item.youTubeUrl.forEach((originalUrl: string) => {
          if (isInstagramUrl(originalUrl)) {
            instagrams.push(originalUrl);
          } else {
            const videoId = getYouTubeVideoId(originalUrl);
            if (videoId) {
              videos.push({
                embedUrl: `https://www.youtube.com/embed/${videoId}`,
                originalUrl,
              });
            }
          }
        });
      }
    });

    setImageMedia(images);
    setVideoMedia(videos);
    setInstagramMedia(instagrams);
  }, [campaign?.media]);

  useEffect(() => {
      const newOverflowState: Record<string, boolean> = {};
  
      updates.forEach((update) => {
        const el = updateRefs.current[update.id];
        if (!el) return;
  
        const isOverflowing = el.scrollHeight > el.clientHeight;
        newOverflowState[update.id] = isOverflowing;
      });
  
      setOverflowingUpdates(newOverflowState);
    }, [updates]);

  /* ================= ACTION HANDLERS ================= */
  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    await AdminCampaignsService.approveCampaign(id);
    await fetchCampaign();
    setActionLoading(false);
  };

  const handleActivate = async () => {
    if (!id) return;
    setActionLoading(true);
    await AdminCampaignsService.activateCampaign(id);
    await fetchCampaign();
    setActionLoading(false);
  };

  const handleSuspend = async () => {
    if (!id || !suspendReason.trim()) return;
    setActionLoading(true);
    await AdminCampaignsService.suspendCampaign(id, { reason: suspendReason });
    setShowSuspendModal(false);
    setSuspendReason("");
    await fetchCampaign();
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) return;
    setActionLoading(true);

    await AdminCampaignsService.rejectCampaign(id, {
      rejectionReason,
    });

    setShowRejectModal(false);
    setRejectionReason("");
    await fetchCampaign();
    setActionLoading(false);
  };

  const handleRevoke = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      await AdminCampaignsService.revokeCampaign(id);
      await fetchCampaign();
    } catch (err) {
      console.error("Failed to revoke campaign", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      await AdminCampaignsService.completeCampaign(id);
      await fetchCampaign();
    } catch (err) {
      console.error("Failed to complete campaign", err);
    } finally {
      setActionLoading(false);
    }
  };


  const handleVerify = async () => {
    if (!account?.id) return;

    try {
      setActionLoading(true);

      await RecipientAccountService.verify(account.id);

      // ✅ Update local state (no full refetch needed)
      setCampaign((prev: any) => ({
        ...prev,
        recipientAccount: {
          ...prev.recipientAccount,
          isVerified: true,
        },
      }));
    } catch (err) {
      console.error("Failed to verify recipient account", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPan = async () => {
    if (!id) return;

    try {
      setActionLoading(true);
      await AdminCampaignsService.verifyPan(id);
      setCampaign((prev: any) => ({
        ...prev,
        creator: {
          ...prev.creator,
          panDetails: {
            ...prev.creator?.panDetails,
            isPanVerified: true,
          },
        },
      }));
    } catch (err) {
      console.error("Failed to verify PAN", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDocument = async (documentId: string) => {
    await FundraiserDocumentsService.verifyDocument(documentId, {
      status: "VERIFIED",
    });
    await fetchDocuments(); // ✅ correct
  };

  const handleRejectDocument = async (
    documentId: string,
    reason: string
  ) => {
    await FundraiserDocumentsService.verifyDocument(documentId, {
      status: "REJECTED",
      rejectionReason: reason,
    });
    await fetchDocuments(); // ✅ correct
  };



  if (loading) {
    return (
      <div className="admin-campaign-page admin-page-wrapper">
        <p style={{ padding: "24px" }}>Loading campaign…</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="admin-campaign-page admin-page-wrapper">
        <p style={{ padding: "24px", color: "red" }}>
          Campaign not found
        </p>
      </div>
    );
  }

  const raised = campaign.raisedAmount || 0;
  const goal = campaign.goalAmount || 0;
  const progress =
    goal === 0 ? 0 : Math.min(Math.round((raised / goal) * 100), 100);



  return (
    <>
      <div className="admin-campaign-page admin-page-wrapper">
        {/* ================= TOP BAR ================= */}
        <header className="admin-topbar">
          <button className="admin-back-btn" onClick={() => router.replace(`/admin/campaigns?status=${status}`)}>
            ← Back
          </button>
          <span className="admin-view-text">Admin View</span>
          <StatusBadge status={campaign.status} />
        </header>

        {/* ================= HEADER ================= */}
        <section className="admin-header">
          <h1>{campaign.title}</h1>
          <p className="admin-subtitle">{campaign.shortDescription}</p>
        </section>

        {/* ================= PROGRESS ================= */}
        <section className="admin-progress">
          <div className="admin-progress-header">
            <div>
              <div className="admin-raised">₹{raised.toLocaleString()}</div>
              <div className="admin-goal">of ₹{goal.toLocaleString()}</div>
            </div>
            <div>{progress}%</div>
          </div>

          <div className="admin-progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </section>

        {/* ================= CAMPAIGN HIGHLIGHTS ================= */}
        <section className="campaign-highlights">
          <div className="highlights-card">
            {/* Sport */}
            <div className="highlight-row">
              <div className="highlight-item full">
                <span className="highlight-label">Sport</span>
                <span className="skill-chip">{campaign.sport}</span>
              </div>
            </div>

            {/* Level */}
            {campaign.level && (
              <div className="highlight-row">
                <div className="highlight-item full">
                  <span className="highlight-label">Level</span>
                  <span className="skill-chip">{campaign.level}</span>
                </div>
              </div>
            )}

            {/* Discipline */}
            {campaign.discipline && (
              <div className="highlight-row">
                <div className="highlight-item full">
                  <span className="highlight-label">Discipline</span>
                  <span className="skill-chip">{campaign.discipline}</span>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="highlight-row">
              <div className="highlight-item full">
                <span className="highlight-label">Location</span>
                <span className="skill-chip">
                  {campaign.city}, {campaign.state}, {campaign.country}
                </span>
              </div>
            </div>

            {/* Skills */}
            {Array.isArray(campaign.skills) && campaign.skills.length > 0 && (
              <div className="highlight-row">
                <div className="highlight-item full">
                  <span className="highlight-label">Key Skills</span>
                  <div className="skill-chip-row">
                    {campaign.skills.map((skill: string, idx: number) => (
                      <span className="skill-chip" key={idx}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= COVER ================= */}
        <section className="admin-cover">
          <div className="admin-cover-box">
            <img
              src={campaign.coverImageURL || "/background.png"}
              alt="Campaign cover"
            />
          </div>
        </section>

        {/* ================= BENEFICIARY ================= */}
        <section className="admin-beneficiary">
          <h3>Beneficiary Details</h3>

          {/* ================= SELF (CREATOR) ================= */}
          {campaign.campaignFor === "SELF" && campaign.creator && (
            <div className="admin-beneficiary-card">
              <div className="admin-beneficiary-avatar">
                {campaign.creator.firstName?.[0]}
              </div>

              <div className="admin-beneficiary-content">
                <strong>
                  {campaign.creator.firstName} {campaign.creator.lastName}
                </strong>

                <div>Organizer • Self</div>
              </div>
            </div>
          )}

          {/* ================= OTHER ================= */}
          {campaign.campaignFor === "OTHER" && campaign.beneficiaryOther && (
            <div className="admin-beneficiary-card">
              <div className="admin-beneficiary-avatar">
                {campaign.beneficiaryOther.fullName?.[0]}
              </div>

              <div className="admin-beneficiary-content">
                <strong>{campaign.beneficiaryOther.fullName}</strong>
                <div>{campaign.beneficiaryOther.relationshipToCreator}</div>
                {(campaign.beneficiaryOther.email ||
                  campaign.beneficiaryOther.phoneNumber) && (
                    <div className="beneficiary-contact">
                      {campaign.beneficiaryOther.email && (
                        <span>
                          <span style={{ fontWeight: 600, color: "#111827" }}>Email:</span>{" "}
                          <span>{campaign.beneficiaryOther.email}</span>
                        </span>
                      )}
                      {campaign.beneficiaryOther.phoneNumber && (
                        <span>
                          <span style={{ fontWeight: 600, color: "#111827" }}>Phone:</span>{" "}
                          <span >{campaign.beneficiaryOther.phoneNumber}</span>
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </section>

        {/* ================= CREATOR ================= */}
        <section className="admin-beneficiary">
          <h3>Creator Details</h3>

          {campaign.creator && (
            <div className="admin-beneficiary-card">
              <div className="admin-beneficiary-avatar">
                {campaign.creator.firstName?.[0]}
              </div>

              <div className="admin-beneficiary-content">
                <strong>
                  {campaign.creator.firstName} {campaign.creator.lastName}
                </strong>
                <div className="beneficiary-contact">
                  {campaign.creator.email && (
                    <span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>Email:</span>{" "}
                      <span>{campaign.creator.email}</span>
                    </span>
                  )}
                  {campaign.creator.phoneNumber && (
                    <span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>Phone:</span>{" "}
                      <span >{campaign.creator.phoneNumber}</span>
                    </span>
                  )}
                </div>


                <div className="pan-anchor">
                  <button
                    className="view-pan-btn"
                    onClick={() => setShowPan((v) => !v)}
                  >
                    {showPan ? "Hide PAN Details" : "View PAN Details"}
                  </button>

                  {showPan && (
                    <div className="pan-inline-card">
                      <div className="pan-inline-header">
                        <span className="pan-inline-title">PAN Details</span>
                        {campaign.creator.panDetails?.isPanVerified ? (
                          <span className="pan-verified-chip">&#10003; Verified</span>
                        ) : (
                          <button
                            className="verify-btn"
                            disabled={actionLoading}
                            onClick={handleVerifyPan}
                          >
                            Verify PAN
                          </button>
                        )}
                      </div>

                      <div>
                        <span className="label">PAN Number: </span>
                        <span className="value">
                          {campaign.creator.panDetails?.panNumber || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="label">Name on PAN: </span>
                        <span className="value">
                          {campaign.creator.panDetails?.panName || "—"}
                        </span>
                      </div>

                      <div>
                        <span className="label">Address: </span>
                        <span className="value">
                          {campaign.creator.panDetails
                            ? `${campaign.creator.panDetails.address},
               ${campaign.creator.panDetails.city},
               ${campaign.creator.panDetails.state} -
               ${campaign.creator.panDetails.pincode}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </section>



        {/* ================= STORY ================= */}
        <section className="admin-story">
          <h3>Campaign Story</h3>
          {campaign.story ? (
            <p>{campaign.story}</p>
          ) : (
            <p style={{ color: "#9ca3af" }}>
              No story added for this campaign.
            </p>
          )}
        </section>

        {/* ================= MEDIA ================= */}
        <section className="media-row full-width">

          {/* LEFT: INSTAGRAM */}
          <div className="media-box">
            <h3 className="admin-documents-title">Instagram</h3>

            {instagramMedia.length === 0 ? (
              <div className="media-empty">No Instagram posts added</div>
            ) : (
              <div className="instagram-viewer">
                <div className="instagram-slide-wrap">
                  <InstagramEmbed
                    key={instagramMedia[currentInstagram]}
                    url={instagramMedia[currentInstagram]}
                  />
                </div>
                {instagramMedia.length > 1 && (
                  <div className="instagram-nav-row">
                    <button className="insta-nav-btn" onClick={prevInstagram}>‹</button>
                    <span className="insta-nav-count">
                      {currentInstagram + 1} / {instagramMedia.length}
                    </span>
                    <button className="insta-nav-btn" onClick={nextInstagram}>›</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: IMAGES (top) + YOUTUBE (bottom) */}
          <div className="media-right-col">

            {/* IMAGES */}
            <div className="media-box">
              <h3 className="admin-documents-title">Images</h3>

              {imageMedia.length === 0 ? (
                <div className="media-empty">No images right now</div>
              ) : (
                <>
                  <div className="gallery-image-container">
                    <div
                      className="gallery-track"
                      style={{ transform: `translateX(-${currentImage * 100}%)` }}
                    >
                      {imageMedia.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          className="gallery-image"
                          style={{ cursor: "zoom-in" }}
                          onClick={() => setLightboxUrl(url)}
                        />
                      ))}
                    </div>
                    {imageMedia.length > 1 && (
                      <>
                        <button className="gallery-nav left" onClick={prevImage}>‹</button>
                        <button className="gallery-nav right" onClick={nextImage}>›</button>
                      </>
                    )}
                  </div>
                  {imageMedia.length > 1 && (
                    <div className="gallery-dots">
                      {imageMedia.map((_, i) => (
                        <span
                          key={i}
                          className={`dot ${i === currentImage ? "active" : ""}`}
                          onClick={() => setCurrentImage(i)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* YOUTUBE */}
            <div className="media-box">
              <h3 className="admin-documents-title">YouTube Videos</h3>

              {videoMedia.length === 0 ? (
                <div className="media-empty">No videos right now</div>
              ) : (
                <>
                  <div className="gallery-image-container">
                    <div
                      className="gallery-track"
                      style={{ transform: `translateX(-${currentVideo * 100}%)` }}
                    >
                      {videoMedia.map((v, i) => (
                        <div className="video-box" key={i}>
                          <iframe
                            src={`${v.embedUrl}?rel=0`}
                            title={`Campaign video ${i + 1}`}
                            allowFullScreen
                            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                          />
                        </div>
                      ))}
                    </div>
                    {videoMedia.length > 1 && (
                      <>
                        <button className="gallery-nav left" onClick={prevVideo}>‹</button>
                        <button className="gallery-nav right" onClick={nextVideo}>›</button>
                      </>
                    )}
                  </div>
                  {videoMedia.length > 1 && (
                    <div className="gallery-dots">
                      {videoMedia.map((_, i) => (
                        <span
                          key={i}
                          className={`dot ${i === currentVideo ? "active" : ""}`}
                          onClick={() => setCurrentVideo(i)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </section>
        {/* ================= DOCUMENTS ================= */}
        <section className="admin-documents">
          <h3 className="admin-documents-title">Documents</h3>

          <div className="admin-documents-card">
            {documents.length === 0 ? (
              <p className="admin-documents-empty">No documents uploaded.</p>
            ) : (
              <ul className="admin-documents-list">
                {documents.map((doc) => (
                  <li key={doc.id} className="admin-document-item">
                    {/* LEFT */}
                    <div className="admin-document-info">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-document-link"
                      >
                        {doc.type.replace("_", " ")}
                      </a>

                      <span
                        className={`admin-doc-status ${doc.verificationStatus.toLowerCase()}`}
                      >
                        {doc.verificationStatus}
                      </span>
                    </div>

                    {/* RIGHT */}
                    {doc.verificationStatus === "PENDING" && (
                      <div className="admin-document-actions">
                        <button
                          className="admin-doc-btn verify"
                          onClick={() => handleVerifyDocument(doc.id)}
                        >
                          Verify
                        </button>

                        <button
                          className="admin-doc-btn reject"
                          onClick={() =>
                            handleRejectDocument(
                              doc.id,
                              "Invalid or unclear document"
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {account ? (
          <section className="recipient-admin-card">
            <h3 className="recipient-admin-title">Recipient Bank Account</h3>

            <div className="recipient-admin-grid">
              <div>
                <span className="label">Type</span>
                <span className="value">
                  {account.recipientType.replace("_", " ")}
                </span>
              </div>

              <div>
                <span className="label">Name</span>
                <span className="value">
                  {account.firstName} {account.lastName}
                </span>
              </div>

              <div>
                <span className="label">Bank</span>
                <span className="value">{account.bankName}</span>
              </div>

              <div>
                <span className="label">IFSC</span>
                <span className="value">{account.ifscCode}</span>
              </div>

              <div>
                <span className="label">Account Number</span>
                <span className="value">
                  {account.accountNumber}
                </span>
              </div>

              <div>
                <span className="label">Country</span>
                <span className="value">{account.country}</span>
              </div>
            </div>

            <div className="recipient-admin-footer">
              <span
                className={`status ${account.isVerified ? "verified" : "pending"
                  }`}
              >
                {account.isVerified ? "✅ Verified" : "⚠️ Pending verification"}
              </span>

              {!account.isVerified && (
                <button
                  className="verify-btn"
                  onClick={handleVerify}
                  disabled={actionLoading}
                >
                  Verify Account
                </button>
              )}
            </div>
          </section>
        ) : (
          <section className="recipient-admin-card empty">
            <h3 className="recipient-admin-title">Recipient Bank Account</h3>
            <p className="empty-text">
              ❌ No recipient bank account added yet.
            </p>
          </section>
        )}
        {/* campaign updates */}
        <section className="campaign-updates-section">
       
               <h3>Updates</h3>
       
               {updates.length > 0 ? (
                           <>
                             <div className="updates-list">
               
                               {(showAllUpdates ? updates : updates.slice(0, 2)).map((update) => (
                                 <div className="update-item" key={update.id}>
               
                                   <div className="update-header">
                                     <strong>{update.title}</strong>
               
                                     <span className="update-date">
                                       {new Date(update.createdAt).toLocaleDateString("en-IN", {
                                         day: "numeric",
                                         month: "short",
                                         year: "numeric",
                                       })}
                                     </span>
                                   </div>
               
                                   <p
                                     ref={(el) => {
                                       updateRefs.current[update.id] = el;
                                     }}
                                     className={`update-content ${expandedUpdates[update.id] ? "expanded" : "collapsed"
                                       }`}
                                   >
                                     {update.content.split("\n").map((line, i) => (
                                       <React.Fragment key={i}>
                                         {line}
                                         <br />
                                       </React.Fragment>
                                     ))}
                                   </p>
               
                                   {overflowingUpdates[update.id] && (
                                     <button
                                       className="read-more-story-btn"
                                       onClick={() =>
                                         setExpandedUpdates((prev) => ({
                                           ...prev,
                                           [update.id]: !prev[update.id],
                                         }))
                                       }
                                     >
                                       {expandedUpdates[update.id] ? "Read less" : "Read more"}
                                     </button>
               
                                   )}
               
                                 </div>
                               ))}
               
                             </div>
               
                             {/* READ MORE BUTTON */}
                             {updates.length > 2 && (
                               <div className="updates-read-more-wrap">
                                 <button
                                   className="read-more-btn"
                                   onClick={() => setShowAllUpdates((prev) => !prev)}
                                 >
                                   {showAllUpdates ? "Show less" : "Show more"}
                                 </button>
                               </div>
                             )}
                           </>
                         ) : (
                           <p className="updates-empty">
                             No updates posted by fundraiser yet.
                           </p>
                         )}
       
             </section>

        <section className="admin-donors-section">
          <DonorsList
            title="Recent Donors"
            donations={campaign.donations}
            fundraiserId={campaign.id}
            maxItems={5}
          />
        </section>

        {campaign && (
          <section className="admin-payout-section">
            <AdminPayoutList fundraiserId={campaign.id} />
          </section>
        )}


        {/* ================= REJECTED INFO ================= */}
        {campaign.status === "REJECTED" && (
          <section className="admin-story">
            <h3>Campaign Rejected</h3>
            <p>
              <strong>Reason:</strong> {campaign.rejectionReason}
            </p>
            {campaign.rejectedAt && (
              <p>
                <strong>Rejected on:</strong>{" "}
                {new Date(campaign.rejectedAt).toLocaleDateString()}
              </p>
            )}
          </section>
        )}

        {/* ================= ACTION BAR ================= */}
        {campaign.status !== "REJECTED" && (
          <div className="action-bar">
            <div className="action-bar-inner">
              {campaign.status === "PENDING_REVIEW" && (
                <>
                  <button
                    className="admin-action-btn approve-btn"
                    disabled={actionLoading}
                    onClick={() => setConfirmAction({
                      label: "Approve Campaign",
                      warning: "This will approve the campaign. The fundraiser will be notified and can proceed to activate it.",
                      onConfirm: handleApprove,
                    })}
                  >
                    Approve
                  </button>
                  <button
                    className="admin-action-btn reject-btn"
                    disabled={actionLoading}
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject
                  </button>
                </>
              )}

              {campaign.status === "APPROVED" && (
                <>
                  <button
                    className="admin-action-btn activate-btn"
                    disabled={actionLoading}
                    onClick={() => setConfirmAction({
                      label: "Activate Campaign",
                      warning: "This will make the campaign live and visible to all donors.",
                      onConfirm: handleActivate,
                    })}
                  >
                    Activate
                  </button>
                  <button
                    className="admin-action-btn suspend-btn"
                    disabled={actionLoading}
                    onClick={() => setShowSuspendModal(true)}
                  >
                    Suspend
                  </button>
                </>
              )}

              {campaign.status === "ACTIVE" && (
                <button
                  className="admin-action-btn suspend-btn"
                  disabled={actionLoading}
                  onClick={() => setShowSuspendModal(true)}
                >
                  Suspend
                </button>
              )}
              {campaign.status === "ACTIVE" &&
                Number(campaign.raisedAmount) >= Number(campaign.goalAmount) && (
                  <button
                    className="admin-action-btn complete-btn"
                    disabled={actionLoading}
                    onClick={() => setConfirmAction({
                      label: "Complete Campaign",
                      warning: "This will mark the campaign as complete. No further donations will be accepted.",
                      onConfirm: handleComplete,
                    })}
                  >
                    Complete Campaign
                  </button>
                )}

              {campaign.status === "SUSPENDED" && (
                <button
                  className="admin-action-btn revoke-btn"
                  disabled={actionLoading}
                  onClick={() => setConfirmAction({
                    label: "Revoke Campaign",
                    warning: "This will permanently revoke the campaign. This action cannot be undone.",
                    onConfirm: handleRevoke,
                  })}
                >
                  Revoke
                </button>
              )}

            </div>
          </div>
        )}

        {/* ================= CONFIRM MODAL (B-8-1) ================= */}
        {confirmAction && (
          <div className="rp-modal-backdrop">
            <div className="rp-modal">
              <h3>{confirmAction.label}</h3>
              <p className="confirm-warning">{confirmAction.warning}</p>
              <div className="rp-modal-actions">
                <button
                  className="admin-action-btn approve-btn"
                  disabled={actionLoading}
                  onClick={async () => {
                    await confirmAction.onConfirm();
                    setConfirmAction(null);
                  }}
                >
                  Confirm
                </button>
                <button
                  className="admin-action-btn"
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= SUSPEND MODAL ================= */}
        {showSuspendModal && (
          <div className="rp-modal-backdrop">
            <div className="rp-modal">
              <h3>Suspend Campaign</h3>

              <div className="reject-templates">
                {SUSPENSION_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`reject-template-chip${suspendReason === t ? " active" : ""}`}
                    onClick={() => setSuspendReason(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Enter suspension reason or select one above"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />

              <div className="rp-modal-actions">
                <button
                  className="admin-action-btn suspend-btn"
                  disabled={!suspendReason.trim() || actionLoading}
                  onClick={handleSuspend}
                >
                  Confirm Suspend
                </button>
                <button
                  className="admin-action-btn"
                  onClick={() => setShowSuspendModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= REJECT MODAL ================= */}
        {showRejectModal && (
          <div className="rp-modal-backdrop">
            <div className="rp-modal">
              <h3>Reject Campaign</h3>

              <div className="reject-templates">
                {REJECTION_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`reject-template-chip${rejectionReason === t ? " active" : ""}`}
                    onClick={() => setRejectionReason(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Enter rejection reason or select one above"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />

              <div className="rp-modal-actions">
                <button
                  className="admin-action-btn reject-btn"
                  disabled={!rejectionReason.trim() || actionLoading}
                  onClick={handleReject}
                >
                  Confirm Reject
                </button>

                <button
                  className="admin-action-btn"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= LIGHTBOX ================= */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={lightboxUrl}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw", maxHeight: "90vh",
              borderRadius: "8px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              cursor: "default",
            }}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: "absolute", top: 16, right: 20,
              background: "none", border: "none",
              color: "#fff", fontSize: 36, cursor: "pointer", lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
