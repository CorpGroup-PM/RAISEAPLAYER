// src/components/forms/InputField.tsx
import { UseFormRegisterReturn } from "react-hook-form";
import clsx from "clsx";
import "./form.css";

interface InputFieldProps {
  type?: string;
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: string;
}

export const InputField = ({
  type = "text",
  placeholder,
  register,
  error,
}: InputFieldProps) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      {...register}
      className={clsx("form-input", { "input-error": error })}
    />
  );
};
