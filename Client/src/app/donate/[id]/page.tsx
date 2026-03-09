"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import "../../dashboard/campaigns/[id]/campaign-details.css";
import DonateModal from "@/components/donation/DonateModal";
import DonorsList from "@/components/donation/DonorsList";
import type { Donation } from "@/types/donation";
import "./explore.css";
import PayoutSummary from "@/components/public/payouts/PayoutSummary";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import InstagramEmbed from "@/components/instagram/instagram";
import ShareButton from "@/components/ShareButton/ShareButton";

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


type BeneficiaryUser = {
  firstName: string;
  lastName: string;
};

type BeneficiaryOther = {
  fullName: string;
  relationshipToCreator: string;
};

type Fundraiser = {
  id: string;
  title: string;
  shortDescription: string;
  coverImageURL?: string;
  goalAmount: string;
  raisedAmount: string;
  sport: string;
  city: string;
  state: string;
  story?: string;
  media?: any[];
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "SUSPENDED" | "COMPLETED";

  campaignFor?: "SELF" | "OTHER";
  beneficiaryUser?: BeneficiaryUser;
  beneficiaryOther?: BeneficiaryOther;

  donations?: Donation[];
};

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

export default function ExploreFundraiserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openDonate, setOpenDonate] = useState(false);

  const [imageMedia, setImageMedia] = useState<string[]>([]);
  const [videoMedia, setVideoMedia] = useState<VideoMedia[]>([]);
  const [instagramMedia, setInstagramMedia] = useState<string[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [currentInstagram, setCurrentInstagram] = useState(0);

  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [expandedStory, setExpandedStory] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const storyRef = useRef<HTMLParagraphElement | null>(null);

  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
  const updateRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const [overflowingUpdates, setOverflowingUpdates] = useState<Record<string, boolean>>({});


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


  /* ================= FETCH CAMPAIGN ================= */
  const fetchCampaign = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/fundraiser/${id}/public`);

      const data = res?.data?.data;
      setCampaign(data);

      const updatesFromBE = Array.isArray(data?.fundraiserupdates)
        ? data.fundraiserupdates
        : [];

      setUpdates(
        updatesFromBE.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch {
      setCampaign(null);
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
  }, [campaign]);

  useEffect(() => {
    if (!campaign?.story) {
      setShowReadMore(false);
      return;
    }

    const el = storyRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      const isOverflowing = el.scrollHeight > el.clientHeight;
      setShowReadMore(isOverflowing);
    });
  }, [campaign?.story]);

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

  /* ================= STATES ================= */
  if (loading) {
    return <div className="dashboard-center">Loading campaign…</div>;
  }

  if (!campaign || campaign.status !== "ACTIVE") {
    return (
      <div className="dashboard-center">
        Campaign not available or no longer active.
      </div>
    );
  }

  const raised = Number(campaign.raisedAmount || 0);
  const goal = Number(campaign.goalAmount || 0);
  const progress =
    goal === 0 ? 0 : Math.min(Math.round((raised / goal) * 100), 100);

  return (

    <div className="campaign-page public-view">
      <header className="campaign-topbar">
        <button
          className="back-btn"
          onClick={() => router.push("/donate")}
        >
          ← Back to Explore
        </button>
        <StatusBadge status={campaign.status} />
      </header>

      {/* HEADER */}
      <section className="campaign-header">
        <h1>{campaign.title}</h1>
        <p className="subtitle">{campaign.shortDescription}</p>
      </section>

      {/* ================= TOP SPLIT SECTION ================= */}
      <div className="campaign-layout">

        {/* LEFT COLUMN */}
        <div className="campaign-left">

          {/* COVER */}
          <div className="cover-box">
            <img
              src={campaign.coverImageURL || "/background.png"}
              alt="Campaign cover"
              className="cover-image"
            />
          </div>

          {/* MOBILE-ONLY DONATE CARD — sits right below cover on small screens */}
          <div className="mobile-donate-card">
            <div className="amount">₹{raised.toLocaleString()}</div>
            <div className="goal">raised of ₹{goal.toLocaleString()} goal</div>
            <div className="progress-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
            <button
              className="donate-btn"
              onClick={() => setOpenDonate(true)}
            >
              Donate Now
            </button>
            <ShareButton fundraiserId={campaign.id} title={campaign.title} variant="full" />
          </div>

          {/* SPORT / LEVEL / LOCATION */}
          <section className="highlights-card">

            <div className="highlight-item">
              <span>SPORT</span>
              <strong>{campaign.sport}</strong>
            </div>

            <div className="highlight-item">
              <span>LEVEL</span>
              <strong>{campaign.level}</strong>
            </div>

            <div className="highlight-item">
              <span>LOCATION</span>
              <strong>{campaign.city}, {campaign.state}</strong>
            </div>

            <div className="highlight-item">
              <span>DISCIPLINE</span>
              <strong>{campaign.discipline || "—"}</strong>
            </div>

            {Array.isArray(campaign.skills) &&
              campaign.skills.length > 0 && (
                <div className="highlight-item full">
                  <span className="highlight-label">
                    Key Skills
                  </span>
                  <div className="skill-chip-row">
                    {campaign.skills.map(
                      (skill: string, idx: number) => (
                        <span className="skill-chip" key={idx}>
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}


            {/* BENEFICIARY INSIDE SAME BOX */}
            <div className="highlight-beneficiary">

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
                    <span className="beneficiary-meta">
                      Organizer • Self
                    </span>
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

            </div>

          </section>

          {/* MY JOURNEY */}
          <section className="story-card">
            <h3>My Journey</h3>

            {campaign?.story ? (
              <>
                <p
                  ref={storyRef}
                  className={`story-text ${expandedStory ? "expanded" : "collapsed"
                    }`}
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
        <div className="campaign-right">

          {/* DONATION CARD */}
          <div className="donation-card">
            <div className="amount">
              ₹{raised.toLocaleString()}
            </div>

            <div className="goal">
              raised of ₹{goal.toLocaleString()} goal
            </div>

            <div className="progress-bar">
              <div style={{ width: `${progress}%` }} />
            </div>

            <button
              className="donate-btn"
              onClick={() => setOpenDonate(true)}
            >
              Donate Now
            </button>
            <ShareButton fundraiserId={campaign.id} title={campaign.title} variant="full" />
          </div>


          {/* RECENT DONORS */}
          {campaign.donations && (
            <DonorsList
              donations={campaign.donations}
              fundraiserId={campaign.id}
              maxItems={5}
            />
          )}

        </div>

      </div>


      {/* ================= FULL WIDTH START ================= */}

      {(instagramMedia.length > 0 || imageMedia.length > 0 || videoMedia.length > 0) && (
        <section className="media-row full-width">

          {/* INSTAGRAM — only when URLs exist */}
          {instagramMedia.length > 0 && (
            <div className="media-box">
              <h3>Instagram</h3>
              <div className="instagram-viewer">
                <div className="instagram-slide-wrap">
                  <InstagramEmbed key={instagramMedia[currentInstagram]} url={instagramMedia[currentInstagram]} />
                </div>
                {instagramMedia.length > 1 && (
                  <div className="instagram-nav-row">
                    <button className="insta-nav-btn" onClick={prevInstagram}>‹</button>
                    <span className="insta-nav-count">{currentInstagram + 1} / {instagramMedia.length}</span>
                    <button className="insta-nav-btn" onClick={nextInstagram}>›</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* IMAGES + YOUTUBE — only when at least one has content */}
          {(imageMedia.length > 0 || videoMedia.length > 0) && (
            <div className="media-right-col">

              {/* IMAGES — only when URLs exist */}
              {imageMedia.length > 0 && (
                <div className="media-box">
                  <h3>Images</h3>
                  <div className="gallery-image-container">
                    <div className="gallery-track" style={{ transform: `translateX(-${currentImage * 100}%)` }}>
                      {imageMedia.map((url, i) => (
                        <img key={i} src={url} alt={`Campaign photo ${i + 1}`} className="gallery-image" loading="lazy" />
                      ))}
                    </div>
                    {imageMedia.length > 1 && (
                      <>
                        <button className="gallery-nav left" onClick={prevImage} aria-label="Previous image">‹</button>
                        <button className="gallery-nav right" onClick={nextImage} aria-label="Next image">›</button>
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
                </div>
              )}

              {/* YOUTUBE — only when URLs exist */}
              {videoMedia.length > 0 && (
                <div className="media-box">
                  <h3>YouTube Videos</h3>
                  <div className="gallery-image-container">
                    <div className="gallery-track" style={{ transform: `translateX(-${currentVideo * 100}%)` }}>
                      {videoMedia.map((v, i) => (
                        <div className="video-box" key={i}>
                          <iframe src={`${v.embedUrl}?rel=0`} title={`Campaign video ${i + 1}`} allowFullScreen />
                        </div>
                      ))}
                    </div>
                    {videoMedia.length > 1 && (
                      <>
                        <button className="gallery-nav left" onClick={prevVideo} aria-label="Previous video">‹</button>
                        <button className="gallery-nav right" onClick={nextVideo} aria-label="Next video">›</button>
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
                </div>
              )}

            </div>
          )}
        </section>
      )}

      {/* ================= UPDATES ================= */}
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


      {/* FUND UTILIZATION */}
      <section className="full-width">
        <PayoutSummary fundraiserId={id} />
      </section>

      <DonateModal
        fundraiserId={campaign.id}
        isOpen={openDonate}
        onClose={() => setOpenDonate(false)}
        onSuccess={fetchCampaign}
      />

    </div>

  );
}
