"use client";

import { useState, useMemo } from "react";
import "./resources.css";
import { useStartFundraiser } from "@/hooks/useStartFundraiser";
import PanKycModal from "@/components/Pan-Kyc-Modal/PanKycModal";

const CATEGORIES = [
  {
    id: "fundraiser-setup",
    icon: "🚀",
    title: "Fundraiser Setup",
    description: "Create a high-converting fundraiser in minutes.",
    color: "#4f46e5",
    tag: "Fundraising",
    topics: [
      "Crafting a compelling title and realistic goal amount",
      "Beneficiary vs organiser rules — who receives the funds",
      "Required documents checklist before you publish",
      "Choosing the right category and urgency level",
    ],
    detail: [
      {
        heading: "Title & Goal",
        body: "Keep your title under 60 characters and specific — 'Help Arjun reach nationals 2025' converts far better than 'Support a cricketer'. Set your goal to cover verifiable costs only; inflated goals reduce donor trust.",
      },
      {
        heading: "Beneficiary Rules",
        body: "The organiser and beneficiary can be different people. If you are raising for someone else, upload a relationship proof (birth certificate, letter of authority) and add the beneficiary's bank account in the Payout section.",
      },
      {
        heading: "Documents Checklist",
        body: "Government photo ID (Aadhaar / PAN), proof of sport (selection letter, academy certificate), cost proof (tournament invoice, fee receipt), and a clear profile photo.",
      },
    ],
  },
  {
    id: "story-proof",
    icon: "✍️",
    title: "Story & Proof Guide",
    description: "Write a story people trust and donate to.",
    color: "#0891b2",
    tag: "Fundraising",
    topics: [
      "Story template: problem → need → plan → ask",
      "Photos and video checklist for maximum impact",
      "Sports proof examples",
      "Common rejection reasons and how to fix them",
    ],
    detail: [
      {
        heading: "Story Template",
        body: "Problem: 'I was selected for the U-19 state camp but cannot afford the training camp fee.' Need: '₹45,000 covers 3 months of coaching, kit, and travel.' Plan: 'I will train for 90 days and compete in April.' Ask: 'Even ₹500 from you helps me stay on track.'",
      },
      {
        heading: "Photo & Video Checklist",
        body: "Upload at least 3 photos: one of you in action, one of the document/invoice proving the need, and one personal photo. A 60-second video explaining your story in your own words increases donations by up to 3×.",
      },
      {
        heading: "Proof Examples",
        body: "Sports: selection letter on official letterhead, tournament draw sheet, score card. All documents must be dated within the last 90 days.",
      },
      {
        heading: "Rejection Fixes",
        body: "Blurry documents → re-upload at 200 dpi minimum. Missing beneficiary name → ensure the document names the person receiving funds. Vague story → add exact cost breakdown. Contact support if you get stuck.",
      },
    ],
  },
  {
    id: "kyc-verification",
    icon: "✅",
    title: "Verification & Trust (KYC)",
    description: "Get verified faster and increase donations.",
    color: "#059669",
    tag: "Verification",
    topics: [
      "Step-by-step profile verification walkthrough",
      "Accepted document formats and file size tips",
      "Name mismatch fixes between ID and bank account",
      "How the verification badge works",
    ],
    detail: [
      {
        heading: "Verification Steps",
        body: "1. Go to Profile → Fill the Personal Details Form. 2. Fill the PAN card Form. 4. Add your bank account under Payouts. 5. Wait 24–48 hours for admin review.",
      },
      {
        heading: "Document Formats",
        body: "Accepted: JPG, PNG, PDF — maximum 5 MB per file. Ensure all four corners of the Documents are visible, text is readable, and there is no flash glare. Scanned copies are preferred over mobile photos.",
      },
      {
        heading: "Name Mismatch",
        body: "If your PAN shows a nickname and your bank account uses your full legal name, upload a gazette notification or affidavit. Contact support with both documents and we'll manually verify.",
      },
      {
        heading: "Verification Badge",
        body: "A green Verified badge appears on your fundraiser card after our quick checks (identity + documents). It helps donors feel confident and reduces fraud.",
      },
    ],
  },
  {
    id: "donation-payment",
    icon: "💳",
    title: "Donation & Payment Help",
    description: "Donation flow support and payment issue fixes.",
    color: "#7c3aed",
    tag: "Fundraising",
    topics: [
      "Payment failed / pending / success — what each means",
      "Refund timelines and how to request one",
      "Receipt and invoice support",
      "Platform fee and tip explanation",
    ],
    detail: [
      {
        heading: "Payment Statuses",
        body: "Success: money deducted and credited to fundraiser — you'll receive a receipt by email. Pending: bank is processing; wait 24 hours before contacting support. Failed: money NOT deducted; try a different card or UPI ID.",
      },
      {
        heading: "Refunds",
        body: "Refunds are processed within 5–7 working days to the original payment source. To request a refund, email support@raiseaplayer.org with your donation ID. Note: refunds are not available after the fundraiser has transferred funds.",
      },
      {
        heading: "Receipts",
        body: "An automated email receipt is sent within 5 minutes of a successful donation. For an 80G tax-deductible receipt, complete your donor profile with PAN details before donating.",
      },
      {
        heading: "Platform Fee & Tip",
        body: "RaiseaPlayer charges a 0% platform fee on successful donations. During checkout, donors can optionally add a tip to support the platform — this is fully optional and can be set to ₹0.",
      },
    ],
  },
  {
    id: "payouts",
    icon: "💸",
    title: "Payouts & Withdrawals",
    description: "Withdraw funds safely and track payout status.",
    color: "#d97706",
    tag: "Payouts",
    topics: [
      "Withdrawal eligibility rules",
      "Bank account requirements",
      "Payout status meanings: Processing / Completed / Failed",
      "Failed payout fixes: IFSC, name mismatch, limits",
    ],
    detail: [
      {
        heading: "Eligibility",
        body: "You can request a payout once your fundraiser is KYC-verified, has raised at least ₹5,000, and is in Active status. Payouts are reviewed by admin within 48 hours on business days.",
      },
      {
        heading: "Bank Requirements",
        body: "Add a savings or current account with a valid 11-digit IFSC code. The account holder name must exactly match your verified KYC name. Prepaid cards and wallets are not accepted.",
      },
      {
        heading: "Payout Statuses",
        body: "Pending: request received and in queue. Processing: bank transfer initiated — allow 1–3 working days. Completed: funds credited to your account. Failed: see the failure reason in your dashboard.",
      },
      {
        heading: "Fixing Failed Payouts",
        body: "IFSC invalid: verify with your bank passbook and re-enter. Name mismatch: update your KYC name to match the bank account exactly. Limit exceeded: contact support to request a higher payout limit with supporting documents.",
      },
    ],
  },
  {
    id: "sponsorship",
    icon: "🤝",
    title: "Corporate & Sponsorship Support",
    description: "Approach brands and sponsors professionally.",
    color: "#0f766e",
    tag: "Marketing",
    topics: [
      "Sponsor pitch deck outline",
      "Email and DM outreach templates",
      "Sponsor benefits checklist: logo, shoutouts, events",
      "Negotiation basics for first-time fundraisers",
    ],
    detail: [
      {
        heading: "Pitch Deck Outline",
        body: "Slide 1: Who you are + sport + achievements. Slide 2: What the fundraiser is for. Slide 3: Audience reach (social following, local community). Slide 4: Sponsorship tiers (Bronze/Silver/Gold). Slide 5: Benefits for sponsor. Slide 6: Contact CTA.",
      },
      {
        heading: "Email Template",
        body: "Subject: Partnership opportunity — [Your Name] / [Sport] 2025\n\nBody: Introduce yourself, mention your achievement, explain the goal, state specifically what you are asking for (cash, equipment, vouchers), and list 2–3 things you will do for the sponsor in return.",
      },
      {
        heading: "Sponsor Benefits",
        body: "Logo placement on kit / banner. Social media shoutout (tag + story). Mention in fundraiser description and updates. Invitation to your event. Certificate of association. Post-event media coverage tag.",
      },
      {
        heading: "Negotiation Basics",
        body: "Always present tiers so sponsors can choose their comfort level. Start with in-kind sponsors (equipment, nutrition) before cash sponsors. Follow up once after 7 days if there is no reply. Never share exclusivity without a signed agreement.",
      },
    ],
  },
  {
    id: "sports-services",
    icon: "🏆",
    title: "Sports Support Services",
    description: "Trusted services for athletes and academies.",
    color: "#c2410c",
    tag: "Sports Support",
    topics: [
      "Academies directory (by sport and city)",
      "Coaching and training partners",
      "Physio and rehabilitation partners",
      "Nutrition and performance partners",
    ],
    detail: [
      {
        heading: "Academies Directory",
        body: "Browse our curated list of DSYA-affiliated and privately registered academies across cricket, football, badminton, athletics, boxing, and swimming. Filter by city, sport, and age group. Listings are verified annually.",
      },
      {
        heading: "Coaching Partners",
        body: "Partner coaches offer discounted rates to verified RaiseaPlayer fundraisers. Present your fundraiser approval letter to claim the discount. Coaches are listed with credentials, availability, and contact details.",
      },
      {
        heading: "Physio & Rehab",
        body: "Injury recovery is part of the journey. Our physio partners offer first-consultation discounts for platform users. Look for the 'RaiseaPlayer Partner' badge on listings.",
      },
      {
        heading: "Nutrition & Performance",
        body: "Registered sports nutritionists and certified dietitians on our panel offer meal plan consultations. Performance testing (VO2 max, sprint analysis) available through partner labs.",
      },
    ],
  },
  {
    id: "faqs-policies",
    icon: "📋",
    title: "FAQs & Policies",
    description: "Clear rules so you don't get blocked later.",
    color: "#4338ca",
    tag: "Fundraising",
    topics: [
      "Allowed vs not-allowed fundraising use cases",
      "Misuse prevention and moderation rules",
      "Refund and dispute policy",
      "Community guidelines",
    ],
    detail: [
      {
        heading: "Allowed Use Cases",
        body: "Tournament fees, coaching fees, kit and equipment, travel and accommodation for sport events, injury treatment costs directly related to sport, academy admission fees. All uses must be documented.",
      },
      {
        heading: "Not Allowed",
        body: "Personal debt repayment, business investment, political or religious causes, fundraising for non-sport activities, and anything that violates Indian law. Violations result in permanent suspension.",
      },
      {
        heading: "Moderation Rules",
        body: "Every fundraiser is reviewed before going live. Active campaigns are monitored. Community reports are reviewed within 24 hours. Three donor complaints about the same campaign trigger an automatic hold.",
      },
      {
        heading: "Refund & Dispute Policy",
        body: "Donors can request a refund within 7 days if the fundraiser is found to be fraudulent. Disputed funds are held until investigation is complete. Resolution timeline: 10–15 working days.",
      },
    ],
  },
  {
    id: "contact-escalation",
    icon: "📞",
    title: "Contact & Escalation",
    description: "Get help fast through the right channel.",
    color: "#0369a1",
    tag: "Sports Support",
    topics: [
      "Support ticket, email, and WhatsApp contacts",
      "'Report an issue' flow",
      "Admin review timelines",
    ],
    detail: [
      {
        heading: "Contact Channels",
        body: "Email: support@raiseaplayer.org (response within 24 hours).",
      },
      {
        heading: "Report an Issue",
        body: "If you believe a fundraiser is suspicious, please contact our support team.",
      },
      {
        heading: "Review Timelines",
        body: "KYC verification: 24–48 hours. Payout approval: 48 hours. Fundraiser approval: 24–72 hours. Appeal review (suspension): 3–5 working days. Document re-verification: 24-48 hours.",
      },
    ],
  },
];

