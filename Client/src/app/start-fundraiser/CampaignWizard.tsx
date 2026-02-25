'use client';

import { useState } from 'react';
import SlideIndicator from './SlideIndicator';
import ProgressBar from './ProgressBar';
import './wizard.css';

import Slide1 from './slides/Slide1CampaignType';
import Slide2 from './slides/Slide2Beneficiary';
import Slide3 from './slides/Slide3Story';
import Slide4 from './slides/Slide4Sport';
import Slide5 from './slides/Slide5Location';
import Slide6 from './slides/Slide6Review';

export default function CampaignWizard() {
  const [slideNo, setSlideNo] = useState(1);

  const [draft, setDraft] = useState({
  campaignFor: undefined as "SELF" | "OTHER" | undefined,

  beneficiaryOther: {
    fullName: "",
    age: "",
    relationshipToCreator: "",
    phoneNumber: "",
    email: "",
  },

  title: "",
  shortDescription: "",
  story: "",

  sport: "",
  discipline: "",
  level: "",
  skills: [] as string[],

  location: {
    city: "",
    state: "",
    country: "India",
  },

  goalAmount: "",
});


  const updateDraft = (data: any) =>
    setDraft((prev) => ({ ...prev, ...data }));

  const next = (selectedType?: 'SELF' | 'OTHER') => {
    // Slide 1 decision must use the CLICKED value
    if (slideNo === 1 && selectedType === 'SELF') {
      setSlideNo(3);
      return;
    }

    if (slideNo === 1 && selectedType === 'OTHER') {
      setSlideNo(2);
      return;
    }

    setSlideNo((prev) => Math.min(prev + 1, 7));
  };


  const back = () => {
    if (slideNo === 3 && draft.campaignFor === 'SELF') {
      setSlideNo(1);
      return;
    }
    setSlideNo((s) => Math.max(s - 1, 1));
  };

  const slides: any = {
    1: <Slide1 updateDraft={updateDraft} next={next} />,
    2: <Slide2 draft={draft} updateDraft={updateDraft} next={next} back={back} />,
    3: <Slide3 draft={draft} updateDraft={updateDraft} next={next} back={back} />,
    4: <Slide4 draft={draft} updateDraft={updateDraft} next={next} back={back} />,
    5: <Slide5 draft={draft} updateDraft={updateDraft} next={next} back={back} />,
    6: <Slide6 draft={draft} updateDraft={updateDraft} back={back} />,
  };

  return (
    <div className="wizard-page">
      <div className="wizard-card">
        <SlideIndicator slideNo={slideNo} />
        <ProgressBar draft={draft} />
        {slides[slideNo]}
      </div>
    </div>
  );
}
