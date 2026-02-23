"use client";

import React, { useEffect, useState } from "react";
import "./admin.css";
import AdminNavbar from "@/components/admin/AdminNavbar";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { AdminCampaignsService } from "@/services/admin-campaigns.service";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { RecipientAccountService } from "@/services/recipientAccount.service";
import { FundraiserDocumentsService } from "@/services/fundraiserDocuments.service";
import DonorsList from "@/components/donation/DonorsList";
import { CampaignStatus } from "@/services/admin-campaigns.service";
import AdminPayoutList from "@/components/admin/payouts/AdminPayoutList";

type VideoMedia = {
  embedUrl: string;
  originalUrl: string;
};

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

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const account = campaign?.recipientAccount;

  const [documents, setDocuments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);

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
      console.log("Admin campaign details", campaignData);

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

  /* ================= MEDIA NORMALIZATION ================= */
  useEffect(() => {
    if (!campaign?.media) return;

    const images: string[] = [];
    const videos: VideoMedia[] = [];

    campaign.media.forEach((item: any) => {
      if (Array.isArray(item.playerImages)) {
        images.push(...item.playerImages);
      }

      if (Array.isArray(item.youTubeUrl)) {
        item.youTubeUrl.forEach((originalUrl: string) => {
          const videoId = originalUrl.includes("youtu.be/")
            ? originalUrl.split("youtu.be/")[1]?.split("?")[0]
            : originalUrl.split("v=")[1]?.split("&")[0];

          if (videoId) {
            videos.push({
              embedUrl: `https://www.youtube.com/embed/${videoId}`,
              originalUrl,
            });
          }
        });
      }
    });

    setImageMedia(images);
    setVideoMedia(videos);
  }, [campaign?.media]);

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
    if (!id) return;
    setActionLoading(true);
    await AdminCampaignsService.suspendCampaign(id);
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
      <>
        <AdminNavbar />
        <div className="admin-campaign-page">
          <p style={{ padding: "24px" }}>Loading campaign…</p>
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <AdminNavbar />
        <div className="admin-campaign-page">
          <p style={{ padding: "24px", color: "red" }}>
            Campaign not found
          </p>
        </div>
      </>
    );
  }

  const raised = campaign.raisedAmount || 0;
  const goal = campaign.goalAmount || 0;
  const progress =
    goal === 0 ? 0 : Math.min(Math.round((raised / goal) * 100), 100);



  return (
    <>
      <AdminNavbar />

      <div className="admin-campaign-page">
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
            {/* Primary Row */}
            <div className="highlight-row">
              <div className="highlight-item">
                <span className="highlight-label">Sport</span>
                <span className="highlight-value">{campaign.sport}</span>
              </div>

              {campaign.level && (
                <div className="highlight-item">
                  <span className="highlight-label">Level</span>
                  <span className="highlight-value">{campaign.level}</span>
                </div>
              )}

              {campaign.discipline && (
                <div className="highlight-item">
                  <span className="highlight-label">Discipline</span>
                  <span className="highlight-value">{campaign.discipline}</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="highlight-row">
              <div className="highlight-item full">
                <span className="highlight-label">Location</span>
                <span className="highlight-value">
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
        <section className="admin-media">
          <h3>Media</h3>

          {imageMedia.length > 0 && (
            <div className="admin-media-grid">
              {imageMedia.map((img) => (
                <img key={img} src={img} alt="Campaign media" />
              ))}
            </div>
          )}

          {videoMedia.length > 0 && (
            <div className="admin-video">
              {videoMedia.map((video) => (
                <div className="admin-video-box" key={video.originalUrl}>
                  <iframe
                    src={`${video.embedUrl}?rel=0&modestbranding=1`}
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          )}

          {imageMedia.length === 0 && videoMedia.length === 0 && (
            <p style={{ color: "#9ca3af" }}>
              No media uploaded for this campaign.
            </p>
          )}
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
          <h3 className="updates-title">Campaign Updates</h3>

          {updates.length > 0 ? (
            <div className="updates-list">
              {updates.map((update) => (
                <div className="update-item" key={update.id}>
                  <div className="update-header">
                    <strong>{update.title}</strong>
                    <span className="update-date">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="update-content">
                    {update.content.split("\n").map((line, i) => (
                      <React.Fragment key={i}>
                        {line}


                      </React.Fragment>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#9ca3af" }}>
              No updates posted by fundraiser yet.
            </p>
          )}
        </section>

        <DonorsList
          title="Recent Donors"
          donations={campaign.donations}
          fundraiserId={campaign.id}
          maxItems={5}
        />

        {campaign && (
          <>
            {/* existing admin campaign UI */}

            <div style={{ marginTop: "40px" }}>
              <h2>Payout Management</h2>
              <AdminPayoutList fundraiserId={campaign.id} />
            </div>
          </>
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
                    onClick={handleApprove}
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
                    onClick={handleActivate}
                  >
                    Activate
                  </button>
                  <button
                    className="admin-action-btn suspend-btn"
                    disabled={actionLoading}
                    onClick={handleSuspend}
                  >
                    Suspend
                  </button>
                </>
              )}

              {campaign.status === "ACTIVE" && (
                <button
                  className="admin-action-btn suspend-btn"
                  disabled={actionLoading}
                  onClick={handleSuspend}
                >
                  Suspend
                </button>
              )}
              {campaign.status === "ACTIVE" &&
                Number(campaign.raisedAmount) >= Number(campaign.goalAmount) && (
                  <button
                    className="admin-action-btn complete-btn"
                    disabled={actionLoading}
                    onClick={handleComplete}
                  >
                    Complete Campaign
                  </button>
                )}


              {campaign.status === "SUSPENDED" && (

                <button
                  className="admin-action-btn revoke-btn"
                  disabled={actionLoading}
                  onClick={handleRevoke}
                >
                  Revoke
                </button>

              )}

            </div>
          </div>
        )}

        {/* ================= REJECT MODAL ================= */}
        {showRejectModal && (
          <div className="rp-modal-backdrop">
            <div className="rp-modal">
              <h3>Reject Campaign</h3>

              <textarea
                placeholder="Enter rejection reason"
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
    </>
  );
}
