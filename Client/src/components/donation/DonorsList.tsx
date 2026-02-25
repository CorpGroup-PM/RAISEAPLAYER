"use client";

import { Donation } from "@/types/donation";
import "./donate-modal.css";
import { useState } from "react";
import ViewAllSupportersModal from "./ViewAllSupportersModal";


type Props = {
  donations: Donation[];
  fundraiserId: string;
  maxItems?: number;
  title?: string;
};

export default function DonorsList({
  donations,
  fundraiserId,
  maxItems = 5,
  title = "Recent Donors",
}: Props) {

  const [open, setOpen] = useState(false);

  if (!donations || donations.length === 0) {
    return (
      <div className="donors-box">
        <h3 className="donors-title">{title}</h3>
        <p className="donors-empty">No donations yet</p>
      </div>
    );
  }

  return (
    <div className="donors-box">
      <h3 className="donors-title">{title}</h3>

      <div className="donors-list">
        {donations.slice(0, maxItems).map((donation) => {
          const name = donation.isAnonymous
            ? "Anonymous Donor"
            : donation.donor
              ? `${donation.donor.firstName} ${donation.donor.lastName ?? ""}`
              : "RaiseAPlayer Donor";

          const initial = name.charAt(0).toUpperCase();

          return (
            <div className="donor-card" key={donation.id}>
              <div className="donor-avatar">{initial}</div>

              <div className="donor-info">
                <div className="donor-name">{name}</div>
                <div className="donor-date">
                  {new Date(donation.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="donor-amount">
                ₹{donation.donationAmount.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {donations.length >= maxItems && (
  <div className="view-all-container">
    <button
      className="view-all-btn"
      onClick={() => setOpen(true)}
    >
      View all supporters
    </button>
  </div>
)}

 <ViewAllSupportersModal
        fundraiserId={fundraiserId}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
