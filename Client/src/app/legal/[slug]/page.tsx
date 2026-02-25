import { notFound } from "next/navigation";
import Link from "next/link";
import { getLegalPage, getAllLegalSlugs } from "../content";
import "@/components/LegalLayout/LegalLayout.css";

/* ── Static generation ─────────────────────────────────────── */
export async function generateStaticParams() {
  return getAllLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) return {};
  return {
    title: `${page.title} — Raise A Player`,
    description: page.subtitle,
  };
}

/* ── Category accent colors ─────────────────────────────────── */
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

/* ── Page Component ─────────────────────────────────────────── */
export default async function LegalSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) notFound();

  const categoryIcon = CATEGORY_ICONS[page.category] ?? "📄";

  return (
    <div className="legal-page">
      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="legal-hero">
        <div className="legal-hero__inner">
          {/* Breadcrumb */}
          <nav className="legal-hero__breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="legal-hero__breadcrumb-sep">›</span>
            <Link href="/legal">Legal & Policies</Link>
            <span className="legal-hero__breadcrumb-sep">›</span>
            <span className="legal-hero__breadcrumb-current">
              {page.title}
            </span>
          </nav>

          {/* Category badge */}
          <div className="legal-hero__category-badge">
            <span>{categoryIcon}</span>
            {page.category}
          </div>

          {/* Title */}
          <h1 className="legal-hero__title">{page.title}</h1>

          {/* Meta */}
          <div className="legal-hero__meta">
            <span className="legal-hero__meta-item">
              <strong>Effective:</strong>&nbsp;{page.effectiveDate}
            </span>
            <span className="legal-hero__meta-item">
              <strong>Last updated:</strong>&nbsp;{page.lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────── */}
      <div className="legal-body">
        {/* Subtitle */}
        <p
          style={{
            fontSize: "15px",
            color: "#475569",
            lineHeight: "1.7",
            marginBottom: "32px",
            borderLeft: "3px solid #ff7a21",
            paddingLeft: "14px",
          }}
        >
          {page.subtitle}
        </p>

        {/* Table of Contents */}
        {page.sections.length > 3 && (
          <nav className="legal-toc" aria-label="Table of contents">
            <p className="legal-toc__title">On this page</p>
            <ul className="legal-toc__list">
              {page.sections.map((section, idx) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>
                    {idx + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Sections */}
        {page.sections.map((section, idx) => (
          <section
            key={section.id}
            id={section.id}
            className="legal-section"
          >
            <h2 className="legal-section__heading">
              <span className="legal-section__heading-num">{idx + 1}</span>
              {section.title}
            </h2>
            <div
              className="legal-section__body"
              /* Content is authored server-side in content.ts — not user input */
              dangerouslySetInnerHTML={{ __html: section.body }}
            />
          </section>
        ))}

        {/* Back to top + navigation */}
        <div className="legal-back-top">
          <a href="#" className="legal-back-top__btn">
            ↑ Back to top
          </a>
        </div>

        {/* Bottom nav */}
        <div
          style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "13.5px",
          }}
        >
          <Link
            href="/legal"
            style={{
              color: "#0057b8",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
            }}
          >
            ← All Policies
          </Link>
          <Link
            href="/contact"
            style={{
              color: "#475569",
              textDecoration: "none",
              fontSize: "13px",
            }}
          >
            Have questions? Contact us →
          </Link>
        </div>
      </div>
    </div>
  );
}
