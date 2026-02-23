"use client";

import { useEffect, useState } from "react";
import { loadingManager } from "@/lib/loading-manager";
import "./loader.css";

export function GlobalLoader() {
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    loadingManager.bind((isLoading) => {
      setActiveRequests((prev) => Math.max(0, prev + (isLoading ? 1 : -1)));
    });
  }, []);

  return (
    <div className={`loader-bar ${activeRequests > 0 ? "visible" : ""}`}>
      <div className="loader-progress"></div>
    </div>
  );
}
