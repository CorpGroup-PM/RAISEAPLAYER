'use client';
import SlideLayout from '../SlideLayout';
import { z } from 'zod';
import { useState } from 'react';

const storySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Campaign title is required')
    .min(5, 'Title must be at least 5 characters'),

  shortDescription: z
    .string()
    .trim()
    .min(1, 'Short description is required')
    .max(220, 'Maximum 220 characters allowed'),

  story: z
    .string()
    .trim()
    .min(1, 'Story is required')
    .min(50, 'Story must be at least 50 characters'),
});

export default function Slide3Story({
  draft,
  updateDraft,
  next,
  back,
}: any) {

  const [errors, setErrors] = useState<Record<string, string>>({});

  const userStory =
    draft.campaignFor === 'SELF'
      ? 'As a Player, I want to explain my journey and why I need support.'
      : 'As a creator, I want to show his journey and why he needs support.';

       const handleNext = () => {
    const result = storySchema.safeParse({
      title: draft.title,
      shortDescription: draft.shortDescription,
      story: draft.story,
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

   const updateField = (key: string, value: string) => {
    updateDraft({ [key]: value });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  
  return (
    <SlideLayout title="Campaign Story" userStory={userStory}>
      {/* Title */}
      <input
        className="wizard-input"
        placeholder="Campaign Title"
        value={draft.title}
        onChange={(e) => updateField('title', e.target.value)}
      />
      {errors.title && <p className="error-text">{errors.title}</p>}

      {/* Short Description */}
      <textarea
        className="wizard-input"
        maxLength={220}
        placeholder="Short description (max 220 characters)"
        value={draft.shortDescription}
        onChange={(e) =>
          updateField('shortDescription', e.target.value)
        }
      />
      {errors.shortDescription && (
        <p className="error-text">{errors.shortDescription}</p>
      )}

      {/* Story */}
      <textarea
        className="wizard-input"
        rows={5}
        placeholder="Full story"
        value={draft.story}
        onChange={(e) => updateField('story', e.target.value)}
      />
      {errors.story && <p className="error-text">{errors.story}</p>}

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
