// src/components/forms/SelectField.tsx
import { UseFormRegisterReturn } from "react-hook-form";
import clsx from "clsx";
import "./form.css";

interface SelectFieldProps {
  options: { value: string; label: string }[];
  register: UseFormRegisterReturn;
  error?: string;
}

export const SelectField = ({ options, register, error }: SelectFieldProps) => {
  return (
    <select
      {...register}
      className={clsx("form-select", { "input-error": error })}
    >
      <option value="">Select an option</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
