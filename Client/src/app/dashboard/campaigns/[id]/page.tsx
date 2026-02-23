"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FundraiserService } from "@/services/fundraiser.service";
import "./campaign-details.css";
import { Trash2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { RecipientAccountService } from "@/services/recipientAccount.service";
import { FundraiserDocumentsService } from "@/services/fundraiserDocuments.service";
import DonorsList from "@/components/donation/DonorsList";
import CreateWithdrawalModal from "@/components/payouts/WithdrawForm";
import WithdrawalHistoryTable from "@/components/payouts/WithdrawalHistoryTable";
import { PayoutRequestsService } from "@/services/payoutRequests.service";

type VideoMedia = { embedUrl: string; originalUrl: string };

type CampaignUpdate = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type FundraiserDocument = {
  id: string;
  type: string; // ATHLETE_IDENTITY, etc
  fileUrl: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isPublic: boolean;
  verifiedAt?: string | null;
  createdAt?: string;
};

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);

  /** ✅ DELETE-ABLE STATES */
  const [imageMedia, setImageMedia] = useState<string[]>([]);
  const [videoMedia, setVideoMedia] = useState<VideoMedia[]>([]);

  const [currentImage, setCurrentImage] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);

  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [expandedStory, setExpandedStory] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

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


  const [recipientForm, setRecipientForm] = useState({
    recipientType: "PARENT_GUARDIAN",
    firstName: "",
    lastName: "",
    accountNumber: "",
    bankName: "",
    ifscCode: "",
    country: "India",
  });

  const [savingRecipient, setSavingRecipient] = useState(false);

  const [documents, setDocuments] = useState<FundraiserDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [docType, setDocType] = useState("ATHLETE_IDENTITY");
  const [docTitle, setDocTitle] = useState("");
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(null);

  const isRejected = campaign?.status === "REJECTED";

  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [availableAmount, setAvailableAmount] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);


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
      setDocuments([]); // 🔐 safety fallback
    }

  };

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  //campaign payment
  const fetchPayouts = async () => {
    const res = await PayoutRequestsService.list(id as string);
    setPayoutRequests(res.data.data);
  };

  useEffect(() => {
    if (!campaign) return;

    const reserved = payoutRequests
      .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
      .reduce((s, r) => s + Number(r.amount), 0);

    const paid = payoutRequests
      .filter((r) => r.status === "PAID")
      .reduce((s, r) => s + Number(r.amount), 0);

    const raised = Number(campaign.raisedAmount || 0);

    setAvailableAmount(raised - reserved - paid);
  }, [campaign, payoutRequests]);



  /* ================= FETCH CAMPAIGN ================= */
  const fetchCampaign = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const res = await FundraiserService.getCampaignById(id);
      console.log(res);
      setCampaign(res.data.data);
    } catch (err) {
      console.error("Failed to fetch campaign", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      await fetchCampaign();
      await fetchPayouts();
    };

    load();
  }, [id]);


  /* ================= MEDIA NORMALIZATION (ONCE) ================= */
  useEffect(() => {
    if (!campaign?.media) return;

    const images: string[] = [];
    const videos: VideoMedia[] = [];

    campaign.media.forEach((item: any) => {
      // images
      if (Array.isArray(item.playerImages)) {
        images.push(...item.playerImages);
      }

      // youtube
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

  useEffect(() => {
    if (!campaign) return;

    const raw = campaign?.fundraiserupdates;

    const normalized: CampaignUpdate[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? [raw]
        : [];

    setUpdates(
      normalized
        .filter(
          (u: any): u is CampaignUpdate =>
            u &&
            typeof u.title === "string" &&
            typeof u.content === "string"
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    );
  }, [campaign]);


  useEffect(() => {
    if (!campaign?.recipientAccount) return;

    const acc = campaign.recipientAccount;

    setRecipientForm({
      recipientType: acc.recipientType,
      firstName: acc.firstName,
      lastName: acc.lastName,
      accountNumber: "",
      bankName: acc.bankName,
      ifscCode: acc.ifscCode,
      country: acc.country,
    });
  }, [campaign?.recipientAccount]);


  if (loading) {
    return <div className="dashboard-center">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="dashboard-center">Campaign not found</div>;
  }


  /* ================= PROGRESS ================= */
  const raised = Math.max(0, Number(campaign?.raisedAmount) || 0);
  const goal = Math.max(0, Number(campaign?.goalAmount) || 0);

  const progress =
    goal === 0 ? 0 : Math.min(Math.round((raised / goal) * 100), 100);

  /* ================= COVER UPLOAD ================= */
  const handleCoverUpload = async (file: File) => {
    if (!id) return;

    try {
      setUploadingCover(true);
      const res = await FundraiserService.uploadCoverImage(id, file);

      setCampaign((prev: any) => ({
        ...prev,
        coverImageURL: res?.data?.coverImageURL || prev.coverImageURL,
      }));
    } catch (err) {
      console.error("Cover upload failed", err);
    } finally {
      setUploadingCover(false);
    }
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = async (files: FileList) => {
    if (!id) return;

    try {
      setUploadingMedia(true);
      await FundraiserService.uploadPlayerMedia(id, Array.from(files));
      await fetchCampaign(); // ✅ ok to refetch after upload
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      setUploadingMedia(false);
    }
  };

  /* ================= ADD YOUTUBE ================= */
  const handleYoutubeAdd = async () => {
    if (!youtubeUrl.trim() || !id) return;

    try {
      await FundraiserService.addYoutubeMedia(id, [youtubeUrl]);

      // ✅ update UI without refetch
      const originalUrl = youtubeUrl;
      const videoId = originalUrl.includes("youtu.be/")
        ? originalUrl.split("youtu.be/")[1]?.split("?")[0]
        : originalUrl.split("v=")[1]?.split("&")[0];

      if (videoId) {
        setVideoMedia((prev) => [
          ...prev,
          {
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            originalUrl,
          },
        ]);
      }

      setYoutubeUrl("");
      setShowYoutubeInput(false);
    } catch (err) {
      console.error("Add YouTube failed", err);
    }
  };
  //update
  const handleAddUpdate = async () => {
    if (!updateTitle.trim() || !updateContent.trim() || !id) return;

    try {
      setAddingUpdate(true);

      const res = await FundraiserService.addCampaignUpdate(id, {
        title: updateTitle,
        content: updateContent,
      });

      const responseData = res.data?.data;

      let newUpdate: CampaignUpdate | null = null;

      if (responseData?.updates) {
        if (Array.isArray(responseData.updates)) {
          newUpdate = responseData.updates[0];
        } else {
          newUpdate = responseData.updates;
        }
      }

      // ✅ Instant UI update
      if (newUpdate && typeof newUpdate.title === "string") {
        setUpdates((prev) => [newUpdate, ...prev]);
      }
      setCampaign((prev: any) => ({
        ...prev,
        updates: Array.isArray(prev?.updates)
          ? [newUpdate, ...prev.updates]
          : newUpdate,
      }));

      setUpdateTitle("");
      setUpdateContent("");
    } catch (err) {
      console.error("Failed to add update", err);
    } finally {
      setAddingUpdate(false);
    }
  };


  /* ================= DELETE IMAGE ================= */
  const handleImageDelete = async (url: string) => {
    const scrollY = window.scrollY;

    try {
      await FundraiserService.deletePlayerMedia(id as string, url);

      // ✅ remove image from state (NO refetch)
      setImageMedia((prev) => prev.filter((img) => img !== url));
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  /* ================= DELETE YOUTUBE ================= */
  const handleYoutubeDelete = async (originalUrl: string) => {
    try {
      await FundraiserService.deleteYoutubeMedia(id as string, originalUrl);

      // ✅ remove from state (NO refetch)
      setVideoMedia((prev) =>
        prev.filter((v) => v.originalUrl !== originalUrl)
      );
    } catch (err) {
      console.error("Delete YouTube failed", err);
    }
  };

  const handleSaveRecipientAccount = async () => {
    if (!id) return;

    try {
      setSavingRecipient(true);

      const res = await RecipientAccountService.upsert(
        id,
        recipientForm
      );
      console.log(res);

      // ✅ update embedded object (NO refetch)
      setCampaign((prev: any) => ({
        ...prev,
        recipientAccount: res.data.data,
      }));
    } catch (err) {
      console.error("Failed to save recipient account", err);
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleAddDocument = async (file: File) => {
    if (!id || !file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("PDF must be less than 5MB");
      return;
    }

    try {
      setUploadingDoc(true);

      const formData = new FormData();
      formData.append("document", file);
      formData.append("type", docType); // enum string

      if (docTitle?.trim()) {
        formData.append("title", docTitle);
      }

      await FundraiserDocumentsService.addDocument(id, formData);
      await fetchDocuments();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingDoc(false);
    }
  };



  const handleDeleteDocument = async (documentId: string) => {
    try {
      await FundraiserDocumentsService.deleteDocument(documentId);
      setDocuments((prev) =>
        prev.filter((doc) => doc.id !== documentId)
      );
    } catch (err) {
      console.error("Delete failed", err);
    }
  };



  return (

    <div className="campaign-page">

      {/* ================= TOP BAR ================= */}
      <header className="campaign-topbar">
        <button
          className="back-btn"
          onClick={() => router.push("/dashboard")}
        >
          ← My Fundraisers
        </button>

        <span className="manage-text">Manage</span>
        <StatusBadge status={campaign.status} />
      </header>
      <section className="campaign-header">
        <h1>{campaign.title}</h1>
        <p className="subtitle">{campaign.shortDescription}</p>
      </section>

     {/* ================= RESPONSIVE CAMPAIGN LAYOUT ================= */}
<div className="campaign-main-grid">

  {/* LEFT COLUMN */}
  <div className="campaign-left-column">

    {/* COVER */}
    <section className="cover-section">
      <div className="cover-box">
        <img
          src={campaign.coverImageURL || "/background.png"}
          alt="Campaign cover"
          className="cover-image"
        />

        <div className="cover-overlay">
          {!isRejected && (
            <label className="cover-btn">
              {uploadingCover ? "Uploading..." : "Add / Edit Cover Image"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  e.target.files &&
                  handleCoverUpload(e.target.files[0])
                }
              />
            </label>
          )}
        </div>
      </div>
    </section>

    {/* HIGHLIGHTS */}
    <section className="highlights-card">

      {/* Sport Row */}
      <div className="highlight-row top">
        <div className="highlight-item">
          <span className="highlight-label">Sport</span>
          <span className="highlight-value">{campaign.sport}</span>
        </div>

        <div className="highlight-item">
          <span className="highlight-label">Level</span>
          <span className="highlight-value">{campaign.level}</span>
        </div>

        <div className="highlight-item">
          <span className="highlight-label">Location</span>
          <span className="highlight-value">
            {campaign.city}, {campaign.state}
          </span>
        </div>

        <div className="highlight-item">
          <span className="highlight-label">Discipline</span>
          <span className="highlight-value">
            {campaign.discipline || "—"}
          </span>
        </div>
      </div>

      {/* Skills */}
      {Array.isArray(campaign.skills) &&
        campaign.skills.length > 0 && (
          <>
            <div className="highlight-item full">
              <span className="highlight-label">Skills</span>
              <div className="skill-chip-row">
                {campaign.skills.map((skill: string, idx: number) => (
                  <span className="skill-chip" key={idx}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

      {/* Beneficiary */}
      <div className="highlight-divider" />

      <div className="highlight-beneficiary-row">
        <span className="highlight-label">Beneficiary</span>

        {campaign.campaignFor === "SELF" &&
          campaign.beneficiaryUser && (
            <div className="beneficiary-inline">
              <div className="beneficiary-avatar">
                {campaign.beneficiaryUser.firstName?.[0]}
              </div>

              <div className="beneficiary-info">
                <strong>
                  {campaign.beneficiaryUser.firstName}{" "}
                  {campaign.beneficiaryUser.lastName}
                </strong>

                <span className="beneficiary-meta">
                  Organizer • Self
                </span>
              </div>
            </div>
          )}

        {campaign.campaignFor === "OTHER" &&
          campaign.beneficiaryOther && (
            <div className="beneficiary-inline">
              <div className="beneficiary-avatar">
                {campaign.beneficiaryOther.fullName?.[0]}
              </div>

              <div className="beneficiary-info">
                <strong>
                  {campaign.beneficiaryOther.fullName}
                </strong>

                <span className="beneficiary-meta">
                  {campaign.beneficiaryOther.relationshipToCreator}
                </span>
              </div>
            </div>
          )}
      </div>
    </section>

    {/* STORY */}
    <section className="story-section">
      {campaign.story ? (
        <>
          <p
            className={`story-text ${
              expandedStory ? "expanded" : "collapsed"
            }`}
          >
            {campaign.story}
          </p>

          <button
            className="read-more-story-btn"
            onClick={() => setExpandedStory((prev) => !prev)}
          >
            {expandedStory ? "Read less" : "Read more"}
          </button>
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
          <div className="total-raised">
            ₹{raised.toLocaleString()}
          </div>
          <div className="goal-text">
            of ₹{goal.toLocaleString()}
          </div>
        </div>
        <div className="progress-percent">{progress}%</div>
      </div>

      <div className="progress-bar">
        <div style={{ width: `${progress}%` }} />
      </div>
    </section>

    {/* DONORS */}
    {campaign.donations && campaign.donations.length > 0 && (
  <DonorsList
    donations={campaign.donations}
    fundraiserId={campaign.id}
    maxItems={5}
  />
)}


  </div>
</div>


      {/* =====================================================
        IMAGES | VIDEOS
          ===================================================== */}
      <section className="media-row full-width">

        {/* ================= IMAGES ================= */}
        <div className="media-box">
          <div className="media-box-header">
            <h3>Images</h3>

            {!isRejected && (
              <label className="media-add-btn">
                + Upload Image
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) =>
                    e.target.files && handleImageUpload(e.target.files)
                  }
                />
              </label>
            )}

          </div>


          {imageMedia.length === 0 ? (
            <div className="media-empty">
              No images right now
            </div>
          ) : (
            <>
              <div className="gallery-image-container">
                <div
                  className="gallery-track"
                  style={{
                    transform: `translateX(-${currentImage * 100}%)`,
                  }}
                >
                  {imageMedia.map((url, i) => (
                    <div className="image-slide" key={i}>
                      <img src={url} className="gallery-image" />

                      {!isRejected && (
                        <button
                          className="image-delete-btn"
                          onClick={() => handleImageDelete(url)}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
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

        {/* ================= VIDEOS ================= */}
        <div className="media-box">
          <div className="media-box-header">
            <h3>Videos</h3>
           {!isRejected && !showYoutubeInput && (
  <button
    className="media-add-btn"
    onClick={() => setShowYoutubeInput(true)}
  >
    + Add Video Link
  </button>
)}

{!isRejected && showYoutubeInput && (
  <div className="youtube-row">
    <input
      value={youtubeUrl}
      onChange={(e) => setYoutubeUrl(e.target.value)}
      placeholder="Paste YouTube link"
    />
    <button onClick={handleYoutubeAdd}>Add</button>
  </div>
)}

          </div>

          {videoMedia.length === 0 ? (
            <div className="media-empty">
              No videos right now
            </div>
          ) : (
            <>
              <div className="gallery-image-container">
                <div
                  className="gallery-track"
                  style={{
                    transform: `translateX(-${currentVideo * 100}%)`,
                  }}
                >
                  {videoMedia.map((v, i) => (
                    <div className="video-box" key={i}>
                      <iframe
                        src={`${v.embedUrl}?rel=0`}
                        allowFullScreen
                      />

                      {!isRejected && (
                        <button
                          className="video-delete-btn"
                          onClick={() => handleYoutubeDelete(v.originalUrl)}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
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
      </section >
      {/* ================= FULL WIDTH ================= */}

      {/* ================= DOCUMENTS ================= */}
      <section className="documents-section">
        <h3 className="documents-title">Documents</h3>

        {/* UPLOAD CARD */}
        {!isRejected && (
          <div className="documents-upload-card">
            <select
              className="documents-input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="ATHLETE_IDENTITY">Athlete Identity</option>
              <option value=" ACADEMY_CONFIRMATION">Academy Conformation</option>
              <option value="COACH_CONFIRMATION">Coach Confirmation</option>
              <option value="EQUIPMENT_QUOTE">Equipment Quote</option>
              <option value="TOURNAMENT_INVITE">Tournament Invite</option>
              <option value="TRAINING_RECEIPT">Training Receipt</option>
              <option value="SPORTS_FEDERATION_PROOF">Sports Federation Proof</option>
              <option value="OTHER">Other</option>
            </select>

            <input
              className="documents-input"
              type="text"
              placeholder="Document title (optional)"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
            />
            <label className="documents-upload-btn">
              {uploadingDoc ? "Uploading..." : "Upload PDF"}
              <input
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) =>
                  e.target.files && handleAddDocument(e.target.files[0])
                }
              />
            </label>
          </div>
        )}
        {/* LIST */}
        <div className="documents-list">
          {documents.length === 0 && (
            <p className="documents-empty">No documents uploaded yet.</p>
          )}

          {documents.map((doc) => (
            <div key={doc.id} className="pdf-card">
              {/* PREVIEW */}
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pdf-preview-clickable"
              >
                <div className="pdf-preview-box">
                  <iframe
                    src={`${doc.fileUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                    title="PDF preview"
                    className="pdf-iframe"
                  />
                </div>
              </a>

              {/* META + ACTIONS */}
              <div className="pdf-meta">
                <span
                  className={`pdf-status ${doc.verificationStatus.toLowerCase()}`}
                >
                  {doc.verificationStatus === "PENDING" && "⚠️ Pending"}
                  {doc.verificationStatus === "VERIFIED" && "✅ Verified"}
                  {doc.verificationStatus === "REJECTED" && "❌ Rejected"}
                </span>

                {doc.verificationStatus !== "VERIFIED" && (
                  <button
                    className="pdf-delete-btn"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    {/* Delete */}
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CAMPAIGN UPDATES ================= */}
      <section className="campaign-updates-section">
        <h4 className="updates-title">Campaign Updates</h4>

        <div className="updates-card">
          {/* Add Update Form */}
          {!isRejected && (
            <div className="update-form">
              <input
                type="text"
                placeholder="Update title"
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
              />

              <textarea
                placeholder="Write an update for supporters..."
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
              />

              <button
                className="add-update-btn"
                onClick={handleAddUpdate}
                disabled={addingUpdate}
              >
                {addingUpdate ? "Posting..." : "+ Post Update"}
              </button>
            </div>
          )}

          {/* Updates List */}
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

                    <p className="update-content">
                      {update.content.split("\n").map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          <br />
                        </React.Fragment>
                      ))}
                    </p>

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

        </div>

      </section>


      {/* ================= RECIPIENT BANK ACCOUNT ================= */}
      <section className="recipient-wrapper">
        <section className="recipient-card">
          <h4 className="recipient-title">Recipient Bank Account</h4>

          {/* ROW 1 */}
          <div className="recipient-row">
            <select
              className="recipient-input"
              value={recipientForm.recipientType}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  recipientType: e.target.value,
                })
              }
            >
              <option value="PARENT_GUARDIAN">Parent / Guardian</option>
              <option value="SELF">Self</option>
              <option value="COACH">Coach</option>
            </select>

            <input
              className="recipient-input"
              placeholder="First Name"
              value={recipientForm.firstName}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  firstName: e.target.value,
                })
              }
            />

            <input
              className="recipient-input"
              placeholder="Last Name"
              value={recipientForm.lastName}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  lastName: e.target.value,
                })
              }
            />
          </div>

          {/* ROW 2 */}
          <div className="recipient-row">
            <input
              className="recipient-input"
              placeholder={
                campaign.recipientAccount
                  ? "******" + campaign.recipientAccount.accountNumber.slice(-4)
                  : "Account Number"
              }
              value={recipientForm.accountNumber}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  accountNumber: e.target.value,
                })
              }
            />

            <input
              className="recipient-input"
              placeholder="Bank Name"
              value={recipientForm.bankName}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  bankName: e.target.value,
                })
              }
            />
          </div>

          {/* ROW 3 */}
          <div className="recipient-row">
            <input
              className="recipient-input"
              placeholder="IFSC Code"
              value={recipientForm.ifscCode}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  ifscCode: e.target.value,
                })
              }
            />

            <input
              className="recipient-input"
              placeholder="Country"
              value={recipientForm.country}
              onChange={(e) =>
                setRecipientForm({
                  ...recipientForm,
                  country: e.target.value,
                })
              }
            />
            {!isRejected && (
              <button
                className="recipient-save-btn"
                onClick={handleSaveRecipientAccount}
                disabled={savingRecipient}
              >
                {savingRecipient ? "Saving..." : "Save / Update Account"}
              </button>
            )}
          </div>

          {campaign.recipientAccount && (
            <p
              className={`recipient-status ${campaign.recipientAccount.isVerified ? "verified" : "pending"
                }`}
            >
              {campaign.recipientAccount.isVerified
                ? "✅ Verified by admin"
                : "⚠️ Pending admin verification"}
            </p>
          )}
        </section>
      </section>
      

      <CreateWithdrawalModal
        fundraiserId={id}
        available={availableAmount}
        onSuccess={fetchCampaign}
      />

      <WithdrawalHistoryTable fundraiserId={id} />


      {/* REJECTION */}
      {
        campaign.status === "REJECTED" &&
        campaign.rejectionReason && (
          <section className="rejection-banner">
            <div className="rejection-icon">❌</div>

            <div className="rejection-content">
              <h4>Campaign Rejected</h4>
              <p className="rejection-reason">
                {campaign.rejectionReason}
              </p>
            </div>
          </section>
        )
      }

      {/* ================= FEEDBACK BUTTON ================= */}
      {campaign.status === "COMPLETED" && (
        <button
          className="feedback-floating-btn"
          onClick={() =>
            router.push(`/feedback`)
          }
        >
          ✍️ Give Feedback
        </button>
      )}

    </div >
  );

}
