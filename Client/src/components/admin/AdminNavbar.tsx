"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import "../UserNavbar/Navbar.css";

export default function AdminNavbar() {
  const { user, logout, isLoaded } = useAuth();
  const pathname = usePathname();

  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

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
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  if (!isLoaded) return null;

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav className="rp-navbar">
        {/* LOGO */}
        <div className="nav-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Raise A Player Logo" />
          </div>

          <span className="logo-text">
            <img src="/logo3.png" alt="Raise A Player Logo" />
          </span>
        </div>

        {/* DESKTOP ADMIN MENU */}
        <ul className="rp-menu">
          <li
            className={pathname.startsWith("/admin/analytics") ? "active" : ""}
           
          >
            <Link href="/admin/analytics">Dashboard</Link>
          </li>

          <li className={pathname.startsWith("/admin/users") ? "active" : ""}>
            <Link href="/admin/users">Users</Link>
          </li>

          <li
            className={pathname.startsWith("/admin/campaigns") ? "active" : ""}
          >
            <Link href="/admin/campaigns">Campaigns</Link>
          </li>

          <li
            className={pathname.startsWith("/admin/donations") ? "active" : ""}
          >
            <Link href="/admin/donations">Donations</Link>
          </li>

          <li className={pathname.startsWith("/admin/Payouts") ? "active" : ""}>
            <Link href="/admin/Payouts">Payouts</Link>
          </li>

          <li
            className={
              pathname.startsWith("/admin/PlatformTips") ? "active" : ""
            }
          >
            <Link href="/admin/PlatformTips">Platform Tips</Link>
          </li>
          <li
            className={pathname.startsWith("/admin/Review Verification") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/ReviewVerification">Review Verification</Link>
          </li>
        </ul>

        {/* RIGHT SIDE */}
        <div className="rp-right">
          {/* PROFILE (DESKTOP) */}
          <div ref={profileRef} className="desktop-only">
            <div
              className="rp-profile-icon"
              onClick={() => setProfileOpen((p) => !p)}
            >
              <img
                src={user?.profilePicture || "/icon.png"}
                alt="Profile"
                className="rp-avatar"
              />
            </div>

            {profileOpen && (
              <div className="rp-dropdown">
                <p className="rp-dd-user">
                  {user?.firstName} {user?.lastName}
                </p>


                <button
                  className="rp-dd-btn rp-logout"
                  onClick={async () => {
                    await logout();
                    setProfileOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* MOBILE HAMBURGER */}
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

      {/* ================= MOBILE DRAWER ================= */}
      <aside className={`rp-mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="rp-mobile-header">
          <button className="rp-back" onClick={() => setMenuOpen(false)}>
            ←
          </button>
          <span className="rp-mobile-title">Admin Menu</span>
        </div>

        <ul className="rp-mobile-links">

          <li
            className={pathname.startsWith("/admin/analytics") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/analytics">Dashboard</Link>
          </li>
          <li
            className={pathname.startsWith("/admin/users") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/users">Users</Link>
          </li>

          <li
            className={pathname.startsWith("/admin/campaigns") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/campaigns">Campaigns</Link>
          </li>

          <li
            className={pathname.startsWith("/admin/donations") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/donations">Donations</Link>
          </li>

          <li
            className={pathname.startsWith("/admin/Payouts") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/Payouts">Payouts</Link>
          </li>

          <li
            className={pathname.startsWith("/admin/PlatformTips") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/PlatformTips">PlatformTips</Link>
          </li>

           <li
            className={pathname.startsWith("/admin/Review Verification") ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            <Link href="/admin/ReviewVerification">Review Verification</Link>
          </li>
        </ul>

        <div className="rp-mobile-bottom">
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
      </aside>

      {menuOpen && (
        <div className="rp-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}
