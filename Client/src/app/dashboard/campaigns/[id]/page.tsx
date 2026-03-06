"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { z } from "zod";
import AlertModal from "@/components/ui/AlertModal";
import InstagramEmbed from "@/components/instagram/instagram"

const recipientSchema = z.object({
  recipientType: z.string().min(1, "Select recipient type"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  accountNumber: z
    .string()
    .regex(/^\d+$/, "Account number must contain digits only")
    .min(9, "Account number must be between 9 and 18 digits")
    .max(18, "Account number must be between 9 and 18 digits"),
  bankName: z.string().min(1, "Bank name is required"),
  ifscCode: z.string().min(1, "IFSC code is required"),
  country: z.string().min(1, "Country is required"),
});

type VideoMedia = { embedUrl: string; originalUrl: string };

const isInstagramUrl = (url: string) => url.includes("instagram.com");

/** Extracts YouTube video ID from all common URL formats:
 *  watch?v=, youtu.be/, /shorts/, /live/, /embed/
 */
function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0] || null;
    // /shorts/VIDEO_ID or /live/VIDEO_ID or /embed/VIDEO_ID
    const pathMatch = u.pathname.match(/\/(?:shorts|live|embed)\/([^/?&]+)/);
    if (pathMatch) return pathMatch[1];
    // watch?v=VIDEO_ID
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

type FundraiserDocument = {
  id: string;
  type: string;
  fileUrl: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isPublic: boolean;
  verifiedAt?: string | null;
  createdAt?: string;
};

