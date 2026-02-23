// src/lib/toast-manager.ts
type ToastType = "success" | "error" | "info";

// Temporary placeholder until the ToastProvider mounts
let _showToast: (message: string, type?: ToastType) => void = () => {};

export const toastManager = {
  show: (message: string, type: ToastType = "info") =>
    _showToast(message, type),
  bind: (fn: (message: string, type?: ToastType) => void) => {
    _showToast = fn;
  },
};
