"use client";
import { createPortal } from "react-dom";
import "./alert-modal.css";

type AlertModalProps = {
  message: string;
  type?: "error" | "success" | "warning";
  onClose: () => void;
};

const icons = {
  error: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 12 15 16 10" />
    </svg>
  ),
  warning: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const config = {
  error: { bg: "#fef2f2", title: "Oops!", btnClass: "alert-modal-btn-error" },
  success: { bg: "#f0fdf4", title: "Success!", btnClass: "alert-modal-btn-success" },
  warning: { bg: "#fffbeb", title: "Warning", btnClass: "alert-modal-btn-warning" },
};

export default function AlertModal({ message, type = "error", onClose }: AlertModalProps) {
  const { bg, title, btnClass } = config[type];

  return createPortal(
    <div className="alert-modal-backdrop" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-modal-icon" style={{ background: bg }}>
          {icons[type]}
        </div>
        <h3 className="alert-modal-title">{title}</h3>
        <p className="alert-modal-msg">{message}</p>
        <button className={`alert-modal-btn ${btnClass}`} onClick={onClose}>
          OK
        </button>
      </div>
    </div>,
    document.body
  );
}