const CHIPS = [
  "All",
  "Fundraising",
  "Verification",
  "Payouts",
  "Marketing",
  "Sports Support",
];

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    handleStartFundraiser,
    kycCheckLoading,
    isKycModalOpen,
    closeKycModal,
  } = useStartFundraiser();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CATEGORIES.filter((cat) => {
      const matchesChip = activeChip === "All" || cat.tag === activeChip;
      if (!q) return matchesChip;
      const inTitle = cat.title.toLowerCase().includes(q);
      const inDesc = cat.description.toLowerCase().includes(q);
      const inTopics = cat.topics.some((t) => t.toLowerCase().includes(q));
      return matchesChip && (inTitle || inDesc || inTopics);
    });
  }, [search, activeChip]);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="res-page">
      {/* ── HERO ── */}
      <section className="res-hero">
        <div className="res-hero-inner">
          <p className="res-hero-tag">Knowledge Base</p>
          <h1 className="res-hero-title">Resources</h1>
          <p className="res-hero-subtitle">
            Everything you need to run a successful fundraiser and handle
            payouts smoothly.
          </p>

          {/* Search */}
          <div className="res-search-wrap">
            <span className="res-search-icon">🔍</span>
            <input
              className="res-search-input"
              type="text"
              placeholder="Search resources (e.g., story, payout, KYC, sharing, sponsor)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="res-search-clear"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="res-chips">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                className={`res-chip${activeChip === chip ? " res-chip--active" : ""}`}
                onClick={() => setActiveChip(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── GRID ── */}
      <section className="res-section">
        <div className="res-container">
          {filtered.length === 0 ? (
            <div className="res-empty">
              <span className="res-empty-icon">🔎</span>
              <p>No resources match your search. Try a different keyword.</p>
            </div>
          ) : (
            <div className="res-grid">
              {filtered.map((cat) => {
                const isOpen = expandedId === cat.id;
                return (
                  <article
                    key={cat.id}
                    className={`res-card${isOpen ? " res-card--open" : ""}`}
                    style={{ "--card-color": cat.color } as React.CSSProperties}
                  >
                    {/* Card top bar */}
                    <div className="res-card-bar" />

                    {/* Card header */}
                    <div className="res-card-header">
                      <div className="res-card-icon">{cat.icon}</div>
                      <span className="res-card-tag">{cat.tag}</span>
                    </div>

                    <h2 className="res-card-title">{cat.title}</h2>
                    <p className="res-card-desc">{cat.description}</p>

                    {/* Topic bullets */}
                    <ul className="res-card-topics">
                      {cat.topics.map((t, i) => (
                        <li key={i} className="res-card-topic">
                          <span className="res-card-bullet">→</span>
                          {t}
                        </li>
                      ))}
                    </ul>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="res-card-detail">
                        {cat.detail.map((d, i) => (
                          <div key={i} className="res-detail-block">
                            <h4 className="res-detail-heading">{d.heading}</h4>
                            <p className="res-detail-body">{d.body}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Toggle button */}
                    <button
                      className="res-card-btn"
                      onClick={() => toggle(cat.id)}
                    >
                      {isOpen ? "Show less ▲" : "Learn more ▼"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="res-cta">
        <div className="res-cta-inner">
          <h2 className="res-cta-title">Ready to start your fundraiser?</h2>
          <p className="res-cta-sub">
            Join hundreds of athletes already raising funds on RaiseaPlayer.
          </p>
          <div className="res-cta-actions">
            <button
              className="res-cta-btn res-cta-btn--primary"
              onClick={handleStartFundraiser}
              disabled={kycCheckLoading}
            >
              {kycCheckLoading ? "Checking..." : "Start Fundraising"}
            </button>
            <a href="/contact" className="res-cta-btn res-cta-btn--outline">
              Talk to Support
            </a>
          </div>
        </div>
      </section>
      <PanKycModal isOpen={isKycModalOpen} onClose={closeKycModal} />
    </main>
  );
}
