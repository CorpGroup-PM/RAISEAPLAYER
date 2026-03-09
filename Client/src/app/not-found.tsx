"use client";

import { useRouter } from "next/navigation";
import { Home, Heart } from "lucide-react";
import "./not-found.css";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="nf-container">
      {/* HERO IMAGE */}
      <div className="nf-hero" />

      {/* CONTENT */}
      <div className="nf-content">
        <h1 className="nf-title">404 – Page Not found</h1>

        <p className="nf-text">
          The page you’re looking for doesn’t exist or may have been moved.
          Let’s get you back to supporting athletes and campaigns
        </p>

        <div className="nf-buttons">
          <button className="nf-btn primary" onClick={() => router.push("/")}>
            <Home size={18} />
            Return to Homepage
          </button>

          <button
            className="nf-btn secondary"
            onClick={() => router.push("/donate")}
          >
            <Heart size={18} />
            Support Our Athletes
          </button>
        </div>
      </div>
    </div>
  );
}
