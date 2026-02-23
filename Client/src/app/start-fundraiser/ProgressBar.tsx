'use client';

type Props = {
  draft: any;
};

export default function ProgressBar({ draft }: Props) {
  let progress = 0;

  // Slide 1 – Campaign Type (15%)
  if (draft.campaignFor === 'SELF') {
  progress += 20;
}

  // Slide 2 – Beneficiary (15% ONLY IF OTHER)
  if (draft.campaignFor === 'OTHER') {
    const b = draft.beneficiaryOther || {};
    const beneficiaryComplete =
      b.fullName &&
      b.age &&
      b.city &&
      b.state &&
      b.relationshipToCreator;

    if (beneficiaryComplete) progress += 20;
  }

  // Slide 3 – Story (20%)
  if (draft.title && draft.shortDescription && draft.story) {
    progress += 25;
  }

  // Slide 4 – Sport & Skills (15%)
  if (draft.sport) progress += 20;

  // Slide 5 – Location (15%)
  if (draft.location?.city && draft.location?.state) {
    progress += 15;
  }
  
  // Slide 6 – Goal (20%)
  if (draft.goalAmount && draft.goalAmount > 0) {
    progress += 20;
  }

  progress = Math.min(progress, 100);

  return (
    <div className="progress-wrapper">
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="progress-label">
        {progress}% completed
      </p>
    </div>
  );
}
