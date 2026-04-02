"use client";

import { useEffect, useState } from "react";
import { VolunteerService } from "@/services/volunteer.service";
import { useToast } from "@/components/toast/ToastContext";

type Volunteer = {
  id: string;
  city: string;
  message: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: "#fef3c7", color: "#92400e" },
  ACCEPTED: { bg: "#d1fae5", color: "#065f46" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
};

export default function AdminVolunteersPage() {
  const { addToast } = useToast();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ACCEPTED" | "REJECTED">("ALL");
  const [expandedMsgs, setExpandedMsgs] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await VolunteerService.listVolunteers();
      setVolunteers(res.data?.data || []);
    } catch {
      addToast("Failed to load volunteers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleMsg = (id: string) => {
    setExpandedMsgs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id + "_accept");
    try {
      await VolunteerService.acceptVolunteer(id);
      setVolunteers((prev) => prev.map((v) => v.id === id ? { ...v, status: "ACCEPTED" } : v));
      addToast("Volunteer accepted", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message || "Failed to accept", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "_reject");
    try {
      await VolunteerService.rejectVolunteer(id);
      setVolunteers((prev) => prev.map((v) => v.id === id ? { ...v, status: "REJECTED" } : v));
      addToast("Volunteer rejected", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message || "Failed to reject", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = volunteers.filter((v) => filter === "ALL" || v.status === filter);
  const counts = {
    ALL:      volunteers.length,
    PENDING:  volunteers.filter((v) => v.status === "PENDING").length,
    ACCEPTED: volunteers.filter((v) => v.status === "ACCEPTED").length,
    REJECTED: volunteers.filter((v) => v.status === "REJECTED").length,
  };

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", padding: "0 0 48px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 70, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>VOLUNTEERS</h1>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
              Volunteer applications for Navyug RaiseAPlayer Foundation
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              padding: "8px 18px", background: "#0f6fec", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((s) => (
            <div key={s} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>{s}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{counts[s]}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {(["ALL", "PENDING", "ACCEPTED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 16px", borderRadius: 20,
                border: filter === s ? "none" : "1px solid #e5e7eb",
                background: filter === s ? "#0f6fec" : "#fff",
                color: filter === s ? "#fff" : "#374151",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}
            >
              {s === "ALL" ? `All (${counts.ALL})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${counts[s]})`}
            </button>
          ))}
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading volunteers…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280", background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
            No volunteers found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((v) => {
              const isExpanded = expandedMsgs.has(v.id);
              const msgLines = v.message?.split("\n").length ?? 0;
              const msgChars = v.message?.length ?? 0;
              const isLong = msgChars > 120 || msgLines > 2;

              return (
                <div
                  key={v.id}
                  style={{
                    background: "#fff", borderRadius: 12,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                    padding: "16px 20px",
                    borderLeft: `4px solid ${STATUS_COLORS[v.status].color}`,
                  }}
                >
                  {/* Top row: name + status + actions */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>

                    {/* Left: identity */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>
                          {v.user.firstName} {v.user.lastName}
                        </span>
                        <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace" }}>{v.id}</span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "#6b7280" }}>
                        {v.user.email}
                        {v.user.phoneNumber && (
                          <span style={{ marginLeft: 10 }}>{v.user.phoneNumber}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: status + actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, ...STATUS_COLORS[v.status] }}>
                        {v.status}
                      </span>

                      {v.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleAccept(v.id)}
                            disabled={!!actionLoading}
                            style={actionBtn("#d1fae5", "#065f46", actionLoading === v.id + "_accept")}
                          >
                            {actionLoading === v.id + "_accept" ? "…" : "Accept"}
                          </button>
                          <button
                            onClick={() => handleReject(v.id)}
                            disabled={!!actionLoading}
                            style={actionBtn("#fee2e2", "#991b1b", actionLoading === v.id + "_reject")}
                          >
                            {actionLoading === v.id + "_reject" ? "…" : "Reject"}
                          </button>
                        </>
                      )}
                      {v.status === "ACCEPTED" && (
                        <button
                          onClick={() => handleReject(v.id)}
                          disabled={!!actionLoading}
                          style={actionBtn("#fee2e2", "#991b1b", actionLoading === v.id + "_reject")}
                        >
                          {actionLoading === v.id + "_reject" ? "…" : "Reject"}
                        </button>
                      )}
                      {v.status === "REJECTED" && (
                        <button
                          onClick={() => handleAccept(v.id)}
                          disabled={!!actionLoading}
                          style={actionBtn("#d1fae5", "#065f46", actionLoading === v.id + "_accept")}
                        >
                          {actionLoading === v.id + "_accept" ? "…" : "Accept"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: city + date + message */}
                  <div style={{ marginTop: 10, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>City</span>
                      <div style={{ color: "#374151", marginTop: 2 }}>{v.city}</div>
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Applied</span>
                      <div style={{ color: "#374151", marginTop: 2 }}>
                        {new Date(v.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    {v.message && (
                      <div style={{ fontSize: 13, flex: 1, minWidth: 200 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Message</span>
                        <div style={{ color: "#374151", marginTop: 2, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {isLong && !isExpanded
                            ? v.message.slice(0, 120) + "…"
                            : v.message}
                        </div>
                        {isLong && (
                          <button
                            onClick={() => toggleMsg(v.id)}
                            style={{ marginTop: 4, background: "none", border: "none", color: "#0f6fec", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

function actionBtn(bg: string, color: string, loading: boolean): React.CSSProperties {
  return {
    padding: "5px 14px",
    background: bg,
    color,
    border: "none",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: 13,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.6 : 1,
    whiteSpace: "nowrap",
  };
}
