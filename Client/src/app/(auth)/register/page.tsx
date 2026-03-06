"use client";

import "./register.css";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useToast } from "@/components/toast/ToastContext";
import { loadingManager } from "@/lib/loading-manager";
import { AuthService } from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.min(score, 5);
};

const phoneRegex = /^[0-9]{10,15}$/;

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, "Firstname must be at least 2 characters long"),
    lastName: z.string().trim().min(2, "Lastname must be at least 2 characters long"),
    email: z.string().trim().email("Please enter a valid email address"),
    phoneNumber: z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 digits")
      .regex(phoneRegex, "Phone number should contain only digits"),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().trim().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const GOOGLE_OAUTH_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;

type RegisterFormValues = z.infer<typeof registerSchema>;

const passwordRules = [
  { test: (v: string) => v.length >= 8, message: "Minimum 8 characters" },
  { test: (v: string) => /[A-Z]/.test(v), message: "At least 1 uppercase letter" },
  { test: (v: string) => /[a-z]/.test(v), message: "At least 1 lowercase letter" },
  { test: (v: string) => /[0-9]/.test(v), message: "At least 1 number" },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), message: "At least 1 special character" },
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  

  // OTP STATES
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });
  const emailValue = watch("email");

  const handleGoogleSignUp = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

  const sendOtp = async () => {
    const email = watch("email");

    if (!email) {
      addToast("Please enter the email", "error");
      return;
    }

    try {
      await AuthService.sendOtp(email);
      setOtpSent(true);
      setTimer(30);
      setAttempts(0);
    } catch {
      //addToast("Failed to send OTP", "error");
    }
  };

  const verifyOtp = async () => {
    const email = watch("email");

    if (!otp) {
      addToast("Enter OTP", "error");
      return;
    }


    try {
      setIsVerifyingOtp(true);

      await AuthService.verifyOtp(email, otp);

      setIsEmailVerified(true);
      setOtpSent(false);
    } catch (err: any) {

    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    if (!isEmailVerified) {
      // addToast("Please verify your email before signing up.", "error");
      return;
    }

    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
      };

      loadingManager.start();
      await AuthService.register(payload);
      reset();
      window.location.href = "/login";
    } catch {
      // addToast("Registration failed. Try again.", "error");
    } finally {
      loadingManager.stop();
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-modal">
        {/* LEFT */}
        <div className="auth-left">
          <div className="logo-circle">
            <img src="/logo.png" alt="Logo" className="logo-img" />
          </div>
          <div>
            <h2 className="welcome-title">Welcome to RaiseAPlayer,</h2>
            <p className="welcome-sub">India’s largest crowdfunding site</p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="auth-right">
          <p className="subtitle">
            Sign up &amp; manage fundraisers, donations &amp; more
          </p>

          {/* Social */}
          <div className="social-section">
            <button
              type="button"
              className="btn btn-social btn-google"
              onClick={handleGoogleSignUp}
            >
              <span className="social-icon-circle">G</span>
              <span className="btn-text">Sign up with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">or</span>
            <span className="divider-line"></span>
          </div>

          {/* EMAIL */}
          <div className="input-group">
            {/* Row: input + verify button */}
            <div className="email-row">
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? "input-error" : ""}`}
                placeholder="Email"
                autoComplete="email"
                {...register("email")}
                disabled={isEmailVerified}
              />

              {!isEmailVerified && !otpSent && (
                <button
                  type="button"
                  className="inline-otp-btn"
                  onClick={sendOtp}
                  disabled={!emailValue || !!errors.email}
                >
                  Verify Email
                </button>
              )}

              {isEmailVerified && (
                <span className="verified-badge">✔ Email Verified</span>
              )}
            </div>

            {/* ✅ ZOD ERROR BELOW */}
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
          </div>

          {otpSent && !isEmailVerified && (
            <div className="otp-section">
              <input
                type="text"
                maxLength={6}
                className="input-field"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <div className="otp-actions-row">
                <button
                  type="button"
                  className="btn btn-verify"
                  onClick={verifyOtp}
                  disabled={isVerifyingOtp || attempts >= 5}
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>

                {timer > 0 ? (
                  <span className="timer-text">Resend OTP in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-resend"
                    onClick={sendOtp}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FORM */}
          <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="input-group">
              <input
                id="firstname"
                type="text"
                className={`input-field ${errors.firstName ? "input-error" : ""
                  }`}
                placeholder="Firstname"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="error-text">{errors.firstName.message}</p>
              )}
            </div>

            <div className="input-group">
              <input
                id="lastname"
                type="text"
                className={`input-field ${errors.lastName ? "input-error" : ""
                  }`}
                placeholder="Lastname"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="error-text">{errors.lastName.message}</p>
              )}
            </div>

            <div className="input-group">
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                className={`input-field ${errors.phoneNumber ? "input-error" : ""
                  }`}
                placeholder="Phone Number"
                autoComplete="tel"
                {...register("phoneNumber")}
              />
              {errors.phoneNumber && (
                <p className="error-text">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="input-group">
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`input-field ${errors.password ? "input-error" : ""
                    }`}
                  placeholder="Password"
                  autoComplete="new-password"
                  {...register("password", {
                    onChange: (e) =>
                      setPasswordStrength(getPasswordStrength(e.target.value)),
                  })}
                />

                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff width={20} /> : <Eye width={20} />}
                </button>
              </div>

              {watch("password") && watch("password").length > 0 && (
                <div className="strength-bar">
                  <div
                    className={`strength-fill level-${passwordStrength}`}
                  ></div>
                </div>
              )}

              {watch("password") && watch("password").length > 0 && (
                <ul className="password-error-list">
                  {passwordRules
                    .filter((rule) => !rule.test(watch("password")))
                    .map((rule, idx) => (
                      <li key={idx}>{rule.message}</li>
                    ))}
                </ul>
              )}
            </div>

            <div className="input-group">
              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`input-field ${errors.confirmPassword ? "input-error" : ""
                    }`}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff width={20} />
                  ) : (
                    <Eye width={20} />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword.message}</p>
              )}
            </div>

            <p className="terms-text">
              By signing up, you agree to our{" "}
              <a href="/legal/terms" className="link">
                Terms
              </a>{" "}
              and{" "}
              <a href="/legal/privacy-policy" className="link">
                Privacy Policy
              </a>
              .
            </p>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !isValid || !isEmailVerified}
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="login-text">
            Already signed up with RaiseAPlayer?{" "}
            <a href="/login" className="link">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
