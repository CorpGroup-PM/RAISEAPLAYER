"use client";
import "./UserProfile.css";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserService } from "@/services/user.service";
import { useToast } from "@/components/toast/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";

/* ----------------------- REGEX ----------------------- */
const onlyLetters = /^[A-Za-z]+$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const phoneRegex = /^[6-9][0-9]{9}$/;
const aadhaarRegex = /^[0-9]{12}$/;

/* ----------------------- ZOD SCHEMA ----------------------- */
const userProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .regex(onlyLetters, "Only alphabets allowed"),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .regex(onlyLetters, "Only alphabets allowed"),

  phoneNumber: z
    .string()
    .min(10, "Phone number is required")
    .regex(phoneRegex, "Invalid phone number"),

  panNumber: z
    .string()
    .min(1, "PAN number is required")
    .refine((v) => panRegex.test(v), "Invalid PAN format (ABCDE1234F)"),

  panName: z
    .string()
    .min(1, "Name on PAN is required")
    .refine((v) => /^[A-Za-z ]+$/.test(v), "Only alphabets allowed"),

  address: z
    .string()
    .min(1, "Address is required")
    .min(15, "Address must be at least 15 characters long"),

  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters"),

  state: z
    .string()
    .min(1, "State is required")
    .min(2, "State must be at least 2 characters"),

  country: z
    .string()
    .min(1, "Country is required")
    .min(2, "Country must be at least 2 characters"),

  pincode: z
    .string()
    .min(1, "Pincode is required")
    .regex(/^[1-9][0-9]{5}$/, "Enter valid 6 digit pincode"),

  aadhaarNumber: z
    .string()
    .min(1, "Aadhaar number is required")
    .refine((v) => v.startsWith("XXXXXXXX") || aadhaarRegex.test(v), "Aadhaar must be exactly 12 digits"),
});

const phoneRules = [
  { test: (v: string) => /^[0-9]*$/.test(v), message: "Only numbers allowed" },
  { test: (v: string) => v.length === 10, message: "Must be 10 digits" },
  { test: (v: string) => /^[6-9]/.test(v), message: "Invalid Indian number" },
];

