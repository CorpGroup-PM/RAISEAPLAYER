"use client";

import { useState, useRef, useEffect } from "react";
import "./share-button.css";

type Props = {
  fundraiserId: string;
  title?: string;
  variant?: "icon" | "full";
};

export default function ShareButton({ fundraiserId, title, variant = "icon" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const getUrl = () =>
    `${window.location.origin}/donate/${fundraiserId}`;

  const shareText = title
    ? `Support "${title}" on RaiseAPlayer!`
    : "Support this athlete on RaiseAPlayer!";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getUrl();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`,
      "_blank"
    );
    setOpen(false);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({ title: shareText, url: getUrl() });
    } catch {
      // user cancelled or not supported
    }
    setOpen(false);
  };

  const shareIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  return (
    <div className={`sb-wrap ${variant === "full" ? "sb-wrap-full" : ""}`} ref={ref}>
      <button
        className={variant === "full" ? "sb-trigger-full" : "sb-trigger"}
        title="Share"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
      >
        {shareIcon}
        {variant === "full" && <span>Share</span>}
      </button>

      {open && (
        <div className={`sb-popup ${variant === "full" ? "sb-popup-full" : ""}`}>
          {/* WhatsApp */}
          <button className="sb-option sb-whatsapp" onClick={handleWhatsApp}>
            <svg viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.65 4.73 1.77 6.72L2 30l7.46-1.74A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm7.2 19.6c-.3.84-1.74 1.6-2.42 1.7-.62.1-1.4.14-2.26-.14-.52-.17-1.18-.4-2.04-.78-3.58-1.56-5.92-5.18-6.1-5.42-.18-.24-1.46-1.94-1.46-3.7 0-1.76.92-2.62 1.26-2.98.3-.32.66-.4.88-.4.22 0 .44 0 .64.01.2.01.48-.08.74.56.3.7 1.02 2.46 1.1 2.64.08.18.14.38.02.62-.12.24-.18.38-.36.58-.18.2-.38.44-.54.6-.18.17-.36.36-.16.7.2.34.9 1.48 1.94 2.4 1.34 1.18 2.46 1.54 2.8 1.72.34.18.54.15.74-.09.2-.24.86-1 1.08-1.34.22-.34.44-.28.74-.17.3.12 1.9.9 2.22 1.06.32.17.54.25.62.38.08.14.08.8-.22 1.64z" />
            </svg>
            WhatsApp
          </button>

          {/* Copy Link */}
          <button className="sb-option sb-copy" onClick={handleCopy}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {copied ? "Copied!" : "Copy Link"}
          </button>

          {/* Native share — only shown if supported */}
          {typeof navigator !== "undefined" && !!navigator.share && (
            <button className="sb-option sb-more" onClick={handleNativeShare}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
