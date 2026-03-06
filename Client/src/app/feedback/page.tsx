"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FundraiserReviewService } from "@/services/fundraiser-review.service";
import AlertModal from "@/components/ui/AlertModal";

export default function FundraiserReviewPage() {
  const { fundraiserId } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState<"error" | "success">("error");
  const [redirectOnClose, setRedirectOnClose] = useState(false);

  const submitReview = async () => {
    console.log({
    name,
    rating,
    message: feedback,
  });
    if (!name.trim()) {
      setAlertType("error");
      setAlertMsg("Please enter your name");
      return;
    }

    if (!feedback.trim()) {
      setAlertType("error");
      setAlertMsg("Please enter feedback");
      return;
    }

    try {
      setLoading(true);

      await FundraiserReviewService.create(
        {
          name,
          rating,
          message: feedback,
        }
      );

      setAlertType("success");
      setAlertMsg("Review submitted successfully");
      setRedirectOnClose(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <h2>Campaign Completed 🎉</h2>
        <p style={{ color: "#6b7280" }}>
          Share your experience to inspire other athletes
        </p>
      </div>

      {/* NAME CARD */}
      <div style={card}>
        <label style={label}>Your Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          style={input}
        />
      </div>

      {/* FEEDBACK CARD */}
      <div style={card}>
        <label style={label}>Your Experience</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={5}
          placeholder="Tell us about your journey..."
          style={textarea}
        />
      </div>

      {/* RATING CARD */}
      <div style={card}>
        <label style={label}>Rate Your Experience</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[1,2,3,4,5].map((n) => (
            <span
              key={n}
              onClick={() => setRating(n)}
              style={{
                fontSize: 28,
                cursor: "pointer",
                color: n <= rating ? "#f59e0b" : "#d1d5db",
                transition: "0.2s",
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* SUBMIT */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={submitReview}
          disabled={loading}
          style={submitBtn}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>

      {alertMsg && (
        <AlertModal
          message={alertMsg}
          type={alertType}
          onClose={() => {
            setAlertMsg("");
            if (redirectOnClose) router.push("/dashboard");
          }}
        />
      )}
    </div>
  );
}

/* ===== STYLES ===== */

const container = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "40px 20px",
};

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 20,
  marginBottom: 20,
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
};

const label = {
  display: "block",
  fontWeight: 600,
  marginBottom: 8,
  color: "#111827",
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #d1d5db",
};

const textarea = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #d1d5db",
};

const submitBtn = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "12px 22px",
  borderRadius: 10,
  fontWeight: 600,
  cursor: "pointer",
};
