'use client';

import { useState } from 'react';
import { z } from 'zod';
import SlideLayout from '../SlideLayout';

const phoneRegex = /^[6-9][0-9]{9}$/;

const beneficiarySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),

  age: z.coerce
    .number()
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Age is required',
    }),

  // city: z
  //   .string()
  //   .trim()
  //   .min(1, 'City is required'),

  // state: z
  //   .string()
  //   .trim()
  //   .min(1, 'State is required'),

  relationshipToCreator: z
    .string()
    .trim()
    .min(1, 'Relationship is required'),

  // optional contact details — valid format required only if a value is entered
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) => !val || phoneRegex.test(val),
      'Enter a valid 10-digit Indian phone number'
    ),

  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      'Enter a valid email address'
    ),
});

export default function Slide2Beneficiary({
  draft,
  updateDraft,
  next,
  back,
}: any) {
  const b = draft.beneficiaryOther;

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* -------------------- Update helper -------------------- */
  const update = (key: string, value: any) => {
    updateDraft({
      beneficiaryOther: {
        ...b,
        [key]: value,
      },
    });

    // Clear error as user types
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  /* -------------------- Next handler -------------------- */
  const handleNext = () => {
    const result = beneficiarySchema.safeParse(b);

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
      title="Beneficiary Details"
      userStory="As a creator, I want to add details of the person I’m raising funds for."
    >
      {/* Full Name */}
      <input
        className="wizard-input"
        placeholder="Full Name"
        value={b.fullName}
        onChange={(e) => update('fullName', e.target.value)}
      />
      {errors.fullName && <p className="error-text">{errors.fullName}</p>}

      {/* Age */}
      <input
        className="wizard-input"
        type="number"
        placeholder="Age"
        value={b.age}
        onChange={(e) => update('age', e.target.value)}
      />
      {errors.age && <p className="error-text">{errors.age}</p>}

      {/* City */}
      {/* <input
        className="wizard-input"
        placeholder="City"
        value={b.city}
        onChange={(e) => update('city', e.target.value)}
      />
      {errors.city && <p className="error-text">{errors.city}</p>}

      
      <input
        className="wizard-input"
        placeholder="State"
        value={b.state}
        onChange={(e) => update('state', e.target.value)}
      />
      {errors.state && <p className="error-text">{errors.state}</p>} */}

      {/* Relationship */}
      <input
        className="wizard-input"
        placeholder="Relationship"
        value={b.relationshipToCreator}
        onChange={(e) =>
          update('relationshipToCreator', e.target.value)
        }
      />
      {errors.relationshipToCreator && (
        <p className="error-text">{errors.relationshipToCreator}</p>
      )}

       {/* OPTIONAL CONTACT DETAILS */}

      <div className={`phone-input-wrapper${errors.phoneNumber ? ' input-error' : ''}`}>
        <span className="phone-prefix">+91</span>
        <input
          className="phone-input-field"
          type="tel"
          inputMode="numeric"
          placeholder="Phone Number (optional)"
          maxLength={10}
          value={b.phoneNumber || ''}
          onChange={(e) => update('phoneNumber', e.target.value.replace(/[^0-9]/g, ''))}
        />
      </div>
      {errors.phoneNumber && (
        <p className="error-text">{errors.phoneNumber}</p>
      )}

      <input
        className={`wizard-input${errors.email ? ' input-error' : ''}`}
        type="email"
        placeholder="Email (optional)"
        value={b.email || ''}
        onChange={(e) => update('email', e.target.value)}
      />
      {errors.email && (
        <p className="error-text">{errors.email}</p>
      )}


      {/* Footer */}
      <div className="wizard-footer">
        <button className="btn-secondary" onClick={back}>
          Previous
        </button>
        <button className="btn-primary" onClick={handleNext}>
          Next
        </button>
      </div>
    </SlideLayout>
  );
}
