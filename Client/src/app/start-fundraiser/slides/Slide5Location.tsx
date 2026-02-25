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

      <input
        className="wizard-input"
        placeholder="City"
        value={draft.location.city}
         onChange={(e) => updateField('city', e.target.value)}
      />
      {errors.city && <p className="error-text">{errors.city}</p>}

      <input
        className="wizard-input"
        placeholder="State"
        value={draft.location.state}
        onChange={e =>   updateField('state', e.target.value)}
      />
      {errors.state && <p className="error-text">{errors.state}</p>}

      <div className="wizard-footer">
        <button className="btn-secondary" onClick={back}>Previous</button>
        <button className="btn-primary" onClick={handleNext}>Next</button>
      </div>
    </SlideLayout>
  );
}
