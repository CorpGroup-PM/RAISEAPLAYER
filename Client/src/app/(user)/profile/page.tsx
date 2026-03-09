"use client";
import "./UserProfile.css";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserService } from "@/services/user.service";
import { useToast } from "@/components/toast/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";

/* ----------------------- REGEX ----------------------- */
const onlyLetters = /^[A-Za-z]+$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const phoneRegex = /^[6-9][0-9]{9}$/;

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
    .optional()
    .refine((v) => !v || panRegex.test(v), "Invalid PAN format (ABCDE1234F)"),

  panName: z
    .string()
    .optional()
    .refine((v) => !v || /^[A-Za-z ]+$/.test(v), "Only alphabets allowed"),

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

  /* ----------------------- FORM ----------------------- */
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(userProfileSchema),
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const phoneValue = watch("phoneNumber");

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
    });
  }, [user, reset]);

  /* ----------------------- UPDATE PROFILE ----------------------- */
  const onSubmit = async (data: any) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      panDetails: {
        panNumber: data.panNumber || null,
        panName: data.panName || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        pincode: data.pincode || null,
      },
    };

    try {
      await UserService.updateProfile(payload);
      //addToast("Profile updated successfully", "success");

      await refreshUser(); // single source of truth
      reset(data); // reset dirty state
    } catch (err) {
      console.error("Profile update failed", err);
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
      addToast("Profile picture updated", "success");
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

  /* ----------------------- UI ----------------------- */
  return (
    <div className="up-page">
      <div className="up-wrapper">
        {/* LEFT CARD */}
        <div className="up-profile-card">
          <div className="up-avatar-box">
            <div
              className="up-avatar"
              style={{
                backgroundImage: `url("${user.profilePicture || "/profileimage.png"
                  }")`,
              }}
            />

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
            <h3 className="up-section-title">PAN Details</h3>

            <div className="up-field">
              <label>PAN Number</label>
              <input
                {...register("panNumber")}
                onChange={(e) =>
                  setValue("panNumber", e.target.value.toUpperCase(), {
                    shouldValidate: true,
                  })
                }
              />
              {errors.panNumber && (
                <p className="error">{errors.panNumber.message}</p>
              )}
            </div>

            <div className="up-field">
              <label>Name on PAN</label>
              <input {...register("panName")} />

            </div>

            <div className="up-field">
              <label>Address</label>
              <input {...register("address")} />
              {errors.address && (
                <p className="error">{errors.address.message}</p>
              )}
            </div>

            <div className="up-row">
              <div className="up-field">
                <label>City</label>
                <input {...register("city")} />
                {errors.city && (
                  <p className="error">{errors.city.message}</p>
                )}
              </div>

              <div className="up-field">
                <label>State</label>
                <input {...register("state")} />
                {errors.state && (
                  <p className="error">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="up-row">
              <div className="up-field">
                <label>Country</label>
                <input {...register("country")} />
                {errors.country && (
                  <p className="error">{errors.country.message}</p>
                )}
              </div>

              <div className="up-field">
                <label>Pincode</label>
                <input {...register("pincode")} />
                {errors.pincode && (
                  <p className="error">{errors.pincode.message}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="up-save-btn"
            disabled={!isDirty || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
