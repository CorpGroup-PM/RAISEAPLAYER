"use client";

import { useState, useEffect } from "react";
import "./offline-banner.css";

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="offline-banner" role="alert" aria-live="assertive">
            <span className="offline-icon">⚠</span>
            <span>You appear to be offline. Some features may be unavailable.</span>
        </div>
    );
}
