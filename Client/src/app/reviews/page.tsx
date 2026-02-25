"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FundraiserService } from "@/services/fundraiser.service";
import "./reviews.css";

type PublicReview = {
    id: string;
    name?: string;
    rating?: number;
    message?: string;
    createdAt?: string;
};

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<PublicReview[]>([]);
    const [expandedReviews, setExpandedReviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const loadReviews = async () => {
  try {
    setLoading(true);
    const res = await FundraiserService.publicReviews();

    const list = Array.isArray(res.data)
      ? res.data
      : res.data?.data ?? [];

    const sorted = [...list].sort((a: PublicReview, b: PublicReview) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da; // ✅ newest first
    });

    setReviews(sorted);
  } catch (err) {
    console.error("Failed to load reviews", err);
  } finally {
    setLoading(false);
  }
};
    const toggleExpand = (id: string) => {
        setExpandedReviews(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };


    useEffect(() => {
        loadReviews();
    }, []);

    const formatDate = (date?: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="reviewsPage">

            <div className="reviewsHeader">
                <button
                    className="back-btn"
                    onClick={() => router.back()}
                >
                    ← Back
                </button>


                <div className="reviewsTitleWrap">
                    <h1>All Reviews</h1>
                    <p>Real feedback from our supporters and athletes.</p>
                </div>
            </div>


            {loading ? (
                <p className="reviewsLoading">Loading reviews...</p>
            ) : (
                <div className="reviewsGrid">
                    {reviews.map((r) => (
                        <div className="reviewCard" key={r.id}>
                            <div className="reviewHeader">
                                <h3>{r.name || "User"}</h3>
                                <div className="reviewStars">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <span
                                            key={n}
                                            className={
                                                n <= (r.rating || 0)
                                                    ? "starFilled"
                                                    : "starEmpty"
                                            }
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="reviewMessageWrap">
                                <p
                                    className={`reviewMessage ${expandedReviews.includes(r.id) ? "expanded" : ""
                                        }`}
                                >
                                    “{r.message}”
                                </p>

                                {r.message && r.message.length > 80 && (
                                    <button
                                        className="reviewReadMore"
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
                    ))}
                </div>
            )}
        </div>
    );
}
