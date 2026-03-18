'use client';

import { useState } from 'react';
import { z } from 'zod';
import SlideLayout from '../SlideLayout';
import { FundraiserService } from '@/services/fundraiser.service';


const goalAmountSchema = z.object({
  goalAmount: z.coerce
    .number()
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Goal Amount is required',
    }),
});

export default function Slide6Review({
  draft,
  updateDraft,
  back,
}: any) {
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
  if (isSubmitting) return;
  // 1️⃣ Validate goal amount
  const result = goalAmountSchema.safeParse({
    goalAmount: draft.goalAmount,
  });

  if (!result.success) {
    setError(result.error.issues[0].message);
    return;
  }

  setError('');

  // 2️⃣ BUILD FINAL PAYLOAD (FLAT – BACKEND EXPECTED)
  const payload: any = {
  campaignFor: draft.campaignFor,

  title: draft.title,
  shortDescription: draft.shortDescription,
  story: draft.story,

  sport: draft.sport,
  discipline: draft.discipline || null,
  level: draft.level,
  skills: draft.skills || [],

  city: draft.location.city,
  state: draft.location.state,
  country: draft.location.country ?? "India",

  goalAmount: Number(draft.goalAmount),
};

      if (draft.campaignFor === "OTHER") {
  payload.beneficiaryOther = {
    name: draft.beneficiaryOther.fullName,
    relation: draft.beneficiaryOther.relationshipToCreator,
    age: Number(draft.beneficiaryOther.age),
    phoneNumber: draft.beneficiaryOther.phoneNumber || null,
    email: draft.beneficiaryOther.email || null,
  };
}
console.log("Payload story:", payload.story);


 // console.log('FINAL PAYLOAD SENT TO BACKEND:', payload);

  // 3️⃣ API CALL
  setIsSubmitting(true);
  try {
    await FundraiserService.createFundraiser(payload);
    window.location.href = '/dashboard';
  } catch (err: any) {
    console.error('Create fundraiser failed', err);
    setIsSubmitting(false);
  }
};



  return (
    <SlideLayout
      title="Review & Funding Goal"
      userStory="As a creator, I want to review everything and set my funding goal before submitting."
    >
      <input
        className="wizard-input"
        type="number"
        placeholder="Goal Amount (₹)"
        value={draft.goalAmount}
        onChange={(e) =>
          updateDraft({ goalAmount: e.target.value })
        }
      />

      {error && <p className="error-text">{error}</p>}

      <div className="wizard-footer">
        <button className="btn-secondary" onClick={back}>
          Previous
        </button>
        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </SlideLayout>
  );
}
