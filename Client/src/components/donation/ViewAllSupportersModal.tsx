"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isOpen || !fundraiserId) return;

    const fetchSupporters = async () => {
      try {
        setLoading(true);

        const res = await SupportersService.getSupporters(fundraiserId);

        console.log("Supporters response:", res.data);

        setDonations(res.data?.donations || []);

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

  return (
    <div className="donate-overlay">
      <div className="donate-modal">
        <div className="donate-modal-scroll">
          {/* HEADER */}
          <div className="donate-header">
            <h3>All Supporters</h3>
            <button onClick={onClose}>×</button>
          </div>

          {/* CONTENT */}
          {loading ? (
            <p>Loading supporters...</p>
          ) : donations?.length === 0 ? (
            <p>No supporters yet</p>
          ) : (
            <div className="donors-list scrollable">
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
                        {new Date(d.createdAt).toLocaleDateString("en-IN", {
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
    </div>
  );
}
