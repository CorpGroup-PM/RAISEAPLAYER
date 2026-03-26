"use client";

import { useRouter } from "next/navigation";
import "./pan-kyc-modal.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PanKycModal({ isOpen, onClose }: Props) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleAddPan = () => {
    onClose();
    router.push("/profile");
  };

  return (
    <div className="kyc-overlay" onClick={onClose}>
      <div className="kyc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="kyc-header">
          <h2>KYC required</h2>
          <button className="kyc-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="kyc-body">
          <p>
            To create a fundraiser, you must complete your KYC — both PAN and
            Aadhaar details (including front &amp; back images) are required.
          </p>
        </div>

        <div className="kyc-footer">
          <button className="kyc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="kyc-btn-primary" onClick={handleAddPan}>
            Complete KYC
          </button>
        </div>
      </div>
    </div>
  );
}
