"use client";

import { useState } from "react";
import SlideLayout from "../SlideLayout";
import { useAuth } from "@/context/AuthContext";

export default function Slide1CampaignType({
  updateDraft,
  next,
}: any) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<"SELF" | "OTHER" | null>(null);

  const handleSelect = (type: "SELF" | "OTHER") => {
    setSelected(type);
    if (type === "SELF") {
      if (!user) return;
      updateDraft({ campaignFor: "SELF", beneficiaryUserId: user.id });
      setTimeout(() => next("SELF"), 200);
    } else {
      updateDraft({ campaignFor: "OTHER", beneficiaryUserId: null });
      setTimeout(() => next("OTHER"), 200);
    }
  };

  return (
    <SlideLayout
      title="Campaign Type"
      userStory="As a user, I want to choose whether I'm raising funds for myself or someone else."
    >
      {/* SELF */}
      <button
        className={selected === "SELF" ? "btn-primary" : "btn-secondary"}
        onClick={() => handleSelect("SELF")}
      >
        Myself
      </button>

      {/* OTHER */}
      <button
        className={selected === "OTHER" ? "btn-primary" : "btn-secondary"}
        onClick={() => handleSelect("OTHER")}
      >
        Someone Else
      </button>
    </SlideLayout>
  );
}