export default function UserProfile() {
  const { addToast } = useToast();
  const { user, refreshUser, isLoaded } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [panPdfUploading, setPanPdfUploading] = useState(false);
  const [aadhaarFrontUploading, setAadhaarFrontUploading] = useState(false);
  const [aadhaarBackUploading, setAadhaarBackUploading] = useState(false);
  const panPdfRef = useRef<HTMLInputElement>(null);
  const aadhaarFrontRef = useRef<HTMLInputElement>(null);
  const aadhaarBackRef = useRef<HTMLInputElement>(null);

  // Local PDF URL state — avoids triggering form reset on upload
  const [localPanPdfUrl, setLocalPanPdfUrl] = useState<string | null>(null);
  const [localAadhaarFrontPdfUrl, setLocalAadhaarFrontPdfUrl] = useState<string | null>(null);
  const [localAadhaarBackPdfUrl, setLocalAadhaarBackPdfUrl] = useState<string | null>(null);

  // Tracks whether any PDF was uploaded since last Save — enables the Save button
  const [hasPdfChanged, setHasPdfChanged] = useState(false);

  /* ----------------------- FORM ----------------------- */
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(userProfileSchema),
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const phoneValue = watch("phoneNumber");

  /* ----------------------- REFRESH ON MOUNT ----------------------- */
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------------- LOAD USER ----------------------- */
  useEffect(() => {
    if (!user) return;

    reset({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phoneNumber: user.phoneNumber ?? "",
      panNumber: user.panDetails?.panNumber ?? "",
      panName: user.panDetails?.panName ?? "",
      address: user.panDetails?.address ?? "",
      city: user.panDetails?.city ?? "",
      state: user.panDetails?.state ?? "",
      country: user.panDetails?.country ?? "",
      pincode: user.panDetails?.pincode ?? "",
      aadhaarNumber: user.aadhaarDetails?.aadhaarNumber ?? "",
    });
  }, [user, reset]);

  /* ----------------------- UPDATE PROFILE ----------------------- */
  const onSubmit = async (data: any) => {
    const payload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
    };

    // Only include panDetails in the payload when PAN is NOT yet verified
    if (!user?.panDetails?.isPanVerified) {
      payload.panDetails = {
        panNumber: data.panNumber || null,
        panName: data.panName || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        pincode: data.pincode || null,
      };
    }

    // Only include aadhaarDetails when Aadhaar is NOT yet verified
    if (!user?.aadhaarDetails?.isAadhaarVerified && data.aadhaarNumber) {
      payload.aadhaarDetails = {
        aadhaarNumber: data.aadhaarNumber,
      };
    }

    try {
      // Only send profile data to server when form fields actually changed
      if (isDirty) {
        await UserService.updateProfile(payload);
      }
      await refreshUser();
      reset(data);
      setHasPdfChanged(false);
    } catch (err) {
      console.error("Profile update failed", err);
    }
  };

  /* ----------------------- PAN PDF UPLOAD ----------------------- */
  const handlePanPdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      addToast("Only PDF files are allowed", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast("PDF must be under 10MB", "error");
      return;
    }

    try {
      setPanPdfUploading(true);
      const res = await UserService.updatePanPdf(file);
      setLocalPanPdfUrl(res.data.signedUrl);
      setHasPdfChanged(true);
    } catch {
      addToast("Failed to upload PAN PDF", "error");
    } finally {
      setPanPdfUploading(false);
      if (panPdfRef.current) panPdfRef.current.value = "";
    }
  };

  /* ----------------------- AADHAAR PDF UPLOAD ----------------------- */
  const handleAadhaarPdfChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      addToast("Only PDF files are allowed", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast("PDF must be under 10MB", "error");
      return;
    }

    try {
      if (side === "front") setAadhaarFrontUploading(true);
      else setAadhaarBackUploading(true);

      if (side === "front") {
        const res = await UserService.updateAadhaarFrontPdf(file);
        setLocalAadhaarFrontPdfUrl(res.data.signedUrl);
      } else {
        const res = await UserService.updateAadhaarBackPdf(file);
        setLocalAadhaarBackPdfUrl(res.data.signedUrl);
      }
      setHasPdfChanged(true);
    } catch {
      addToast(`Failed to upload Aadhaar ${side} PDF`, "error");
    } finally {
      if (side === "front") setAadhaarFrontUploading(false);
      else setAadhaarBackUploading(false);
      // Reset input so the same file can be re-uploaded if needed
      if (side === "front" && aadhaarFrontRef.current) aadhaarFrontRef.current.value = "";
      if (side === "back" && aadhaarBackRef.current) aadhaarBackRef.current.value = "";
    }
  };

  /* ----------------------- PROFILE PICTURE ----------------------- */
  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Only image files allowed", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast("Image must be under 5MB", "error");
      return;
    }

    try {
      setUploading(true);
      await UserService.updateProfilePicture(file);
      await refreshUser();
    } catch {
      addToast("Failed to upload profile picture", "error");
    } finally {
      setUploading(false);
    }
  };

  /* ----------------------- GUARDS ----------------------- */
  if (!isLoaded) return null;
  if (!user) return <div>Please login</div>;

  // Extract register result so we can call panReg.onChange after uppercasing
  const panReg = register("panNumber");

  /* ----------------------- UI ----------------------- */
  return (
    <div className="up-page">
      <div className="up-wrapper">
        {/* LEFT CARD */}
        <div className="up-profile-card">
          <div className="up-avatar-box">
            {user.profilePicture ? (
              <div
                className="up-avatar"
                style={{ backgroundImage: `url("${user.profilePicture}")` }}
              />
            ) : (
              <div className="up-avatar up-avatar-default">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="38" r="22" fill="#9ca3af" />
                  <ellipse cx="50" cy="90" rx="36" ry="24" fill="#9ca3af" />
                </svg>
              </div>
            )}

            <label className="up-avatar-edit" title="Change profile picture">
              <span className="material-symbols-outlined up-edit-icon">
                <img src="/edit.png" alt="edit" style={{ height: "20px" }} />
              </span>

              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={handleProfilePictureChange}
              />
            </label>
          </div>

          <h3 className="up-name">
            {user.firstName} {user.lastName}
          </h3>
          <p className="up-phone">{user.phoneNumber}</p>
        </div>

        {/* FORM */}
        <form className="up-form" onSubmit={handleSubmit(onSubmit)}>
          {/* PERSONAL INFO */}
          <div className="up-section">
            <h3 className="up-section-title">Personal Info</h3>

            <div className="up-field">
              <label>First Name</label>
              <input {...register("firstName")} />
              {errors.firstName && (
                <p className="error">{errors.firstName.message}</p>
              )}
            </div>

            <div className="up-field">
              <label>Last Name</label>
              <input {...register("lastName")} />
              {errors.lastName && (
                <p className="error">{errors.lastName.message}</p>
              )}
            </div>

            <div className="up-field">
              <label>Email</label>
              <input
                value={user.email}
                readOnly
                className="up-input-readonly"
              />
            </div>

            <div className="up-field">
              <label>Phone Number</label>
              <input {...register("phoneNumber")} />
              {phoneValue && (
                <ul className="phone-error-list">
                  {phoneRules
                    .filter((r) => !r.test(phoneValue))
                    .map((r, i) => (
                      <li key={i} className="error">
                        {r.message}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* PAN DETAILS */}
          <div className="up-section">
            <h3 className="up-section-title">
              PAN Details
              {user.panDetails?.isPanVerified && (
                <span className="pan-verified-badge">&#10003; Verified</span>
              )}
            </h3>

            {user.panDetails?.isPanVerified && (
              <p className="pan-verified-note">
                Your PAN details have been verified by admin and cannot be edited.
              </p>
            )}

            <div className="up-field">
              <label>PAN Number</label>
              <input
                {...panReg}
                readOnly={!!user.panDetails?.isPanVerified}
                className={user.panDetails?.isPanVerified ? "up-input-readonly" : ""}
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                onChange={(e) => {
                  const raw = e.target.value.toUpperCase();
                  // Enforce format char-by-char: LLLLL NNNN L (L=letter, N=number)
                  let filtered = "";
                  for (let i = 0; i < raw.length && i < 10; i++) {
                    const ch = raw[i];
                    if (i < 5 && /[A-Z]/.test(ch)) filtered += ch;
                    else if (i >= 5 && i < 9 && /[0-9]/.test(ch)) filtered += ch;
                    else if (i === 9 && /[A-Z]/.test(ch)) filtered += ch;
                  }
                  e.target.value = filtered;
                  panReg.onChange(e);
                }}
              />
              {errors.panNumber && (
                <p className="error">{errors.panNumber.message}</p>
              )}
            </div>

            <div className="up-field">
              <label>Name on PAN</label>
              <input
                {...register("panName")}
                readOnly={!!user.panDetails?.isPanVerified}
                className={user.panDetails?.isPanVerified ? "up-input-readonly" : ""}
              />
            </div>

            <div className="up-field">
              <label>Address</label>
              <input
                {...register("address")}
                readOnly={!!user.panDetails?.isPanVerified}
                className={user.panDetails?.isPanVerified ? "up-input-readonly" : ""}
              />
              {errors.address && (
                <p className="error">{errors.address.message}</p>
              )}
            </div>

            <div className="up-row">
              <div className="up-field">
                <label>City</label>
                <input
                  {...register("city")}
                  readOnly={!!user.panDetails?.isPanVerified}
                  className={user.panDetails?.isPanVerified ? "up-input-readonly" : ""}
                />
                {errors.city && (
                  <p className="error">{errors.city.message}</p>
                )}
              </div>

              <div className="up-field">
                <label>State</label>
                <input
                  {...register("state")}
                  readOnly={!!user.panDetails?.isPanVerified}
                  className={user.panDetails?.isPanVerified ? "up-input-readonly" : ""}
                />
                {errors.state && (
                  <p className="error">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="up-row">
              <div className="up-field">
                <label>Country</label>
                <input
                  {...register("country")}
                  readOnly={!!user.panDetails?.isPanVerified}
                  className={user.panDetails?.isPanVerified ? "up-input-readonly" : ""}
                />
                {errors.country && (
                  <p className="error">{errors.country.message}</p>
                )}
              </div>

              <div className="up-field">
                <label>Pincode</label>
                <input
                  {...register("pincode")}
                  readOnly={!!user.panDetails?.isPanVerified}
                  className={user.panDetails?.isPanVerified ? "up-input-readonly" : ""}
                />
                {errors.pincode && (
                  <p className="error">{errors.pincode.message}</p>
                )}
              </div>
            </div>

            {/* PAN PDF UPLOAD */}
            <div className="aadhaar-pdf-row" style={{ marginTop: 8 }}>
              {(() => {
                const panPdfUrl = localPanPdfUrl ?? user.panDetails?.panPdfSignedUrl;
                return (
                  <div className={`aadhaar-pdf-card${panPdfUrl ? " uploaded" : ""}`}>
                    <div className="aadhaar-pdf-card-icon">{panPdfUrl ? "" : "📄"}</div>
                    <div className="aadhaar-pdf-card-label">PAN Card PDF</div>

                    {panPdfUrl ? (
                      <div className="aadhaar-pdf-card-actions">
                        <a href={panPdfUrl} target="_blank" rel="noopener noreferrer" className="aadhaar-pdf-view-btn">
                          View PDF
                        </a>
                        {!user.panDetails?.isPanVerified && (
                          <label className="aadhaar-pdf-replace-btn">
                            {panPdfUploading ? "Uploading..." : "Replace"}
                            <input ref={panPdfRef} type="file" accept="application/pdf" hidden disabled={panPdfUploading} onChange={handlePanPdfChange} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className={`aadhaar-pdf-upload-btn${panPdfUploading ? " loading" : ""}${user.panDetails?.isPanVerified ? " disabled" : ""}`}>
                        {panPdfUploading ? "Uploading..." : "Upload PDF"}
                        <input ref={panPdfRef} type="file" accept="application/pdf" hidden disabled={panPdfUploading || !!user.panDetails?.isPanVerified} onChange={handlePanPdfChange} />
                      </label>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* AADHAAR DETAILS */}
          <div className="up-section">
            <h3 className="up-section-title">
              Aadhaar Details
              {user.aadhaarDetails?.isAadhaarVerified && (
                <span className="pan-verified-badge">&#10003; Verified</span>
              )}
            </h3>

            {user.aadhaarDetails?.isAadhaarVerified && (
              <p className="pan-verified-note">
                Your Aadhaar details have been verified by admin and cannot be edited.
              </p>
            )}

            <div className="up-field">
              <label>Aadhaar Number</label>
              <input
                {...register("aadhaarNumber")}
                readOnly={!!user.aadhaarDetails?.isAadhaarVerified}
                className={user.aadhaarDetails?.isAadhaarVerified ? "up-input-readonly" : ""}
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={12}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                  e.target.value = raw;
                  register("aadhaarNumber").onChange(e);
                }}
              />
              {errors.aadhaarNumber && (
                <p className="error">{errors.aadhaarNumber.message}</p>
              )}
            </div>

            {/* AADHAAR PDF HINT */}
            <div className="aadhaar-hint-box">
              <span className="aadhaar-hint-icon">&#128161;</span>
              <p className="aadhaar-hint-text">
                If you have an e-Aadhaar PDF from UIDAI, you can upload the same file for both front and back.
              </p>
            </div>

            {/* FRONT + BACK PDF CARDS */}
            <div className="aadhaar-pdf-row">
              {/* FRONT CARD */}
              {(() => {
                const frontUrl = localAadhaarFrontPdfUrl ?? user.aadhaarDetails?.frontPdfSignedUrl;
                return (
                  <div className={`aadhaar-pdf-card${frontUrl ? " uploaded" : ""}`}>
                    <div className="aadhaar-pdf-card-icon">{frontUrl ? "" : "📄"}</div>
                    <div className="aadhaar-pdf-card-label">Front Side</div>
                    {frontUrl ? (
                      <div className="aadhaar-pdf-card-actions">
                        <a href={frontUrl} target="_blank" rel="noopener noreferrer" className="aadhaar-pdf-view-btn">View PDF</a>
                        {!user.aadhaarDetails?.isAadhaarVerified && (
                          <label className="aadhaar-pdf-replace-btn">
                            {aadhaarFrontUploading ? "Uploading..." : "Replace"}
                            <input ref={aadhaarFrontRef} type="file" accept="application/pdf" hidden disabled={aadhaarFrontUploading} onChange={(e) => handleAadhaarPdfChange(e, "front")} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className={`aadhaar-pdf-upload-btn${aadhaarFrontUploading ? " loading" : ""}${user.aadhaarDetails?.isAadhaarVerified ? " disabled" : ""}`}>
                        {aadhaarFrontUploading ? "Uploading..." : "Upload PDF"}
                        <input ref={aadhaarFrontRef} type="file" accept="application/pdf" hidden disabled={aadhaarFrontUploading || !!user.aadhaarDetails?.isAadhaarVerified} onChange={(e) => handleAadhaarPdfChange(e, "front")} />
                      </label>
                    )}
                  </div>
                );
              })()}

              {/* BACK CARD */}
              {(() => {
                const backUrl = localAadhaarBackPdfUrl ?? user.aadhaarDetails?.backPdfSignedUrl;
                return (
                  <div className={`aadhaar-pdf-card${backUrl ? " uploaded" : ""}`}>
                    <div className="aadhaar-pdf-card-icon">{backUrl ? "" : "📄"}</div>
                    <div className="aadhaar-pdf-card-label">Back Side</div>
                    {backUrl ? (
                      <div className="aadhaar-pdf-card-actions">
                        <a href={backUrl} target="_blank" rel="noopener noreferrer" className="aadhaar-pdf-view-btn">View PDF</a>
                        {!user.aadhaarDetails?.isAadhaarVerified && (
                          <label className="aadhaar-pdf-replace-btn">
                            {aadhaarBackUploading ? "Uploading..." : "Replace"}
                            <input ref={aadhaarBackRef} type="file" accept="application/pdf" hidden disabled={aadhaarBackUploading} onChange={(e) => handleAadhaarPdfChange(e, "back")} />
                          </label>
                        )}
                      </div>
                    ) : (
                      <label className={`aadhaar-pdf-upload-btn${aadhaarBackUploading ? " loading" : ""}${user.aadhaarDetails?.isAadhaarVerified ? " disabled" : ""}`}>
                        {aadhaarBackUploading ? "Uploading..." : "Upload PDF"}
                        <input ref={aadhaarBackRef} type="file" accept="application/pdf" hidden disabled={aadhaarBackUploading || !!user.aadhaarDetails?.isAadhaarVerified} onChange={(e) => handleAadhaarPdfChange(e, "back")} />
                      </label>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <button
            type="submit"
            className="up-save-btn"
            disabled={(!isDirty && !hasPdfChanged) || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
