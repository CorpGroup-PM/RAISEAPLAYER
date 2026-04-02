"use client";

import "./home.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FundraiserService } from "@/services/fundraiser.service";
import { AnalyticsService } from "@/services/analytics.service";
import { useStartFundraiser } from "@/hooks/useStartFundraiser";
import PanKycModal from "@/components/Pan-Kyc-Modal/PanKycModal";
import ShareButton from "@/components/ShareButton/ShareButton";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/toast/ToastContext";
import { VolunteerService } from "@/services/volunteer.service";

type FundraiserTop = {
  id: string;
  title: string;
  coverImageURL: string;
  sport?: string;
  city?: string;
  state?: string;
  goalAmount?: number;
  raisedAmount?: number;
  coverImage?: string;
  totalSupporters?: number;
  shortDescription?: string;

  creator?: {
    firstName: string;
    lastName: string;
  };
};

type PublicReview = {
  id: string;
  name?: string;
  rating?: number;
  message?: string;
  createdAt?: string;
};

const formatMoney = (n?: number) => {
  if (!n) return "₹0";
  return "₹" + n.toLocaleString("en-IN");
};

const SPONSORS = [
  {
    label: "Official Sponsor",
    name: "SportsMart",
    tagline: "Play Happy. Stay Healthy.",
    displayUrl: "sportsmart.com",
    href: "https://www.sportsmart.com",
    logo: "/sportsmart-logo.png",
    accent: "#16a34a",
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useAuth();
  const { addToast } = useToast();
  const {
    handleStartFundraiser,
    kycCheckLoading,
    isKycModalOpen,
    closeKycModal,
  } = useStartFundraiser();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Volunteer
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerCity, setVolunteerCity] = useState("");
  const [volunteerMessage, setVolunteerMessage] = useState("");
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);
  const [myVolunteer, setMyVolunteer] = useState<{ id: string; status: string } | null | undefined>(undefined);
  const [trustTab, setTrustTab] = useState<"FUNDRAISERS" | "DONORS">(
    "FUNDRAISERS",
  );
  const [hiwTab, setHiwTab] = useState<"FUNDRAISERS" | "DONORS">("FUNDRAISERS");
  const [topCampaigns, setTopCampaigns] = useState<FundraiserTop[]>([]);
  const [loadingTop, setLoadingTop] = useState(false);

  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<string[]>([]);



  const toggleExpand = (id: string) => {
    setExpandedReviews((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const loadTopCampaigns = async () => {
    try {
      setLoadingTop(true);

      const res = await FundraiserService.fundRaisedTopSix();

      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);

      setTopCampaigns(list.slice(0, 6));
    } catch (err) {
      console.error("Failed to load top campaigns", err);
    } finally {
      setLoadingTop(false);
    }
  };

  const loadPublicReviews = async () => {
    try {
      setLoadingReviews(true);

      const res = await FundraiserService.publicReviews();
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);

      setReviews(list.slice(0, 4)); // show only 4 cards
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    loadTopCampaigns();
    loadPublicReviews();
  }, []);

  // Load volunteer status for logged-in users
  useEffect(() => {
    if (!isLoaded || !user) { setMyVolunteer(null); return; }
    VolunteerService.getMyStatus()
      .then((res) => setMyVolunteer(res.data ?? null))
      .catch(() => setMyVolunteer(null));
  }, [isLoaded, user]);

  const handleVolunteerClick = () => {
    if (!user) { router.push("/login"); return; }
    if (myVolunteer?.status === "PENDING") {
      addToast("Your application is under review. Check your profile for status.", "info");
      return;
    }
    setShowVolunteerModal(true);
  };

  const handleVolunteerSubmit = async () => {
    if (!volunteerCity.trim()) { addToast("City is required", "error"); return; }
    try {
      setVolunteerSubmitting(true);
      const res = await VolunteerService.apply({
        city: volunteerCity.trim(),
        message: volunteerMessage.trim() || undefined,
      });
      setMyVolunteer(res.data?.volunteer ?? null);
      setShowVolunteerModal(false);
      setVolunteerCity("");
      setVolunteerMessage("");
      addToast("Application submitted! Check your profile for status updates.", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message || "Failed to submit application", "error");
    } finally {
      setVolunteerSubmitting(false);
    }
  };

  const handleSponsorClick = async () => {
    try { await AnalyticsService.trackSponsorClick(); } catch { /* non-blocking */ }
  };

  // Hide fixed sponsor sidebar when footer enters the viewport
  useEffect(() => {
    const checkFooter = () => {
      const footer = document.querySelector(".rp-footer");
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top;
      setSidebarVisible(footerTop > window.innerHeight);
    };
    checkFooter();
    window.addEventListener("scroll", checkFooter, { passive: true });
    return () => window.removeEventListener("scroll", checkFooter);
  }, []);

  return (
    <div className="home-page">
      {/* ── 3-COLUMN PAGE GRID: 15% | 70% | 15% ── */}
      <div className="pageOuter">

        {/* ── LEFT 15% spacer ── */}
        <div className="pageLeft" />

        {/* ── CENTER 70% ── */}
        <div className="pageCenter">

      {/* ✅ HERO SECTION */}
      <div className="home-heroWrap">
        <div className="home-heroCard home-heroBg">
          <div className="home-middleBlendFog" />
          <div className="home-fogOverlay" />

          <div className="home-heroInner">
            <div className="home-heroLeft">
              <h1 className="home-title">
                Crowdfunding for Athletes
                <br />
                with{" "}
                <span className="home-titleHighlight">
                  Trust & Transparency
                </span>
              </h1>

              <p className="home-subtitle">
                Support verified sports journeys—training,
                <br />
                tournaments, equipment, and more.
              </p>

              <div className="home-heroBtns">
                <button
                  className="home-primaryBtn"
                  onClick={() => router.push("/donate")}
                >
                  Explore campaigns
                </button>

                <button
                  className="home-secondaryBtn"
                  onClick={handleStartFundraiser}
                  disabled={kycCheckLoading}
                >
                  {kycCheckLoading ? "Checking..." : "Start a fundraiser"}
                </button>

                <button
                  className="home-secondaryBtn1"
                  onClick={() => router.push("/foundation-donate")}
                >
                  DONATE FOR FOUNDATION DEVELOPMENT
                </button>

                {/* Volunteer button — only show when no application or rejected */}
                {!myVolunteer || myVolunteer.status === "REJECTED" ? (
                  <button className="home-volunteerBtn" onClick={handleVolunteerClick}>
                    Become a Volunteer
                  </button>
                ) : null}
              </div>

            </div>

            <div className="home-heroRightSpacer" />
          </div>
        </div>
      </div>

      {/* ✅ ACTIVE CAMPAIGNS SECTION */}
      <section className="activeCampaignsSection">
        <div>
          <h2 className="activeCampaignsTitle">Active Campaigns</h2>
          <p className="activeCampaignsSubtitle">
            Real support. Real progress. Real athletes.
          </p>
        </div>

        {loadingTop ? (
          <p
            style={{ textAlign: "center", marginTop: "20px", color: "#64748b" }}
          >
            Loading campaigns...
          </p>
        ) : (
          <div className="activeCampaignsGrid">
            {topCampaigns.map((c) => {
              const raised = Number(c.raisedAmount || 0);
              const goal = Number(c.goalAmount || 0);
              const progress =
                goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

              return (
                <div className="campaignCard" key={c.id} onClick={() => router.push(`/donate/${c.id}`)}>
                  <div className="campaignImageWrap">
                    <span className="campaignVerified">Verified</span>

                    <img
                      src={
                        c.coverImageURL ? c.coverImageURL : "/background.png"
                      }
                      alt="Campaign cover"
                      className="campaignImage"
                      loading="lazy"
                    />
                  </div>

                  <div className="campaignBody">
                    <h3 className="campaignTitle">{c.title}</h3>
                    {c.shortDescription && (
                      <p className="campaignShortDesc">{c.shortDescription}</p>
                    )}
                    <p className="campaignMeta">
                      {c.sport || "Sports"} • {c.city} • {c.state}
                    </p>

                    <div className="campaignMoneyRow">
                      <span className="campaignRaised">
                        Raised: {formatMoney(raised)}
                      </span>
                      <span className="campaignGoal">
                        Goal: {formatMoney(goal)}
                      </span>
                    </div>

                    <div className="campaignProgressTrack">
                      <div
                        className="campaignProgressFill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {c.creator && (
                      <p className="created-by">
                        Created by{" "}
                        <strong>
                          {c.creator.firstName} {c.creator.lastName}
                        </strong>
                      </p>
                    )}

                    <div className="campaignFooterRow">
                      <span className="campaignSupporters">
                        {(c.totalSupporters || 0).toLocaleString("en-IN")}{" "}
                        supporters
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ShareButton fundraiserId={c.id} title={c.title} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="activeCampaignsExploreWrap">
          <button
            className="activeCampaignsExploreBtn"
            onClick={() => router.push("/donate")}
          >
            Explore campaigns →
          </button>
        </div>
      </section>

  {/* ── MOBILE ONLY — Sponsor Card (hidden on desktop via CSS) ── */}
      <div className="mobileSponsorSection">
        {SPONSORS.map((s) => (
          <div className="sbSponsorCard" key={`mobile-${s.name}`}>
            <div className="sbSponsorInner">
              <p className="sbEyebrow">{s.label}</p>
              <a
                href={s.href}
                onClick={handleSponsorClick}
                target="_blank"
                rel="noopener noreferrer"
                className="sbLogoWrap"
              >
                <img src={s.logo} alt={s.name} className="sbLogo" />
              </a>
              <div className="mobileSpRightCol">
                <p className="sbSponsorTagline">{s.tagline}</p>
                <a
                  href={s.href}
                  onClick={handleSponsorClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sbVisitBtn"
                >
                  Visit Site →
                </a>
              </div>
            </div>
            <a
              href={s.href}
              onClick={handleSponsorClick}
              target="_blank"
              rel="noopener noreferrer"
              className="mobileSportsmartPreviewLink"
            >
              <img
                src="/sportsmart-mobile.png"
                alt={`${s.name} preview`}
                className="mobileSportsmartPreviewImg"
              />
            </a>
          </div>
        ))}
      </div>

      {/* ✅ HOW IT WORKS SECTION */}
      <section className="hiwSection">
        <h2 className="hiwTitle">How It Works</h2>
        <p className="hiwSubtitle">
          Simple steps for fundraisers and donors — built specifically for
          athletes.
        </p>

        {/* Tabs */}
        <div className="hiwTabs">
          <button
            className={`hiwTabBtn ${hiwTab === "FUNDRAISERS" ? "active" : ""}`}
            onClick={() => setHiwTab("FUNDRAISERS")}
          >
            Fundraisers
          </button>

          <button
            className={`hiwTabBtn ${hiwTab === "DONORS" ? "active" : ""}`}
            onClick={() => setHiwTab("DONORS")}
          >
            Donors
          </button>
        </div>

        {/* Steps Grid */}
        <div className="hiwGrid">
          {(hiwTab === "FUNDRAISERS"
            ? [
                {
                  num: "1",
                  title: "Create your campaign",
                  desc: "Tell your story, add proofs (images/links), set a realistic goal.",
                },
                {
                  num: "2",
                  title: "Get reviewed",
                  desc: "Our team checks completeness, authenticity signals, and policy compliance before approval.",
                },
                {
                  num: "3",
                  title: "Go live & share",
                  desc: "Campaign becomes discoverable; donors support; withdrawals are tracked transparently.",
                },
              ]
            : [
                {
                  num: "1",
                  title: "Explore verified campaigns",
                  desc: "Browse athlete fundraisers and choose a cause you believe in.",
                },
                {
                  num: "2",
                  title: "Donate securely",
                  desc: "Make a contribution in seconds with a fast, safe checkout experience.",
                },
                {
                  num: "3",
                  title: "Track progress",
                  desc: "See campaign updates, utilization summary, and goal progress transparently.",
                },
              ]
          ).map((x, idx) => (
            <div className="hiwCard" key={idx}>
              <div className="hiwStepNum">{x.num}</div>
              <h3 className="hiwCardTitle">{x.title}</h3>
              <p className="hiwCardDesc">{x.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* key sources  */}

      <section className="keySourceSection">
        <h2 className="keySourceTitle">Our Key Focus Areas</h2>
        <p className="keySourceSubtitle">
          Driving impact through sports promotion, talent development, and
          community engagement.
        </p>

        <div className="keySourceGrid">
          {/* CARD 1 */}
          <div className="keySourceCard">
            <h3 className="keySourceName">Sports Promotion & Fitness</h3>
            <p className="keySourceQuote">
              “Organizing programs to promote physical fitness and health
              awareness among children, youth, and communities”
            </p>
          </div>

          {/* CARD 2 */}
          <div className="keySourceCard">
            <h3 className="keySourceName">Talent Development</h3>
            <p className="keySourceQuote">
              “Providing access to quality coaching, infrastructure, and
              development programs for emerging athletes.”
            </p>
          </div>

          {/* CARD 3 */}
          <div className="keySourceCard">
            <h3 className="keySourceName">Community Building</h3>
            <p className="keySourceQuote">
              “Organizing tournaments and events that encourage participation,
              teamwork, and active lifestyles.”
            </p>
          </div>

          {/* CARD 4 */}
          <div className="keySourceCard">
            <h3 className="keySourceName">Inclusive Support</h3>
            <p className="keySourceQuote">
              “Supporting underprivileged and deserving athletes through
              donations, grants, and sponsorship mobilization.”
            </p>
          </div>
        </div>
      </section>

      {/* ✅ TRUST SECTION (NEW) */}
      <section className="trustSection">
        <h2 className="trustTitle">Why People Trust RaiseAPlayer</h2>
        <p className="trustSubtitle">
          Built for sports crowdfunding with verification, moderation, and
          public payout transparency.
        </p>

        {/* Tabs */}
        <div className="trustTabs">
          <button
            className={`trustTabBtn ${
              trustTab === "FUNDRAISERS" ? "active" : ""
            }`}
            onClick={() => setTrustTab("FUNDRAISERS")}
          >
            For Fundraisers
          </button>

          <button
            className={`trustTabBtn ${trustTab === "DONORS" ? "active" : ""}`}
            onClick={() => setTrustTab("DONORS")}
          >
            For Donors
          </button>
        </div>

        {/* Grid */}
        <div className="trustGrid">
          {(trustTab === "FUNDRAISERS"
            ? [
                {
                  title: "Admin-reviewed campaigns",
                  desc: "Every campaign is reviewed for completeness, legitimacy, and safety before it can go live.",
                },
                {
                  title: "Transparent withdrawals",
                  desc: "Public “Fund Utilization” summary shows total withdrawals and timing without exposing sensitive data.",
                },
                {
                  title: "Verified profiles & documents",
                  desc: "Email verification + profile gating helps reduce fraud and improve donor confidence.",
                },
                {
                  title: "Dedicated support",
                  desc: "Fast help via email/WhatsApp for campaign setup, edits, and verification follow-ups (MVP support hours).",
                },
              ]
            : [
                {
                  title: "Verified fundraising journeys",
                  desc: "Donors support real athletes with verified profiles and moderated campaigns.",
                },
                {
                  title: "Clear utilization visibility",
                  desc: "Donors can view fund utilization summaries for better trust and transparency.",
                },
                {
                  title: "Safer contributions",
                  desc: "Checks and verification reduce fake campaigns and improve donation safety.",
                },
                {
                  title: "Document checks + moderation",
                  desc: "Verification + moderation checks help prevent fraud and keep campaigns genuine and safe for donors.",
                },
              ]
          ).map((x, idx) => (
            <div className="trustCard" key={idx}>
              <h3 className="trustCardTitle">{x.title}</h3>
              <p className="trustCardDesc">{x.desc}</p>
            </div>
          ))}
        </div>

      </section>

      {/* ✅ TESTIMONIALS SECTION */}
      {!loadingReviews && reviews.length > 0 && (
      <section className="testiSection">
        <h2 className="testiTitle">What Our Users Say</h2>
        <p className="testiSubtitle">
          Stories from donors, athletes, and parents who trust RaiseAPlayer.
        </p>

        <div className="testiGrid">
          {loadingReviews ? (
            <p style={{ textAlign: "center", width: "100%" }}>
              Loading reviews...
            </p>
          ) : (
            reviews.map((r) => (
              <div className="testiCard" key={r.id}>
                <div className="testiHeader">
                  <h3 className="testiName">{r.name}</h3>
                  <p className="testiStars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={
                          n <= (r.rating || 0) ? "starFilled" : "starEmpty"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </p>
                </div>

                <div className="testiMessageWrap">
                  <p
                    className={`testiQuote ${
                      expandedReviews.includes(r.id) ? "expanded" : ""
                    }`}
                  >
                    “{r.message}”
                  </p>

                  {r.message && r.message.length > 80 && (
                    <button
                      className="testiReadMore"
                      onClick={() => toggleExpand(r.id)}
                    >
                      {expandedReviews.includes(r.id)
                        ? "Read less"
                        : "Read more..."}
                    </button>
                  )}
                </div>

                <div className="reviewFooter">
                  <span>Verified user</span>
                  <span>{formatDate(r.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="testiBtnWrap">
          <button
            className="testiReadBtn"
            onClick={() => router.push("/reviews")}
          >
            Read more reviews
          </button>
        </div>
      </section>
      )}

      {/* ✅ OBJECTIVES SECTION */}
      <section className="objSection">
        <h2 className="objTitle">Our Comprehensive Objectives</h2>
        <p className="objSubtitle">
          Building a robust sports ecosystem through multi-dimensional
          initiatives and community-focused programs
        </p>

        {/* Chips */}
        <div className="objChips">
          {[
            "Community Impact",
            "Talent Development",
            "Athlete Support",
            "Partnerships",
            "Inclusion",
            "Knowledge",
          ].map((x) => (
            <span className="objChip" key={x}>
              {x}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="objGrid">
          {[
            {
              icon: "❤️",
              title: "Health & Fitness Promotion",
              desc: "Organize sports programs, fitness camps, and workshops to promote physical fitness and health awareness across all age groups.",
              tag: "COMMUNITY IMPACT",
            },
            {
              icon: "🏆",
              title: "Talent Nurturing",
              desc: "Provide access to sports infrastructure, quality coaching, and development programs to foster emerging talent.",
              tag: "TALENT DEVELOPMENT",
            },
            {
              icon: "🤝",
              title: "Athlete Support System",
              desc: "Mobilize donations, grants, and sponsorships for underprivileged athletes' training, equipment, and tournament participation.",
              tag: "ATHLETE SUPPORT",
            },
            {
              icon: "👥",
              title: "Community Engagement",
              desc: "Organize tournaments and events that encourage participation, teamwork, discipline, and active lifestyles.",
              tag: "COMMUNITY IMPACT",
            },
            {
              icon: "🏛️",
              title: "Institutional Collaboration",
              desc: "Partner with schools, colleges, and sports academies to implement structured sports programs and tournaments.",
              tag: "PARTNERSHIPS",
            },
            {
              icon: "🌱",
              title: "Holistic Development",
              desc: "Use sports as a medium for character building, mental well-being, social inclusion, and overall personal development.",
              tag: "TALENT DEVELOPMENT",
            },
            {
              icon: "🏢",
              title: "Corporate Partnerships",
              desc: "Work with CSR divisions and corporate partners to secure grants and sponsorships for grassroots sports activities.",
              tag: "PARTNERSHIPS",
            },
            {
              icon: "🎓",
              title: "Youth Leadership",
              desc: "Conduct youth development, leadership, and sports education initiatives through non-commercial training programs.",
              tag: "TALENT DEVELOPMENT",
            },
            {
              icon: "⚧️",
              title: "Gender Equality",
              desc: "Promote inclusive participation and provide special support for women athletes and marginalized groups.",
              tag: "INCLUSION",
            },
            {
              icon: "⚙️",
              title: "Capacity Building",
              desc: "Provide skill development for athletes, coaches, referees, and sports personnel to advance sports promotion.",
              tag: "TALENT DEVELOPMENT",
            },
            {
              icon: "🔍",
              title: "Research & Awareness",
              desc: "Conduct research and share insights on sports development and community health to promote public awareness.",
              tag: "KNOWLEDGE",
            },
            {
              icon: "🌍",
              title: "Global Collaboration",
              desc: "Partner with national and international sports bodies for knowledge exchange and best practices in sports development.",
              tag: "PARTNERSHIPS",
            },
          ].map((x, idx) => (
            <div className="objCard" key={idx}>
              <div className="objIconCircle">{x.icon}</div>
              <h3 className="objCardTitle">{x.title}</h3>
              <p className="objCardDesc">{x.desc}</p>
              <p className="objCardTag">{x.tag}</p>
            </div>
          ))}
        </div>
      </section>
        </div>{/* end pageCenter */}

        {/* ── RIGHT 15% — Sponsor Sidebar ── */}
        <aside className="pageRight">
          <div className={`sidebarStickyWrap${sidebarVisible ? "" : " sidebarHidden"}`}>

            {/* Dynamic sponsor cards */}
            {SPONSORS.map((s) => (
              <div className="sbSponsorCard" key={s.name}>
                <div className="sbSponsorInner">
                  <p className="sbEyebrow">{s.label}</p>
                  <a
                    href={s.href}
                    onClick={handleSponsorClick}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sbLogoWrap"
                  >
                    <img src={s.logo} alt={s.name} className="sbLogo" />
                  </a>
                  <p className="sbSponsorTagline">{s.tagline}</p>
                  <a
                    href={s.href}
                    onClick={handleSponsorClick}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sbVisitBtn"
                  >
                    Visit Site →
                  </a>

                  <a
                    href={s.href}
                    onClick={handleSponsorClick}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sbPreviewLink"
                  >
                    <img
                      src="/sportsmart-preview.png"
                      alt={`${s.name} website preview`}
                      className="sbPreviewImg"
                    />
                  </a>

                </div>
              </div>
            ))}

          </div>
        </aside>

      </div>{/* end pageOuter */}

      <PanKycModal isOpen={isKycModalOpen} onClose={closeKycModal} />

      {/* VOLUNTEER MODAL */}
      {showVolunteerModal && user && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 16,
          }}
          onClick={() => setShowVolunteerModal(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
              maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              display: "flex", flexDirection: "column",
              fontFamily: "Manrope, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 12px", borderBottom: "1px solid #f0f0f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Become a Volunteer</h3>
              <button onClick={() => setShowVolunteerModal(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280" }}>&#x2715;</button>
            </div>

            {/* Body */}
            <div style={{ padding: "16px 24px", flex: 1 }}>
              <p style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 16, lineHeight: 1.5 }}>
                Join the Navyug RaiseAPlayer Foundation as a volunteer and help raise the next generation of players.
              </p>
              {[
                { label: "Name", value: `${user.firstName} ${user.lastName}` },
                { label: "Email", value: user.email },
                { label: "Phone", value: user.phoneNumber ?? "" },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
                  <input value={value} readOnly style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb", fontSize: 14, color: "#6b7280", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  City <span style={{ color: "#e53e3e" }}>*</span>
                </label>
                <input
                  value={volunteerCity}
                  onChange={(e) => setVolunteerCity(e.target.value)}
                  placeholder="Enter your city"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Message (optional)</label>
                <textarea
                  value={volunteerMessage}
                  onChange={(e) => setVolunteerMessage(e.target.value)}
                  placeholder="Why do you want to volunteer?"
                  rows={3}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", gap: 10, padding: "12px 24px 20px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowVolunteerModal(false)}
                style={{ padding: "9px 20px", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleVolunteerSubmit}
                disabled={volunteerSubmitting}
                style={{
                  padding: "9px 22px", background: "#0f6fec", border: "none", borderRadius: 8,
                  fontSize: 14, fontWeight: 600, color: "#fff", cursor: volunteerSubmitting ? "not-allowed" : "pointer",
                  opacity: volunteerSubmitting ? 0.7 : 1,
                }}
              >
                {volunteerSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
