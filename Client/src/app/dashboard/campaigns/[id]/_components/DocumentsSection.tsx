"use client";

import { useState, useEffect } from "react";
import { FundraiserDocumentsService } from "@/services/fundraiserDocuments.service";
import { Trash2 } from "lucide-react";

type FundraiserDocument = {
  id: string;
  type: string;
  fileUrl: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isPublic: boolean;
  verifiedAt?: string | null;
  createdAt?: string;
};

interface Props {
  fundraiserId: string;
  isRejected: boolean;
  onAlert: (msg: string) => void;
}

export default function DocumentsSection({ fundraiserId, isRejected, onAlert }: Props) {
  const [documents, setDocuments] = useState<FundraiserDocument[]>([]);
  const [docType, setDocType] = useState("ATHLETE_IDENTITY");
  const [docTitle, setDocTitle] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchDocuments = async () => {
    if (!fundraiserId) return;
    try {
      const res = await FundraiserDocumentsService.getDocuments(fundraiserId);
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setDocuments([]);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fundraiserId]);

  const handleAddDocument = async (file: File) => {
    if (!fundraiserId || !file) return;
    if (file.type !== "application/pdf") {
      onAlert("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onAlert("PDF must be less than 5MB");
      return;
    }
    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append("document", file);
      formData.append("type", docType);
      if (docTitle?.trim()) formData.append("title", docTitle);
      await FundraiserDocumentsService.addDocument(fundraiserId, formData);
      await fetchDocuments();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Upload failed", err);
      }
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await FundraiserDocumentsService.deleteDocument(documentId);
      await fetchDocuments();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Delete failed", err);
      }
    }
  };

  return (
    <section className="documents-section">
      <h3 className="documents-title">Documents</h3>

      {!isRejected && (
        <div className="documents-upload-card">
          <select
            className="documents-input"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option value="ATHLETE_IDENTITY">Athlete Identity</option>
            <option value="ACADEMY_CONFIRMATION">Academy Confirmation</option>
            <option value="COACH_CONFIRMATION">Coach Confirmation</option>
            <option value="EQUIPMENT_QUOTE">Equipment Quote</option>
            <option value="TOURNAMENT_INVITE">Tournament Invite</option>
            <option value="TRAINING_RECEIPT">Training Receipt</option>
            <option value="SPORTS_FEDERATION_PROOF">Sports Federation Proof</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            className="documents-input"
            type="text"
            placeholder="Document title (optional)"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
          />

          <label className="documents-upload-btn">
            {uploadingDoc ? "Uploading…" : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) =>
                e.target.files && handleAddDocument(e.target.files[0])
              }
            />
          </label>
        </div>
      )}

      <div className="documents-list">
        {documents.length === 0 && (
          <p className="documents-empty">No documents uploaded yet.</p>
        )}

        {documents.map((doc) => (
          <div key={doc.id} className="pdf-card">
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-preview-clickable"
            >
              <div className="pdf-preview-box">
                <iframe
                  src={`${doc.fileUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                  title="PDF preview"
                  className="pdf-iframe"
                />
              </div>
            </a>

            <div className="pdf-meta">
              <span
                className={`pdf-status ${doc.verificationStatus.toLowerCase()}`}
              >
                {doc.verificationStatus === "PENDING" && "⚠️ Pending"}
                {doc.verificationStatus === "VERIFIED" && "✅ Verified"}
                {doc.verificationStatus === "REJECTED" && "❌ Rejected"}
              </span>

              {doc.verificationStatus !== "VERIFIED" && (
                <button
                  className="pdf-delete-btn"
                  aria-label="Delete document"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
