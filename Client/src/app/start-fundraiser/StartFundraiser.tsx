'use client';

import CampaignWizard from './CampaignWizard';
import './wizard.css'; 

export default function StartFundraiser() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold">
          Start a Fundraiser
        </h1>
        <p className="text-gray-600 mt-2">
          Create your campaign in a few simple steps
        </p>
      </div>

      {/* Wizard */}
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <CampaignWizard />
      </div>
    </div>
  );
}
