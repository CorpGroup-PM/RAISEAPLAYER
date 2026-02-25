'use client';

import SlideLayout from '../SlideLayout';
import { useAuth } from '@/context/AuthContext';

export default function Slide1CampaignType({
  updateDraft,
  next,
}: any) {
  const { user } = useAuth(); 

  return (
    <SlideLayout
      title="Campaign Type"
      userStory="As a user, I want to choose whether I’m raising funds for myself or someone else."
    >
      {/* SELF */}
      <button
        className="btn-primary"
        onClick={() => {
          console.log('Logged-in user:', user); 
          if (!user) return; 

          updateDraft({
            campaignFor: 'SELF',
            beneficiaryUserId: user.id, 
          });

          next('SELF');
        }}
      >
        Myself
      </button>

      {/* OTHER */}
      <button
        className="btn-secondary"
        onClick={() => {
          updateDraft({
            campaignFor: 'OTHER',
            beneficiaryUserId: null, 
          });

          next('OTHER');
        }}
      >
        Someone Else
      </button>
    </SlideLayout>
  );
}
