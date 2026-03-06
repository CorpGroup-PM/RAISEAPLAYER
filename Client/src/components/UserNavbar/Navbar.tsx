"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import "./Navbar.css";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useStartFundraiser } from "@/hooks/useStartFundraiser";
import PanKycModal from "@/components/Pan-Kyc-Modal/PanKycModal";

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoaded } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const {
    handleStartFundraiser,
    kycCheckLoading,
    isKycModalOpen,
    closeKycModal,
  } = useStartFundraiser();

  const handleLogout = () => {
    logout(); // clear auth
    setProfileOpen(false);
    setMenuOpen(false);

    router.replace("/"); // ✅ redirect to home
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileOpen &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  // Prevent hydration mismatch
  if (!isLoaded) return null;

  return (
    <>
      <nav className="rp-navbar">
        {/* Logo */}
        <div className="nav-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Raise A Player Logo" />
          </div>

          <span className="logo-text">
            <img src="/logo3.png" alt="Raise A Player Logo" />
          </span>
        </div>

        {/* Desktop Menu */}
        <ul className="rp-menu">
          <li className={pathname === "/" ? "active" : ""}>
            <Link href="/">Home</Link>
          </li>

          <li className={pathname === "/donate" ? "active" : ""}>
            <Link href="/donate">Donate</Link>
          </li>

          <li className={pathname.startsWith("/resources") ? "active" : ""}>
            <Link href="/resources">Resources</Link>
          </li>

          <li className={pathname === "/contact" ? "active" : ""}>
            <Link href="/contact">Contact us</Link>
          </li>
        </ul>

        <div className="rp-right">
          {/* Start Fundraiser */}
          <button
            className="rp-start-btn desktop-only"
            onClick={handleStartFundraiser}
            disabled={kycCheckLoading}
          >
            {kycCheckLoading ? "Checking..." : "Start a fundraiser"}
          </button>

          <div ref={profileRef} className="desktop-only">
            {/* Profile Icon */}
            <div
              className="rp-profile-icon"
              onClick={() => setProfileOpen((p) => !p)}
            >
              {isAuthenticated && user ? (
                <img
                  src={user.profilePicture || "/icon.png"}
                  alt="Profile"
                  className="rp-avatar"
                />
              ) : (
                <img src="/icon.png" alt="Guest" className="rp-avatar" />
              )}
            </div>

            {/* Desktop Dropdown */}
            {profileOpen && (
              <div className="rp-dropdown">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login">
                      <button
                        className="rp-dd-btn"
                        onClick={() => setProfileOpen(false)}
                      >
                        Login
                      </button>
                    </Link>

                    <Link href="/register">
                      <button
                        className="rp-dd-btn"
                        onClick={() => setProfileOpen(false)}
                      >
                        Register
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="rp-dd-user">
                      {user?.firstName} {user?.lastName}
                    </p>

                    <Link href="/dashboard">
                      <button
                        className="rp-dd-btn"
                        onClick={() => setProfileOpen(false)}
                      >
                        My dashboard
                      </button>
                    </Link>

                    <Link href="/my-donations">
                      <button
                        className="rp-dd-btn"
                        onClick={() => setProfileOpen(false)}
                      >
                        My donations
                      </button>
                    </Link>

                    <Link href="/profile">
                      <button
                        className="rp-dd-btn"
                        onClick={() => setProfileOpen(false)}
                      >
                        My profile
                      </button>
                    </Link>

                    <button
                      className="rp-dd-btn rp-logout"
                      onClick={async () => {
                        await logout();
                        setProfileOpen(false);
                      }}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="rp-hamburger mobile-only"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <aside className={`rp-mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="rp-mobile-header">
          <button className="rp-back" onClick={() => setMenuOpen(false)}>
            ←
          </button>
          <span className="rp-mobile-title">Menu</span>
        </div>

        <ul className="rp-mobile-links">
          <li
            className={pathname === "/" ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/">Home</Link>
          </li>

          <li
            className={pathname.startsWith("/donate") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/donate">Donate</Link>
          </li>
          <li
            className={pathname.startsWith("/resources") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/resources">Resources</Link>
          </li>
          <li
            className={pathname.startsWith("/contact") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/contact">Contact us</Link>
          </li>
        </ul>

        <div className="rp-mobile-bottom">
          {!isAuthenticated ? (
            <div className="rp-bottom-auth-buttons">
              <Link href="/login">
                <button
                  className="rp-mobile-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </button>
              </Link>

              <Link href="/register">
                <button
                  className="rp-mobile-secondary"
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </button>
              </Link>
            </div>
          ) : (
            <div className="rp-bottom-auth-buttons">
              <div className="rp-mobile-user">
                <img src={user?.profilePicture || "/icon.png"} alt="Profile" />
                <div>
                  <p className="rp-mobile-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="rp-mobile-user-email">{user?.email}</p>
                </div>
              </div>

              <Link href="/dashboard">
                <button
                  className="rp-mobile-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  My Dashboard
                </button>
              </Link>

              <Link href="/my-donations">
                <button
                  className="rp-mobile-secondary"
                  onClick={() => setMenuOpen(false)}
                >
                  My Donations
                </button>
              </Link>

              <Link href="/profile">
                <button
                  className="rp-mobile-secondary"
                  onClick={() => setMenuOpen(false)}
                >
                  My Profile
                </button>
              </Link>

              <button
                className="rp-mobile-logout"
                onClick={async () => {
                  await logout();
                  setMenuOpen(false);
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {menuOpen && (
        <div className="rp-overlay" onClick={() => setMenuOpen(false)} />
      )}

      <PanKycModal isOpen={isKycModalOpen} onClose={closeKycModal} />
    </>
  );
}