/** Appends a cache-busting param to a URL without breaking existing query strings. */
function addCacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Separate cover URL state so we can bust the browser cache on re-upload
  const [coverUrl, setCoverUrl] = useState<string>("");

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [showInstagramInput, setShowInstagramInput] = useState(false);

  const [imageMedia, setImageMedia] = useState<string[]>([]);
  const [videoMedia, setVideoMedia] = useState<VideoMedia[]>([]);
  const [instagramMedia, setInstagramMedia] = useState<string[]>([]);

  const [currentImage, setCurrentImage] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [currentInstagram, setCurrentInstagram] = useState(0);

  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [expandedStory, setExpandedStory] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const storyRef = useRef<HTMLParagraphElement | null>(null);

  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
  const updateRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const [overflowingUpdates, setOverflowingUpdates] = useState<Record<string, boolean>>({});

  const nextImage = () =>
    setCurrentImage((prev) => (prev === imageMedia.length - 1 ? 0 : prev + 1));
  const prevImage = () =>
    setCurrentImage((prev) => (prev === 0 ? imageMedia.length - 1 : prev - 1));
  const nextVideo = () =>
    setCurrentVideo((prev) => (prev === videoMedia.length - 1 ? 0 : prev + 1));
  const prevVideo = () =>
    setCurrentVideo((prev) => (prev === 0 ? videoMedia.length - 1 : prev - 1));
  const nextInstagram = () =>
    setCurrentInstagram((prev) => (prev === instagramMedia.length - 1 ? 0 : prev + 1));
  const prevInstagram = () =>
    setCurrentInstagram((prev) => (prev === 0 ? instagramMedia.length - 1 : prev - 1));

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
  const [accFocused, setAccFocused] = useState(false);
  const [recipientErrors, setRecipientErrors] = useState<Record<string, string>>({});

  const [documents, setDocuments] = useState<FundraiserDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState("ATHLETE_IDENTITY");
  const [docTitle, setDocTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const isRejected = campaign?.status === "REJECTED";

  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [payoutRefreshKey, setPayoutRefreshKey] = useState(0);
  const [availableAmount, setAvailableAmount] = useState(0);

  /* ================= FETCH HELPERS ================= */

  const fetchDocuments = async () => {
    if (!id) return;
    try {
      const res = await FundraiserDocumentsService.getDocuments(id);
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setDocuments([]);
    }
  };

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

  /**
   * Refresh only the media state (images + videos) without triggering
   * the full-page loading spinner. Used after image uploads.
   */
  const refreshMedia = async () => {
    if (!id) return;
    try {
      const res = await FundraiserService.getCampaignById(id);
      const data = res.data.data;

      const images: string[] = [];
      const videos: VideoMedia[] = [];
      const instagrams: string[] = [];

      data.media?.forEach((item: any) => {
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
      setCurrentImage(0);
      setCurrentVideo(0);
      setCurrentInstagram(0);
    } catch (err) {
      console.error("Failed to refresh media", err);
    }
  };

  const fetchCampaign = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await FundraiserService.getCampaignById(id);
      const data = res.data.data;
      setCampaign(data);
      // Keep coverUrl in sync; don't overwrite if we already cache-busted it
      if (data.coverImageURL) {
        setCoverUrl((prev) => prev || data.coverImageURL);
      }
    } catch (err) {
      console.error("Failed to fetch campaign", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      await fetchCampaign();
      await fetchPayouts();
    };
    load();
  }, [id]);

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  /* ================= AVAILABLE AMOUNT ================= */

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
            const videoId = originalUrl.includes("youtu.be/")
              ? originalUrl.split("youtu.be/")[1]?.split("?")[0]
              : originalUrl.split("v=")[1]?.split("&")[0];
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

  /* ================= STORY READ-MORE ================= */

  useEffect(() => {
    const el = storyRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      setShowReadMore(el.scrollHeight > el.clientHeight);
    });
  }, [campaign?.story]);

  /* ================= UPDATES NORMALIZATION ================= */

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
            u && typeof u.title === "string" && typeof u.content === "string"
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    );
  }, [campaign]);

  /* ================= UPDATE OVERFLOW DETECTION ================= */

  useEffect(() => {
    const newState: Record<string, boolean> = {};
    updates.forEach((update) => {
      const el = updateRefs.current[update.id];
      if (el) newState[update.id] = el.scrollHeight > el.clientHeight;
    });
    setOverflowingUpdates(newState);
  }, [updates]);

  /* ================= RECIPIENT FORM PREFILL ================= */

  useEffect(() => {
    if (!campaign?.recipientAccount) return;
    const acc = campaign.recipientAccount;
    setRecipientForm({
      recipientType: acc.recipientType,
      firstName: acc.firstName,
      lastName: acc.lastName,
      accountNumber: acc.accountNumber || "",
      bankName: acc.bankName,
      ifscCode: acc.ifscCode,
      country: acc.country,
    });
  }, [campaign?.recipientAccount]);

  /* ================= LOADING / ERROR ================= */

  if (loading) {
    return <div className="dashboard-center">Loading campaign…</div>;
  }

  if (!campaign) {
    return <div className="dashboard-center">Campaign not found.</div>;
  }

  /* ================= DERIVED VALUES ================= */

  const raised = Math.max(0, Number(campaign?.raisedAmount) || 0);
  const goal = Math.max(0, Number(campaign?.goalAmount) || 0);
  const progress = goal === 0 ? 0 : Math.min(Math.round((raised / goal) * 100), 100);

  /* ================= COVER UPLOAD ================= */

  const handleCoverUpload = async (file: File) => {
    if (!id) return;
    try {
      setUploadingCover(true);
      const res = await FundraiserService.uploadCoverImage(id, file);
      const newUrl = res?.data?.fundraiser?.coverImageURL;
      if (newUrl) {
        // Cache-bust so the browser re-fetches the new image immediately
        setCoverUrl(addCacheBust(newUrl));
        setCampaign((prev: any) => ({ ...prev, coverImageURL: newUrl }));
      }
    } catch (err) {
      console.error("Cover upload failed", err);
    } finally {
      setUploadingCover(false);
    }
  };

  /* ================= IMAGE UPLOAD ================= */

  const handleImageUpload = async (files: FileList) => {
    if (!id || uploadingMedia) return;
    try {
      setUploadingMedia(true);
      await FundraiserService.uploadPlayerMedia(id, Array.from(files));
      // Refresh only media state — no loading spinner, no full page reload
      await refreshMedia();
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
      const originalUrl = youtubeUrl;
      const videoId = getYouTubeVideoId(originalUrl);
      if (videoId) {
        setVideoMedia((prev) => [
          ...prev,
          { embedUrl: `https://www.youtube.com/embed/${videoId}`, originalUrl },
        ]);
      }
      setYoutubeUrl("");
      setShowYoutubeInput(false);
    } catch (err) {
      console.error("Add YouTube failed", err);
    }
  };

  /* ================= ADD UPDATE ================= */

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
        newUpdate = Array.isArray(responseData.updates)
          ? responseData.updates[0]
          : responseData.updates;
      }
      if (newUpdate && typeof newUpdate.title === "string") {
        setUpdates((prev) => [newUpdate!, ...prev]);
      }
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
    try {
      await FundraiserService.deletePlayerMedia(id as string, url);
      await refreshMedia();
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  /* ================= DELETE YOUTUBE ================= */

  const handleYoutubeDelete = async (video: VideoMedia) => {
    try {
      const videoId = video.embedUrl.split("/embed/")[1]?.split("?")[0];
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      await FundraiserService.deleteYoutubeMedia(id as string, watchUrl);
      await refreshMedia();
    } catch (err: any) {
      console.error("Delete YouTube failed", err?.response?.data || err);
    }
  };

  /* ================= ADD INSTAGRAM ================= */

  const handleInstagramAdd = async () => {
    if (!instagramUrl.trim() || !id) return;
    try {
      await FundraiserService.addInstagramMedia(id, [instagramUrl]);
      await refreshMedia();
      setInstagramUrl("");
      setShowInstagramInput(false);
    } catch (err: any) {
      console.error("Add Instagram failed", err?.response?.data || err);
    }
  };

  /* ================= DELETE INSTAGRAM ================= */

  const handleInstagramDelete = async (url: string) => {
    try {
      await FundraiserService.deleteInstagramMedia(id as string, url);
      await refreshMedia();
    } catch (err: any) {
      console.error("Delete Instagram failed", err?.response?.data || err);
    }
  };

  /* ================= RECIPIENT ACCOUNT ================= */

  const handleSaveRecipientAccount = async () => {
    if (!id) return;

    const result = recipientSchema.safeParse(recipientForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setRecipientErrors(fieldErrors);
      return;
    }
    setRecipientErrors({});

    try {
      setSavingRecipient(true);
      const res = await RecipientAccountService.upsert(id, recipientForm);
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

  /* ================= DOCUMENTS ================= */

  const handleAddDocument = async (file: File) => {
    if (!id || !file) return;
    if (file.type !== "application/pdf") {
      setAlertMsg("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAlertMsg("PDF must be less than 5MB");
      return;
    }
    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append("document", file);
      formData.append("type", docType);
      if (docTitle?.trim()) formData.append("title", docTitle);
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
      window.location.reload();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="campaign-page">

      {/* TOP BAR */}
      <header className="campaign-topbar">
        <button className="back-btn" onClick={() => router.push("/dashboard")}>
          ← My Fundraisers
        </button>
        <span className="manage-text">Manage</span>
        <StatusBadge status={campaign.status} />
      </header>

      {/* REJECTION BANNER — shown near the top so users see it immediately */}
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

      {/* ================= TWO-COLUMN GRID ================= */}
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
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        e.target.files && handleCoverUpload(e.target.files[0])
                      }
                    />
                  </label>
                )}
              </div>
            </div>
          </section>

          {/* HIGHLIGHTS */}
          <section className="highlights-card">
            <div className="highlight-row top">
              <div className="highlight-item">
                <span className="highlight-label">Sport</span>
                <span className="highlight-value">{campaign.sport}</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-label">Level</span>
                <span className="highlight-value">{campaign.level || "—"}</span>
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

            {Array.isArray(campaign.skills) && campaign.skills.length > 0 && (
              <div className="highlight-item full">
                <span className="highlight-label">Skills</span>
                <div className="skill-chip-row">
                  {campaign.skills.map((skill: string, idx: number) => (
                    <span className="skill-chip" key={idx}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

          </section>

          {/* BENEFICIARY */}
          <section className="beneficiary-section">
            <span className="highlight-label">Beneficiary</span>

            {campaign.campaignFor === "SELF" && campaign.beneficiaryUser && (
              <div className="beneficiary-inline">
                <div className="beneficiary-avatar">
                  {campaign.beneficiaryUser.firstName?.[0]}
                </div>
                <div className="beneficiary-info">
                  <strong>
                    {campaign.beneficiaryUser.firstName}{" "}
                    {campaign.beneficiaryUser.lastName}
                  </strong>
                  <span className="beneficiary-meta">Organizer • Self</span>
                </div>
              </div>
            )}

            {campaign.campaignFor === "OTHER" && campaign.beneficiaryOther && (
              <div className="beneficiary-inline">
                <div className="beneficiary-avatar">
                  {campaign.beneficiaryOther.fullName?.[0]}
                </div>
                <div className="beneficiary-info">
                  <strong>{campaign.beneficiaryOther.fullName}</strong>
                  <span className="beneficiary-meta">
                    {campaign.beneficiaryOther.relationshipToCreator}
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* STORY */}
          <section className="story-section">
            <h3>My Journey</h3>
            {campaign.story ? (
              <>
                <p
                  ref={storyRef}
                  className={`story-text ${expandedStory ? "expanded" : "collapsed"}`}
                >
                  {campaign.story}
                </p>
                {showReadMore && (
                  <button
                    className="read-more-story-btn"
                    onClick={() => setExpandedStory((prev) => !prev)}
                  >
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
            <DonorsList
              donations={campaign.donations}
              fundraiserId={campaign.id}
              maxItems={5}
            />
          )}

        </div>
      </div>


      {/* ================= INSTAGRAM | IMAGES + YOUTUBE ================= */}
      <section className="media-row full-width">

        {/* LEFT: INSTAGRAM */}
        <div className="media-box">
          <div className="media-box-header">
            <h3>Instagram</h3>
            {!isRejected && !showInstagramInput && (
              <button className="media-add-btn" onClick={() => setShowInstagramInput(true)}>
                + Add Instagram
              </button>
            )}
            {!isRejected && showInstagramInput && (
              <div className="youtube-row">
                <input
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="Paste Instagram reel/post link"
                />
                <button onClick={handleInstagramAdd}>Add</button>
              </div>
            )}
          </div>

          {instagramMedia.length === 0 ? (
            <div className="media-empty">No Instagram posts added</div>
          ) : (
            <div className="instagram-viewer">
              <div className="instagram-slide-wrap">
                <InstagramEmbed key={instagramMedia[currentInstagram]} url={instagramMedia[currentInstagram]} />
                {!isRejected && (
                  <button
                    className="video-delete-btn instagram-del-btn"
                    aria-label="Delete Instagram post"
                    onClick={() => handleInstagramDelete(instagramMedia[currentInstagram])}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              {instagramMedia.length > 1 && (
                <div className="instagram-nav-row">
                  <button className="insta-nav-btn" onClick={prevInstagram}>‹</button>
                  <span className="insta-nav-count">{currentInstagram + 1} / {instagramMedia.length}</span>
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
            <div className="media-box-header">
              <h3>Images</h3>
              {!isRejected && (
                <label className="media-add-btn">
                  {uploadingMedia ? "Uploading…" : "+ Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploadingMedia}
                    onChange={(e) => {
                      if (e.target.files && !uploadingMedia) {
                        handleImageUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              )}
            </div>

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
                      <div className="image-slide" key={i}>
                        <img
                          src={url}
                          alt={`Campaign photo ${i + 1}`}
                          className="gallery-image"
                          loading="lazy"
                        />
                        {!isRejected && (
                          <button
                            className="image-delete-btn"
                            aria-label="Delete image"
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
                      <button className="gallery-nav left" aria-label="Previous image" onClick={prevImage}>‹</button>
                      <button className="gallery-nav right" aria-label="Next image" onClick={nextImage}>›</button>
                    </>
                  )}
                </div>
                {imageMedia.length > 1 && (
                  <div className="gallery-dots">
                    {imageMedia.map((_, i) => (
                      <span key={i} className={`dot ${i === currentImage ? "active" : ""}`} onClick={() => setCurrentImage(i)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* YOUTUBE */}
          <div className="media-box">
            <div className="media-box-header">
              <h3>YouTube Videos</h3>
              {!isRejected && !showYoutubeInput && (
                <button className="media-add-btn" onClick={() => setShowYoutubeInput(true)}>
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
                        <iframe src={`${v.embedUrl}?rel=0`} title={`Campaign video ${i + 1}`} allowFullScreen />
                        {!isRejected && (
                          <button
                            className="video-delete-btn"
                            aria-label="Delete video"
                            onClick={() => handleYoutubeDelete(v)}
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {videoMedia.length > 1 && (
                    <>
                      <button className="gallery-nav left" aria-label="Previous video" onClick={prevVideo}>‹</button>
                      <button className="gallery-nav right" aria-label="Next video" onClick={nextVideo}>›</button>
                    </>
                  )}
                </div>
                {videoMedia.length > 1 && (
                  <div className="gallery-dots">
                    {videoMedia.map((_, i) => (
                      <span key={i} className={`dot ${i === currentVideo ? "active" : ""}`} onClick={() => setCurrentVideo(i)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </section>


      {/* ================= DOCUMENTS ================= */}
      <section className="documents-section">
        <h3 className="documents-title">Documents</h3>

        {!isRejected && (
          <div className="documents-upload-card">
            <select
              className="documents-input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="ATHLETE_IDENTITY">Athlete Identity</option>
              <option value="ACADEMY_CONFIRMATION">Academy Confirmation</option>
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
              {uploadingDoc ? "Uploading…" : "Upload PDF"}
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

        <div className="documents-list">
          {documents.length === 0 && (
            <p className="documents-empty">No documents uploaded yet.</p>
          )}

          {documents.map((doc) => (
            <div key={doc.id} className="pdf-card">
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

              <div className="pdf-meta">
                <span className={`pdf-status ${doc.verificationStatus.toLowerCase()}`}>
                  {doc.verificationStatus === "PENDING" && "⚠️ Pending"}
                  {doc.verificationStatus === "VERIFIED" && "✅ Verified"}
                  {doc.verificationStatus === "REJECTED" && "❌ Rejected"}
                </span>

                {doc.verificationStatus !== "VERIFIED" && (
                  <button
                    className="pdf-delete-btn"
                    aria-label="Delete document"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= RECIPIENT BANK ACCOUNT ================= */}
      <section className="recipient-wrapper">
        <section className="recipient-card">
          <h4 className="recipient-title">Recipient Bank Account</h4>

          {/* Row 1: Recipient Type — full width */}
          <div className="recipient-row-single">
            <select
              className="recipient-input"
              value={recipientForm.recipientType}
              onChange={(e) =>
                setRecipientForm({ ...recipientForm, recipientType: e.target.value })
              }
            >
              <option value="PARENT_GUARDIAN">Parent / Guardian</option>
              <option value="SELF">Self</option>
              <option value="COACH">Coach</option>
            </select>
          </div>

          {/* Row 2: First Name + Last Name */}
          <div className="recipient-row">
            <div>
              <input
                className="recipient-input"
                placeholder="First Name"
                value={recipientForm.firstName}
                onChange={(e) =>
                  setRecipientForm({ ...recipientForm, firstName: e.target.value })
                }
              />
              {recipientErrors.firstName && <p className="error-text">{recipientErrors.firstName}</p>}
            </div>
            <div>
              <input
                className="recipient-input"
                placeholder="Last Name"
                value={recipientForm.lastName}
                onChange={(e) =>
                  setRecipientForm({ ...recipientForm, lastName: e.target.value })
                }
              />
              {recipientErrors.lastName && <p className="error-text">{recipientErrors.lastName}</p>}
            </div>
          </div>

          {/* Row 3: Account Number + Bank Name */}
          <div className="recipient-row">
            <div>
              <input
                className="recipient-input"
                placeholder="Account Number"
                value={
                  accFocused || !recipientForm.accountNumber
                    ? recipientForm.accountNumber
                    : "*".repeat(recipientForm.accountNumber.length - 4) + recipientForm.accountNumber.slice(-4)
                }
                onFocus={() => setAccFocused(true)}
                onBlur={() => setAccFocused(false)}
                onChange={(e) =>
                  setRecipientForm({ ...recipientForm, accountNumber: e.target.value })
                }
              />
              {recipientErrors.accountNumber && <p className="error-text">{recipientErrors.accountNumber}</p>}
            </div>
            <div>
              <input
                className="recipient-input"
                placeholder="Bank Name"
                value={recipientForm.bankName}
                onChange={(e) =>
                  setRecipientForm({ ...recipientForm, bankName: e.target.value })
                }
              />
              {recipientErrors.bankName && <p className="error-text">{recipientErrors.bankName}</p>}
            </div>
          </div>

          {/* Row 4: IFSC Code + Country */}
          <div className="recipient-row">
            <div>
              <input
                className="recipient-input"
                placeholder="IFSC Code"
                value={recipientForm.ifscCode}
                onChange={(e) =>
                  setRecipientForm({ ...recipientForm, ifscCode: e.target.value })
                }
              />
              {recipientErrors.ifscCode && <p className="error-text">{recipientErrors.ifscCode}</p>}
            </div>
            <div>
              <input
                className="recipient-input"
                placeholder="Country"
                value={recipientForm.country}
                onChange={(e) =>
                  setRecipientForm({ ...recipientForm, country: e.target.value })
                }
              />
              {recipientErrors.country && <p className="error-text">{recipientErrors.country}</p>}
            </div>
          </div>

          {/* Row 5: Save button — full width */}
          {!isRejected && (
            <div className="recipient-row-single">
              <button
                className="recipient-save-btn"
                onClick={handleSaveRecipientAccount}
                disabled={savingRecipient}
              >
                {savingRecipient ? "Saving…" : "Save / Update Account"}
              </button>
            </div>
          )}

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

      {/* Withdrawal — onSuccess refreshes only payout list, not the full campaign */}
      {(campaign.status === "ACTIVE" || campaign.status === "COMPLETED") && (
        <CreateWithdrawalModal
          fundraiserId={id}
          available={availableAmount}
          onSuccess={fetchPayouts}
        />
      )}

      <WithdrawalHistoryTable fundraiserId={id} onRefresh={fetchPayouts} refreshKey={payoutRefreshKey} />

      {/* ================= CAMPAIGN UPDATES ================= */}
      {(campaign.status === "ACTIVE") && (
        <section className="campaign-updates-section">


          <div className="updates-card">
            <div className="withdraw-header"><h4 className="updates-title">Campaign Updates</h4></div>
            
            <div className="update-form">
              <input
                type="text"
                placeholder="Update title"
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
              />
              <textarea
                placeholder="Write an update for supporters…"
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
              />
              <button
                className="add-update-btn"
                onClick={handleAddUpdate}
                disabled={addingUpdate}
              >
                {addingUpdate ? "Posting…" : "+ Post Update"}
              </button>
            </div>

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
                        ref={(el) => { updateRefs.current[update.id] = el; }}
                        className={`update-content ${expandedUpdates[update.id] ? "expanded" : "collapsed"}`}
                      >
                        {update.content.split("\n").map((line, i) => (
                          <React.Fragment key={i}>{line}<br /></React.Fragment>
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
              <p className="updates-empty">No updates posted yet.</p>
            )}

          </div>
        </section>
      )}


      {alertMsg && (
        <AlertModal message={alertMsg} type="error" onClose={() => setAlertMsg("")} />
      )}
    </div>
  );
}
