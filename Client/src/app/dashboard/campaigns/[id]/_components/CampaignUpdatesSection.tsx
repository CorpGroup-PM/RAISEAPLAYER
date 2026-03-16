"use client";

import React, { useState, useRef, useEffect } from "react";
import { FundraiserService } from "@/services/fundraiser.service";

type CampaignUpdate = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

interface Props {
  rawUpdates: any[];
  fundraiserId: string;
}

export default function CampaignUpdatesSection({ rawUpdates, fundraiserId }: Props) {
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [expandedUpdates, setExpandedUpdates] = useState<Record<string, boolean>>({});
  const updateRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const [overflowingUpdates, setOverflowingUpdates] = useState<Record<string, boolean>>({});

  // Normalize raw updates from parent campaign data
  useEffect(() => {
    const raw = rawUpdates;
    const normalized: CampaignUpdate[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === "object"
        ? [raw as CampaignUpdate]
        : [];
    setUpdates(
      normalized
        .filter(
          (u: any): u is CampaignUpdate =>
            u && typeof u.title === "string" && typeof u.content === "string"
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    );
  }, [rawUpdates]);

  // Overflow detection for read-more buttons
  useEffect(() => {
    const newState: Record<string, boolean> = {};
    updates.forEach((update) => {
      const el = updateRefs.current[update.id];
      if (el) newState[update.id] = el.scrollHeight > el.clientHeight;
    });
    setOverflowingUpdates(newState);
  }, [updates]);

  const handleAddUpdate = async () => {
    if (!updateTitle.trim() || !updateContent.trim() || !fundraiserId) return;
    try {
      setAddingUpdate(true);
      const res = await FundraiserService.addCampaignUpdate(fundraiserId, {
        title: updateTitle,
        content: updateContent,
      });
      const responseData = res.data?.data;
      let newUpdate: CampaignUpdate | null = null;
      if (responseData?.updates) {
        newUpdate = Array.isArray(responseData.updates)
          ? responseData.updates[0]
          : responseData.updates;
      }
      if (newUpdate && typeof newUpdate.title === "string") {
        setUpdates((prev) => [newUpdate!, ...prev]);
      }
      setUpdateTitle("");
      setUpdateContent("");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to add update", err);
      }
    } finally {
      setAddingUpdate(false);
    }
  };

  return (
    <section className="campaign-updates-section">
      <div className="updates-card">
        <h4 className="updates-title">Campaign Updates</h4>

        <div className="update-form">
          <input
            type="text"
            placeholder="Update title"
            value={updateTitle}
            onChange={(e) => setUpdateTitle(e.target.value)}
          />
          <textarea
            placeholder="Write an update for supporters…"
            value={updateContent}
            onChange={(e) => setUpdateContent(e.target.value)}
          />
          <button
            className="add-update-btn"
            onClick={handleAddUpdate}
            disabled={addingUpdate}
          >
            {addingUpdate ? "Posting…" : "+ Post Update"}
          </button>
        </div>

        {updates.length > 0 ? (
          <>
            <div className="updates-list">
              {(showAllUpdates ? updates : updates.slice(0, 2)).map((update) => (
                <div className="update-item" key={update.id}>
                  <div className="update-header">
                    <strong>{update.title}</strong>
                    <span className="update-date">
                      {new Date(update.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p
                    ref={(el) => {
                      updateRefs.current[update.id] = el;
                    }}
                    className={`update-content ${
                      expandedUpdates[update.id] ? "expanded" : "collapsed"
                    }`}
                  >
                    {update.content.split("\n").map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </p>
                  {overflowingUpdates[update.id] && (
                    <button
                      className="read-more-story-btn"
                      onClick={() =>
                        setExpandedUpdates((prev) => ({
                          ...prev,
                          [update.id]: !prev[update.id],
                        }))
                      }
                    >
                      {expandedUpdates[update.id] ? "Read less" : "Read more"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {updates.length > 2 && (
              <div className="updates-read-more-wrap">
                <button
                  className="read-more-btn"
                  onClick={() => setShowAllUpdates((prev) => !prev)}
                >
                  {showAllUpdates ? "Show less" : "Show more"}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="updates-empty">No updates posted yet.</p>
        )}
      </div>
    </section>
  );
}
