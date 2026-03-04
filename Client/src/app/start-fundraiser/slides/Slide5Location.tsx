'use client';
import SlideLayout from '../SlideLayout';
import { z } from 'zod';
import { useState } from 'react';

const locationSchema = z.object({
  city: z
    .string()
    .trim()
    .min(1, 'Enter the City name'),

  state: z
    .string()
    .trim()
    .min(1, 'Enter the State name'),

});

const INDIA_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Puducherry",
];

export default function Slide5Location({ draft, updateDraft, next, back }: any) {

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* -------------------- Update helper -------------------- */
  const updateField = (key: 'city' | 'state', value: string) => {
    updateDraft({
      location: {
        ...draft.location,
        [key]: value,
      },
    });

    // Clear error while typing
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleNext = () => {
    const result = locationSchema.safeParse({
      city: draft.location.city,
      state: draft.location.state,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });

      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    next();
  };

  return (
    <SlideLayout
      title="Location Details"
      userStory="As a donor, I want to know where the player is from."
    >
      <input className="wizard-input" value="India" disabled />

      <select
        className="wizard-input"
        value={draft.location.state || ""}
        onChange={(e) => updateField("state", e.target.value)}
      >
        <option value="">Select State</option>
        {INDIA_STATES.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}

      </select>
      {errors.state && <p className="error-text">{errors.state}</p>}
      
      <input
        className="wizard-input"
        placeholder="City"
        value={draft.location.city}
        onChange={(e) => updateField('city', e.target.value)}
      />
      {errors.city && <p className="error-text">{errors.city}</p>}

      <div className="wizard-footer">
        <button className="btn-secondary" onClick={back}>Previous</button>
        <button className="btn-primary" onClick={handleNext}>Next</button>
      </div>
    </SlideLayout>
  );
}
