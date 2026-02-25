// src/components/forms/LoadingButton.tsx
import { ReactNode } from "react";
import clsx from "clsx";
import "./form.css";

interface LoadingButtonProps {
  children: ReactNode;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const LoadingButton = ({
  children,
  loading,
  type = "button",
  disabled,
}: LoadingButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx("form-button", {
        "button-disabled": disabled || loading,
      })}
    >
      {loading ? (
        <div className="loading-spinner" aria-label="loading">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
