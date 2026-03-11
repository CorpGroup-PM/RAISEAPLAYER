"use client";

import "./AdminModal.css";

type ModalVariant = "confirm" | "error" | "success" | "warning";

interface AdminModalProps {
  open: boolean;
  variant?: ModalVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

const ICONS: Record<ModalVariant, string> = {
  confirm: "?",
  warning: "!",
  error:   "✕",
  success: "✓",
};

export default function AdminModal({
  open,
  variant = "confirm",
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel  = "Cancel",
  onConfirm,
  onClose,
}: AdminModalProps) {
  if (!open) return null;

  return (
    <div className="adm-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className={`adm-icon-wrap ${variant}`}>
          <span className="adm-icon">{ICONS[variant]}</span>
        </div>

        {/* Content */}
        <h3 className="adm-title">{title}</h3>
        <p className="adm-message">{message}</p>

        {/* Actions */}
        <div className="adm-actions">
          {variant === "confirm" || variant === "warning" ? (
            <>
              <button className="adm-btn adm-cancel" onClick={onClose}>
                {cancelLabel}
              </button>
              <button
                className={`adm-btn adm-confirm ${variant}`}
                onClick={() => { onConfirm?.(); }}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button className={`adm-btn adm-confirm ${variant}`} onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
