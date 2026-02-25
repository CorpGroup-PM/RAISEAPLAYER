// src/components/forms/Button.tsx
import { ReactNode } from "react";
import clsx from "clsx";
import "./form.css";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export const Button = ({
  children,
  onClick,
  type = "button",
  disabled,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx("form-button", { "button-disabled": disabled })}
    >
      {children}
    </button>
  );
};
