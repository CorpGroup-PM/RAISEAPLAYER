"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SupportersService } from "@/services/supporters.service";
import { Donation } from "@/types/donation";
import "./donate-modal.css";

type Props = {
  fundraiserId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function ViewAllSupportersModal({
  fundraiserId,
  isOpen,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<Donation[]>([]);

  // Lock page scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !fundraiserId) return;

    const fetchSupporters = async () => {
      try {
        setLoading(true);
        const res = await SupportersService.getSupporters(fundraiserId);
        setDonations(res.data?.supporters || []);
      } catch (err) {
        console.error("Failed to fetch supporters", err);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSupporters();
  }, [isOpen, fundraiserId]);

  if (!isOpen) return null;

  return createPortal(
    <div className="donate-overlay" onClick={onClose}>
      <div className="donate-modal supporters-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER — fixed */}
        <div className="supporters-header">
          <h3>All Supporters</h3>
          <button onClick={onClose}>×</button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="supporters-scroll">
          {loading ? (
            <p style={{ padding: "16px" }}>Loading supporters...</p>
          ) : donations?.length === 0 ? (
            <p style={{ padding: "16px" }}>No supporters yet</p>
          ) : (
            <div className="donors-list">
              {donations.map((d) => {
                const name =
                  d.donor?.firstName === "Anonymous"
                    ? "Anonymous Donor"
                    : d.donor
                      ? `${d.donor.firstName} ${d.donor.lastName ?? ""}`
                      : "RaiseAPlayer Donor";

                const initial = name.charAt(0).toUpperCase();

                return (
                  <div key={d.id} className="donor-card">
                    <div className="donor-avatar">{initial}</div>

                    <div className="donor-info">
                      <div className="donor-name">{name}</div>
                      <div className="donor-date">
                        ₹{d.donationAmount.toLocaleString()} •{" "}
                        {new Date(d.donatedAt ?? d.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

