'use client';
import SlideLayout from '../SlideLayout';
import { z } from 'zod';
import { useState } from 'react';

const sportSchema = z.object({
  sport: z
    .string()
    .min(1, 'Enter a sport'),

  level: z
    .string()
    .min(1, 'Select the level'),

  discipline: z.string().optional(),

  skills: z
    .array(z.string().min(1))
    .min(1, 'Add at least one skill'),
});

export default function Slide4Sport({ draft, updateDraft, next, back }: any) {

  const [skillInput, setSkillInput] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* -------------------- Update helper -------------------- */
  const updateField = (key: string, value: string) => {
    const cleaned =
      key === 'sport'
        ? value.trim().replace(/\b\w/g, c => c.toUpperCase())
        : value;

    updateDraft({ [key]: cleaned });
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };


  /* -------------------- Add skill helper -------------------- */
  const addSkill = () => {
    if (!skillInput.trim()) return;

    const newSkill = skillInput
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const existing = (draft.skills || []).map((s: string) => s.toLowerCase());

    if (existing.includes(newSkill.toLowerCase())) {
      setSkillInput('');
      return;
    }

    updateDraft({
      skills: [...(draft.skills || []), newSkill],
    });

    setSkillInput('');
    setErrors((prev) => ({ ...prev, skills: '' }));
  };

  /* -------------------- Next handler -------------------- */
  const handleNext = () => {
    // Auto-add any pending skill text before validating
    let skills = draft.skills || [];
    if (skillInput.trim()) {
      const newSkill = skillInput
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const existing = skills.map((s: string) => s.toLowerCase());
      if (!existing.includes(newSkill.toLowerCase())) {
        skills = [...skills, newSkill];
        updateDraft({ skills });
      }
      setSkillInput('');
    }

    const result = sportSchema.safeParse({
      sport: draft.sport,
      level: draft.level,
      discipline: draft.discipline,
      skills,
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
      title="Sport & Skills"
      userStory="As a supporter, I want to understand the player’s sport and skills."
    >
      <input
        className="wizard-input"
        placeholder="Enter sport"
        value={draft.sport || ''}
        onChange={(e) => updateField('sport', e.target.value)}
      />
      {errors.sport && <p className="error-text">{errors.sport}</p>}

      <input
        className="wizard-input"
        placeholder="Discipline (optional)"
        onChange={e => updateDraft({ discipline: e.target.value })}
      />

      <select
        className="wizard-input"
        value={draft.level}
        onChange={(e) => updateField('level', e.target.value)}
      >
        <option value="">Select Level</option>
        <option value="Beginner">Beginner</option>
        <option value="District">District</option>
        <option value="State">State</option>
        <option value="National">National</option>
        <option value="Professional">Professional</option>
      </select>
      {errors.level && <p className="error-text">{errors.level}</p>}

      <div className="skill-input-wrapper" style={{ position: 'relative' }}>
        <input
          className="wizard-input"
          style={{ paddingRight: '40px' }}
          placeholder="Type a skill and press Enter"
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
        />
        <button
          type="button"
          onClick={addSkill}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: skillInput.trim() ? '#e8a87c' : '#ccc',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: skillInput.trim() ? 'pointer' : 'default',
            padding: 0,
            lineHeight: 1,
          }}
          disabled={!skillInput.trim()}
          title="Add skill"
        >
          +
        </button>
      </div>

      {Array.isArray(draft.skills) && draft.skills.length > 0 && (
        <div className="skill-chip-row">
          {draft.skills.map((skill: string, idx: number) => (
            <span
              className="skill-chip removable"
              key={idx}
              onClick={() => {
                updateDraft({
                  skills: draft.skills.filter(
                    (_: string, i: number) => i !== idx
                  ),
                });
              }}
              title="Click to remove"
            >
              {skill} ✕
            </span>
          ))}
        </div>
      )}



      {errors.skills && <p className="error-text">{errors.skills}</p>}

      <div className="wizard-footer">
        <button className="btn-secondary" onClick={back}>Previous</button>
        <button className="btn-primary" onClick={handleNext}>Next</button>
      </div>
    </SlideLayout>
  );
}
