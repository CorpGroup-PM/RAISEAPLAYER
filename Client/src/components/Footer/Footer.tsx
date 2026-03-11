"use client";

import Link from "next/link";
import Image from "next/image";
import "./Footer.css";

/* ── Social icon SVGs ─────────────────────────────────── */
const InstagramIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

// const TwitterXIcon = () => (
//   <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
//     <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
//   </svg>
// );

const LinkedInIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ────────────────────────────────────────────────────────────────── */

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: "Home", href: "/" },
    { label: "Explore Campaigns", href: "/donate" },
    { label: "Start a Fundraiser", href: "/start-fundraiser" },
    { label: "Reviews", href: "/reviews" },
    { label: "Contact Us", href: "/contact" },
  ];

  const legalLinks = [
    { label: "Terms & Conditions", href: "/legal/terms" },
    { label: "Privacy Policy", href: "/legal/privacy-policy" },
    { label: "Refund & Cancellation", href: "/legal/refund-policy" },
    { label: "Donor Policy", href: "/legal/donor-policy" },
    { label: "Campaign Creator Policy", href: "/legal/campaign-creator-policy" },
    { label: "KYC & Verification", href: "/legal/kyc-policy" },
    { label: "Fund Disbursal Policy", href: "/legal/fund-disbursal-policy" },
    { label: "Grievance & Complaints", href: "/legal/grievance" },
    { label: "Disclaimer", href: "/legal/disclaimer" },
    { label: "Cookie Policy", href: "/legal/cookie-policy" },
  ];

  return (
    <footer className="rp-footer" role="contentinfo">
      {/* ── TOP ─────────────────────────────────────────────── */}
      <div className="rp-footer__top">

        {/* Col 1 — Brand */}
        <div className="rp-footer__brand">
          <Link href="/" className="rp-footer__logo">
            <Image
              src="/footer-logo.png"
              alt="Raise A Player icon"
               width={140}
              height={40}
              className="rp-footer__logo-icon"
            />
            {/* <Image
              src="/logo3.png"
              alt="Raise A Player"
              width={140}
              height={40}
              className="rp-footer__logo-text"
            /> */}
          </Link>

          <p className="rp-footer__tagline">
            Empowering young athletes across India through community-backed
            fundraising. Every rupee counts toward a champion's journey.
          </p>

          <span className="rp-footer__section8-badge">
            <ShieldIcon />
            Section 8 Company · 12AB & 80G Applied
          </span>

          <div className="rp-footer__socials">
            <a
              href="https://www.instagram.com/raise.a.player/"
              target="_blank"
              rel="noopener noreferrer"
              className="rp-footer__social-link"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
            {/* <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rp-footer__social-link"
              aria-label="Twitter / X"
            >
              <TwitterXIcon />
            </a> */}
            <a
              href="https://www.linkedin.com/company/raiseaplayer/"
              target="_blank"
              rel="noopener noreferrer"
              className="rp-footer__social-link"
              aria-label="LinkedIn"
            >
              <LinkedInIcon />
            </a>
            <a
              href="https://www.youtube.com/@Raise_a_Player"
              target="_blank"
              rel="noopener noreferrer"
              className="rp-footer__social-link"
              aria-label="YouTube"
            >
              <YouTubeIcon />
            </a>
            <a
              href="https://www.facebook.com/raiseaplayerdotorg"
              target="_blank"
              rel="noopener noreferrer"
              className="rp-footer__social-link"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
          </div>
        </div>

        {/* Col 2 — Platform */}
        <div className="rp-footer__links-col">
          <p className="rp-footer__col-title">Platform</p>
          <nav aria-label="Platform navigation">
            <ul className="rp-footer__nav">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Col 3 — Legal */}
        <div className="rp-footer__links-col">
          <p className="rp-footer__col-title">Legal & Policies</p>
          <nav aria-label="Legal navigation">
            <ul className="rp-footer__nav">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Col 4 — Contact */}
        <div className="rp-footer__contact-col">
          <p className="rp-footer__col-title">Get in Touch</p>

          <div className="rp-footer__contact-list">
            <div className="rp-footer__contact-item">
              <span className="rp-footer__contact-icon">
                <MailIcon />
              </span>
              <div>
                <div style={{ marginBottom: 2, fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Support</div>
                <a href="mailto:support@raiseaplayer.org">
                  support@raiseaplayer.org
                </a>
              </div>
            </div>

            <div className="rp-footer__contact-item">
              <span className="rp-footer__contact-icon">
                <MailIcon />
              </span>
              <div>
                <div style={{ marginBottom: 2, fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Grievance</div>
                <a href="mailto:grievance@raiseaplayer.org">
                  grievance@raiseaplayer.org
                </a>
              </div>
            </div>

            <div className="rp-footer__contact-item">
              <span className="rp-footer__contact-icon">
                <MapPinIcon />
              </span>
              <div>
                Unit-NO: 7-140/2, E 5, Nagendra Nagar, Scientist Colony,
                <br />
                Habsiguda, Hyderabad — 500 007
                <br />
                Telangana, India
              </div>
            </div>
          </div>

          <div className="rp-footer__cin-block">
            <strong>CIN:</strong> U93120TS2025NPL207492
            <br />
            <strong>PAN:</strong> AALCN0816H
          </div>
        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────── */}
      <hr className="rp-footer__divider" />

      {/* ── BOTTOM BAR ──────────────────────────────────────── */}
      <div className="rp-footer__bottom">
        <p className="rp-footer__copyright">
          &copy; {currentYear}{" "}
          <strong>Navyug Raise a Player Foundation</strong>. All rights
          reserved. Section 8 Company incorporated in India.
        </p>

        <div className="rp-footer__bottom-links">
          <Link href="/legal/terms">Terms</Link>
          <span className="rp-footer__bottom-sep">·</span>
          <Link href="/legal/privacy-policy">Privacy</Link>
          <span className="rp-footer__bottom-sep">·</span>
          <Link href="/legal/refund-policy">Refunds</Link>
          <span className="rp-footer__bottom-sep">·</span>
          <Link href="/legal/grievance">Grievance</Link>
          <span className="rp-footer__bottom-sep">·</span>
          <Link href="/legal/report-campaign">Report Campaign</Link>
          <span className="rp-footer__bottom-sep">·</span>
          <Link href="/legal/legal-identity">Legal Identity</Link>
        </div>
      </div>
    </footer>
  );
}
