import Link from "next/link";
import { legalPages } from "./content";
import "@/components/LegalLayout/LegalLayout.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Policies — Raise A Player",
  description:
    "All legal documents, policies, and terms governing the Raise A Player platform operated by Navyug Raise a Player Foundation.",
};

const CATEGORY_ICONS: Record<string, string> = {
  Legal: "⚖️",
  Privacy: "🔒",
  Payments: "💳",
  Donors: "🤝",
  Campaigns: "🏆",
  Verification: "✅",
  Finance: "📊",
  Support: "📩",
  Safety: "🚩",
};

export default function LegalIndexPage() {
  return (
    <div className="legal-index-page">
      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="legal-index-hero">
        <div className="legal-index-hero__inner">
          <h1 className="legal-index-hero__title">Legal &amp; Policies</h1>
          <p className="legal-index-hero__sub">
            All terms, policies, and legal documents governing the Raise A
            Player platform — operated by{" "}
            <strong style={{ color: "#94a3b8" }}>
              Navyug Raise a Player Foundation
            </strong>
            .
          </p>
        </div>
      </div>

      {/* ── GRID ──────────────────────────────────────────── */}
      <div className="legal-index-body">
        <div
          style={{
            marginBottom: "28px",
            fontSize: "13.5px",
            color: "#64748b",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderLeft: "4px solid #0057b8",
            borderRadius: "10px",
            padding: "14px 18px",
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color: "#334155" }}>
            Navyug Raise a Player Foundation
          </strong>{" "}
          · CIN: U93120TS2025NPL207492 · PAN: AALCN0816H · Section 8
          Company · Habsiguda, Hyderabad — 500 007, Telangana, India
        </div>

        <div className="legal-index-grid">
          {legalPages.map((page) => {
            const icon = CATEGORY_ICONS[page.category] ?? "📄";
            return (
              <Link
                key={page.slug}
                href={`/legal/${page.slug}`}
                className="legal-index-card"
              >
                <div className="legal-index-card__icon">{icon}</div>
                <p className="legal-index-card__title">{page.title}</p>
                <p className="legal-index-card__desc">{page.subtitle}</p>
                <p className="legal-index-card__arrow">Read policy →</p>
              </Link>
            );
          })}
        </div>

        {/* Bottom note */}
        <div
          style={{
            marginTop: "48px",
            textAlign: "center",
            fontSize: "13px",
            color: "#94a3b8",
            lineHeight: 1.7,
          }}
        >
          <p>
            For any queries, contact us at{" "}
            <a
              href="mailto:support@raiseaplayer.org"
              style={{ color: "#0057b8" }}
            >
              support@raiseaplayer.org
            </a>
            {" · "}
            <a
              href="mailto:grievance@raiseaplayer.org"
              style={{ color: "#0057b8" }}
            >
              grievance@raiseaplayer.org
            </a>
          </p>
          <p style={{ marginTop: "6px" }}>
            These documents are drafts pending final review by qualified legal
            counsel.
          </p>
        </div>
      </div>
    </div>
  );
}
