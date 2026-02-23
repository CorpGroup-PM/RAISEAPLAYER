// src/components/forms/TextareaField.tsx
import { UseFormRegisterReturn } from "react-hook-form";
import clsx from "clsx";
import "./form.css";

interface TextareaFieldProps {
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: string;
  rows?: number;
}

export const TextareaField = ({
  placeholder,
  register,
  error,
  rows = 4,
}: TextareaFieldProps) => {
  return (
    <textarea
      placeholder={placeholder}
      {...register}
      rows={rows}
      className={clsx("form-textarea", { "input-error": error })}
    />
  );
};
