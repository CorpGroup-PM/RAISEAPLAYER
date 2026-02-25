// src/components/toast/ToastContainer.tsx
"use client";

import { Toast } from "./ToastContext";
import "./toast.css";

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
