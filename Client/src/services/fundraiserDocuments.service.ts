import { api } from "@/lib/api-client";

export const FundraiserDocumentsService = {
  addDocument: (fundraiserId: string, formData: FormData) =>
    api.post(
      `/fundraiser-documents/${fundraiserId}/documents`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    ),

  getDocuments: (fundraiserId: string) =>
    api.get(`/fundraiser-documents/${fundraiserId}/documents`),

  deleteDocument: (documentId: string) =>
    api.delete(`/fundraiser-documents/documents/${documentId}`),

  verifyDocument: (
    documentId: string,
    payload: {
      status: "VERIFIED" | "REJECTED";
      rejectionReason?: string;
    }
  ) =>
    api.patch(
      `/fundraiser-documents/admin/documents/${documentId}/verify`,
      payload
    ),
};
