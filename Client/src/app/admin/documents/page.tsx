"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnalyticsService } from "@/services/analytics.service";
import "./documents.css";

type PendingDoc = {
  id: string;
  fundraiserId: string;
  type: string;
  fileUrl: string;
  createdAt: string;
};

type VerifiedDoc = {
  id: string;
  fundraiserId: string;
  type: string;
  fileUrl: string;
  createdAt: string;
  verifiedAt: string | null;
};

type StatusRow = { status: string; count: number };
type TypeRow   = { type: string;   count: number };

type DocsData = {
  statusBreakdown: StatusRow[];
  typeBreakdown:   TypeRow[];
  pendingDocuments: PendingDoc[];
  verifiedDocuments: VerifiedDoc[];
};

function prettyType(t: string) {
  return String(t || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminDocumentsPage() {
  const [data, setData]       = useState<DocsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await AnalyticsService.documents({});
      setData(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pending  = data?.statusBreakdown?.find((s) => s.status === "PENDING")?.count  ?? 0;
  const approved = data?.statusBreakdown?.find((s) => s.status === "VERIFIED")?.count ?? 0;
  const rejected = data?.statusBreakdown?.find((s) => s.status === "REJECTED")?.count ?? 0;
  const total    = (data?.statusBreakdown ?? []).reduce((s, x) => s + x.count, 0);

  const allTypes = data?.typeBreakdown?.map((t) => t.type) ?? [];

  const pendingDocs = (data?.pendingDocuments ?? []).filter(
    (d) => typeFilter === "ALL" || d.type === typeFilter,
  );

  const verifiedDocs = (data?.verifiedDocuments ?? []).filter(
    (d) => typeFilter === "ALL" || d.type === typeFilter,
  );

  return (
    <div className="adPage">
      <div className="adContainer">

        {/* Header */}
        <div className="adHeader admin-page-wrapper">
          <div>
            <h1 className="adTitle">DOCUMENTS</h1>
            <p className="adSubtitle">Document verifications for all fundraisers</p>
          </div>
          <button className="adBtn adBtnPrimary" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        {error && <div className="adError">{error}</div>}

        {/* Summary Cards */}
        <div className="adSummary">
          <div className="adSummaryCard">
            <div className="adSummaryLabel">Total Documents</div>
            <div className="adSummaryValue">{total}</div>
          </div>
          <div className="adSummaryCard">
            <div className="adSummaryLabel">Pending Review</div>
            <div className={`adSummaryValue ${pending > 0 ? "warn" : ""}`}>{pending}</div>
          </div>
          <div className="adSummaryCard">
            <div className="adSummaryLabel">Approved</div>
            <div className="adSummaryValue good">{approved}</div>
          </div>
          <div className="adSummaryCard">
            <div className="adSummaryLabel">Rejected</div>
            <div className={`adSummaryValue ${rejected > 0 ? "warn" : ""}`}>{rejected}</div>
          </div>
        </div>

        {/* Type Filters */}
        <div className="adFilters">
          <button
            className={`adFilterBtn${typeFilter === "ALL" ? " active" : ""}`}
            onClick={() => setTypeFilter("ALL")}
          >
            All types
          </button>
          {allTypes.map((t) => (
            <button
              key={t}
              className={`adFilterBtn${typeFilter === t ? " active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {prettyType(t)}
            </button>
          ))}
        </div>

        {/* Pending Documents Table */}
        <div className="adPanel" style={{ marginBottom: 20 }}>
          <div className="adPanelHeader">
            <h3 className="adPanelTitle">Pending Documents</h3>
            <span className="adCount">{pendingDocs.length} document{pendingDocs.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="adTableWrap">
            {loading ? (
              <div className="adLoading">Loading documents…</div>
            ) : pendingDocs.length === 0 ? (
              <div className="adEmpty">No pending documents found.</div>
            ) : (
              <table className="adTable">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Campaign ID</th>
                    <th>Submitted</th>
                    <th>File</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="adTypeBadge">{prettyType(doc.type)}</span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/campaigns/${doc.fundraiserId}`}
                          className="adCampaignLink"
                        >
                          {doc.fundraiserId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td style={{ color: "#64748b", fontSize: 12 }}>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="adLink"
                        >
                          View file ↗
                        </a>
                      </td>
                      <td>
                        <span className="adStatusBadge PENDING">Pending</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Verified Documents Table */}
        <div className="adPanel">
          <div className="adPanelHeader">
            <h3 className="adPanelTitle">Verified Documents</h3>
            <span className="adCount adCountGood">{verifiedDocs.length} document{verifiedDocs.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="adTableWrap">
            {loading ? (
              <div className="adLoading">Loading documents…</div>
            ) : verifiedDocs.length === 0 ? (
              <div className="adEmpty">No verified documents found.</div>
            ) : (
              <table className="adTable">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Campaign ID</th>
                    <th>Submitted</th>
                    <th>Verified At</th>
                    <th>File</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="adTypeBadge">{prettyType(doc.type)}</span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/campaigns/${doc.fundraiserId}`}
                          className="adCampaignLink"
                        >
                          {doc.fundraiserId.slice(0, 8)}…
                        </Link>
                      </td>
                      <td style={{ color: "#64748b", fontSize: 12 }}>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td style={{ color: "#15803d", fontSize: 12 }}>
                        {doc.verifiedAt
                          ? new Date(doc.verifiedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="adLink"
                        >
                          View file ↗
                        </a>
                      </td>
                      <td>
                        <span className="adStatusBadge VERIFIED">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
