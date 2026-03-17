"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { FundraiserService } from "@/services/fundraiser.service";
import InstagramEmbed from "@/components/instagram/instagram";
import type { MediaItem } from "@/types/campaign.types";

type VideoMedia = { embedUrl: string; originalUrl: string };

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

function normalizeMedia(mediaItems: MediaItem[]) {
  const images: string[] = [];
  const videos: VideoMedia[] = [];
  const instagrams: string[] = [];

  mediaItems.forEach((item) => {
    if (Array.isArray(item.playerImages)) images.push(...item.playerImages);
    if (Array.isArray(item.youTubeUrl)) {
      item.youTubeUrl.forEach((originalUrl) => {
        if (isInstagramUrl(originalUrl)) {
          instagrams.push(originalUrl);
        } else {
          const videoId = getYouTubeVideoId(originalUrl);
          if (videoId) videos.push({ embedUrl: `https://www.youtube.com/embed/${videoId}`, originalUrl });
        }
      });
    }
  });

  return { images, videos, instagrams };
}

interface Props {
  campaignId: string;
  initialMedia: MediaItem[];
  isRejected: boolean;
}

export default function MediaSection({ campaignId, initialMedia, isRejected }: Props) {
  const [imageMedia, setImageMedia] = useState<string[]>([]);
  const [videoMedia, setVideoMedia] = useState<VideoMedia[]>([]);
  const [instagramMedia, setInstagramMedia] = useState<string[]>([]);

  const [currentImage, setCurrentImage] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [currentInstagram, setCurrentInstagram] = useState(0);

  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [showInstagramInput, setShowInstagramInput] = useState(false);

  useEffect(() => {
    const { images, videos, instagrams } = normalizeMedia(initialMedia);
    setImageMedia(images);
    setVideoMedia(videos);
    setInstagramMedia(instagrams);
  }, [initialMedia]);

  const refreshMedia = async () => {
    try {
      const res = await FundraiserService.getCampaignById(campaignId);
      const { images, videos, instagrams } = normalizeMedia(res.data.data.media ?? []);
      setImageMedia(images);
      setVideoMedia(videos);
      setInstagramMedia(instagrams);
      setCurrentImage(0);
      setCurrentVideo(0);
      setCurrentInstagram(0);
    } catch { /* non-critical */ }
  };

  const handleImageUpload = async (files: FileList) => {
    if (uploadingMedia) return;
    try {
      setUploadingMedia(true);
      await FundraiserService.uploadPlayerMedia(campaignId, Array.from(files));
      await refreshMedia();
    } catch { /* handled by interceptor */ } finally { setUploadingMedia(false); }
  };

  const handleImageDelete = async (url: string) => {
    try {
      await FundraiserService.deletePlayerMedia(campaignId, url);
      await refreshMedia();
    } catch { /* handled by interceptor */ }
  };

  const handleYoutubeAdd = async () => {
    if (!youtubeUrl.trim()) return;
    try {
      await FundraiserService.addYoutubeMedia(campaignId, [youtubeUrl]);
      const videoId = getYouTubeVideoId(youtubeUrl);
      if (videoId) {
        setVideoMedia((prev) => [
          ...prev,
          { embedUrl: `https://www.youtube.com/embed/${videoId}`, originalUrl: youtubeUrl },
        ]);
      }
      setYoutubeUrl("");
      setShowYoutubeInput(false);
    } catch { /* handled by interceptor */ }
  };

  const handleYoutubeDelete = async (video: VideoMedia) => {
    try {
      const videoId = video.embedUrl.split("/embed/")[1]?.split("?")[0];
      await FundraiserService.deleteYoutubeMedia(campaignId, `https://www.youtube.com/watch?v=${videoId}`);
      await refreshMedia();
    } catch { /* handled by interceptor */ }
  };

  const handleInstagramAdd = async () => {
    if (!instagramUrl.trim()) return;
    try {
      await FundraiserService.addInstagramMedia(campaignId, [instagramUrl]);
      await refreshMedia();
      setInstagramUrl("");
      setShowInstagramInput(false);
    } catch { /* handled by interceptor */ }
  };

  const handleInstagramDelete = async (url: string) => {
    try {
      await FundraiserService.deleteInstagramMedia(campaignId, url);
      await refreshMedia();
    } catch { /* handled by interceptor */ }
  };

  const nextImage = () => setCurrentImage((p) => (p === imageMedia.length - 1 ? 0 : p + 1));
  const prevImage = () => setCurrentImage((p) => (p === 0 ? imageMedia.length - 1 : p - 1));
  const nextVideo = () => setCurrentVideo((p) => (p === videoMedia.length - 1 ? 0 : p + 1));
  const prevVideo = () => setCurrentVideo((p) => (p === 0 ? videoMedia.length - 1 : p - 1));
  const nextInstagram = () => setCurrentInstagram((p) => (p === instagramMedia.length - 1 ? 0 : p + 1));
  const prevInstagram = () => setCurrentInstagram((p) => (p === 0 ? instagramMedia.length - 1 : p - 1));

  return (
    <section className="media-row full-width">

      {/* LEFT: INSTAGRAM */}
      <div className="media-box">
        <div className="media-box-header">
          <h3>Instagram</h3>
          {!isRejected && !showInstagramInput && (
            <button className="media-add-btn" onClick={() => setShowInstagramInput(true)}>+ Add Instagram</button>
          )}
          {!isRejected && showInstagramInput && (
            <div className="youtube-row">
              <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="Paste Instagram reel/post link" />
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
                <button className="video-delete-btn instagram-del-btn" aria-label="Delete Instagram post"
                  onClick={() => handleInstagramDelete(instagramMedia[currentInstagram])}>
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

      {/* RIGHT: IMAGES + YOUTUBE */}
      <div className="media-right-col">

        {/* IMAGES */}
        <div className="media-box">
          <div className="media-box-header">
            <h3>Images</h3>
            {!isRejected && (
              <label className="media-add-btn">
                {uploadingMedia ? "Uploading…" : "+ Upload Image"}
                <input type="file" accept="image/*" multiple hidden disabled={uploadingMedia}
                  onChange={(e) => { if (e.target.files && !uploadingMedia) { handleImageUpload(e.target.files); e.target.value = ""; } }}
                />
              </label>
            )}
          </div>

          {imageMedia.length === 0 ? (
            <div className="media-empty">No images right now</div>
          ) : (
            <>
              <div className="gallery-image-container">
                <div className="gallery-track" style={{ transform: `translateX(-${currentImage * 100}%)` }}>
                  {imageMedia.map((url, i) => (
                    <div className="image-slide" key={i}>
                      <img src={url} alt={`Campaign photo ${i + 1}`} className="gallery-image" loading="lazy" />
                      {!isRejected && (
                        <button className="image-delete-btn" aria-label="Delete image" onClick={() => handleImageDelete(url)}>
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
              <button className="media-add-btn" onClick={() => setShowYoutubeInput(true)}>+ Add Video Link</button>
            )}
            {!isRejected && showYoutubeInput && (
              <div className="youtube-row">
                <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="Paste YouTube link" />
                <button onClick={handleYoutubeAdd}>Add</button>
              </div>
            )}
          </div>

          {videoMedia.length === 0 ? (
            <div className="media-empty">No videos right now</div>
          ) : (
            <>
              <div className="gallery-image-container">
                <div className="gallery-track" style={{ transform: `translateX(-${currentVideo * 100}%)` }}>
                  {videoMedia.map((v, i) => (
                    <div className="video-box" key={i}>
                      <iframe src={`${v.embedUrl}?rel=0`} title={`Campaign video ${i + 1}`} allowFullScreen />
                      {!isRejected && (
                        <button className="video-delete-btn" aria-label="Delete video" onClick={() => handleYoutubeDelete(v)}>
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
  );
}
