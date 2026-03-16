"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/toast/ToastContext";
import { AuthService } from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";
import { useFormState } from "react-hook-form";

import "./forgot.css";

const emailSchema = z.object({
    email: z.string().email("Enter a valid email"),
});

export default function ForgotPasswordPage() {
    // const [email, setEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(0);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpAttempts, setOtpAttempts] = useState(0);
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const { addToast } = useToast();
    const passwordSchema = z
        .object({
            newPassword: z
                .string()
                .min(8, "Password must be at least 8 characters")
                .regex(/[A-Z]/, "Must include at least one uppercase letter")
                .regex(/[a-z]/, "Must include at least one lowercase letter")
                .regex(/[0-9]/, "Must include at least one number")
                .regex(/[^A-Za-z0-9]/, "Must include at least one special character"),
            confirmPassword: z.string().min(1, "Please confirm your password"),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        });

    const getPasswordStrength = (password: string) => {
        let score = 0;
        if (!password) return 0;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++; // bonus point for length
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        // max score should be capped at 5
        return Math.min(score, 5);
    };

    const passwordRules = [
        { test: (v: string) => v.length >= 8, message: "Minimum 8 characters" },
        { test: (v: string) => /[A-Z]/.test(v), message: "At least 1 uppercase letter" },
        { test: (v: string) => /[a-z]/.test(v), message: "At least 1 lowercase letter" },
        { test: (v: string) => /[0-9]/.test(v), message: "At least 1 number" },
        { test: (v: string) => /[^A-Za-z0-9]/.test(v), message: "At least 1 special character" },
    ];

    const {
        register,
        watch: watchEmail,
        trigger,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(emailSchema),
        mode: "onChange",
    });
    const emailValue = watchEmail("email");

    const {
        register: registerPassword,
        handleSubmit: submitPasswordForm,
        watch,
        trigger: triggerPassword,
        formState: { errors: passwordErrors },
        control
    } = useForm({
        resolver: zodResolver(passwordSchema),
        mode: "onChange",
    });

    const { isValid } = useFormState({ control });

    // TIMER for RESEND OTP
    useEffect(() => {
        if (timer === 0) return;
        const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    // SEND RESET OTP
    const sendOtp = async () => {
        if (!emailValue) return;

        try {
            await AuthService.requestPasswordReset(emailValue);
            setOtpSent(true);
            setTimer(30);
            setOtpAttempts(0);
        } catch {
            addToast("Failed to send OTP", "error");
        }
    };

    // VERIFY RESET OTP
    const verifyOtp = async () => {
        if (!otp) return addToast("Enter OTP", "error");

        if (otpAttempts >= 5) {
            // addToast("Too many attempts. Request new OTP.", "error");
            return;
        }

        try {
            setIsVerifyingOtp(true);
            const res = await AuthService.verifyResetOtp(emailValue, otp);
            const token = res.data?.resetToken;

            if (!token) {
                //addToast("Invalid server response", "error");
                return;
            }

            setResetToken(token);
            setIsOtpVerified(true);
        } catch {
            setOtpAttempts((prev) => prev + 1);
            // addToast("Invalid OTP", "error");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    // RESET PASSWORD (uses Zod passwordSchema)
    const handleResetPassword = async (values: {
        newPassword: string;
        confirmPassword: string;
    }) => {
        if (!isOtpVerified) {
            addToast("Verify OTP before resetting password", "error");
            return;
        }

        try {
            await AuthService.resetPassword(emailValue, resetToken, values.newPassword);
            // addToast("Password reset successfully", "success");
            window.location.href = "/login";
        } catch {
            addToast("Failed to reset password", "error");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-modal">
                {/* LEFT SIDE */}
                <div className="auth-left">
                    <div className="logo-circle">
                        <img src="/logo.png" className="logo-img" alt="Logo" />
                    </div>
                    <h2 className="welcome-title">Welcome to RaiseAPlayer,</h2>
                    <p className="welcome-sub">India’s largest crowdfunding site</p>
                </div>

                {/* RIGHT SIDE */}
                <div className="auth-right">
                    <h3 className="forgot-title">Forgot Password</h3>
                    <p className="forgot-subtext">Reset your password securely.</p>


                    <form onSubmit={submitPasswordForm(handleResetPassword)}>


                        {/* EMAIL */}
                        <div className="input-group">
                            <div className="email-row">
                                <input
                                    type="email"
                                    className={`input-field ${errors.email ? "input-error" : ""}`}
                                    placeholder="Email"
                                    {...register("email")}
                                    // onChange={(e) => setEmail(e.target.value)}
                                    disabled={isOtpVerified}
                                />

                                {/* Inline Verify Email button */}
                                {!otpSent && !isOtpVerified && (
                                    <button
                                        type="button"
                                        className="btn btn-otp inline-otp-btn"
                                        onClick={sendOtp}
                                        disabled={!emailValue || !!errors.email}
                                    >
                                        Verify Email
                                    </button>
                                )}

                                {/* Verified badge */}
                                {isOtpVerified && (
                                    <span className="verified-badge">✔ Email Verified</span>
                                )}
                            </div>

                            {/* error text OUTSIDE the flex row */}
                            {errors.email && <p className="error-text">{errors.email.message}</p>}
                        </div>




                        {/* OTP SECTION */}
                        {otpSent && !isOtpVerified && (
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
                                        className="btn btn-verify"
                                        type="button"
                                        onClick={verifyOtp}
                                        disabled={isVerifyingOtp}
                                    >
                                        {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                                    </button>

                                    {timer > 0 ? (
                                        <span className="timer-text">Resend OTP in {timer}s</span>
                                    ) : (
                                        <button className="btn btn-resend" type="button" onClick={sendOtp}>
                                            Resend OTP
                                        </button>
                                    )}
                                </div>

                            </div>
                        )}


                        {/* NEW PASSWORD */}
                        <div className="input-group">
                            <div className="password-wrapper">
                                <input
                                    disabled={!isOtpVerified}
                                    type={newPassword ? "text" : "password"}
                                    className={`input-field ${passwordErrors.newPassword ? "input-error" : ""
                                        }`}
                                    placeholder="New Password"
                                    {...registerPassword("newPassword", {
                                        onChange: (e) => {
                                            setPasswordStrength(getPasswordStrength(e.target.value));
                                            triggerPassword("confirmPassword");
                                        },
                                    })}
                                />

                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() => isOtpVerified && setNewPassword(!newPassword)} // 🚫 disabled before OTP
                                    disabled={!isOtpVerified} // disable click
                                >
                                    {newPassword ? (
                                        <EyeOff width={20} height={20} />
                                    ) : (
                                        <Eye width={20} height={20} />
                                    )}
                                </button>
                            </div>

                            {/* Strength bar - only show AFTER OTP */}
                            {isOtpVerified && watch("newPassword")?.length > 0 && (
                                <div className="strength-bar">
                                    <div className={`strength-fill level-${passwordStrength}`}></div>
                                </div>
                            )}

                            {/* Rules - only show AFTER OTP */}
                            {isOtpVerified && watch("newPassword")?.length > 0 && (
                                <ul className="password-error-list">
                                    {passwordRules
                                        .filter((rule) => !rule.test(watch("newPassword") || ""))
                                        .map((rule, idx) => (
                                            <li key={idx}>{rule.message}</li>
                                        ))}
                                </ul>
                            )}
                        </div>


                        {/* Confirm Password */}
                        <div className="input-group">
                            <div className="password-wrapper">
                                <input
                                    disabled={!isOtpVerified}
                                    type={confirmPassword ? "text" : "password"}
                                    className={`input-field ${passwordErrors.confirmPassword ? "input-error" : ""
                                        }`}
                                    placeholder="Confirm Password"
                                    {...registerPassword("confirmPassword")}
                                />

                                <button
                                    type="button"
                                    className="password-toggle-button"
                                    onClick={() => isOtpVerified && setConfirmPassword(!confirmPassword)}
                                    disabled={!isOtpVerified}
                                >
                                    {confirmPassword ? (
                                        <EyeOff width={20} height={20} />
                                    ) : (
                                        <Eye width={20} height={20} />
                                    )}
                                </button>
                            </div>

                            {passwordErrors.confirmPassword && (
                                <p className="error-text">{passwordErrors.confirmPassword.message}</p>
                            )}
                        </div>


                        {/* RESET BUTTON */}
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ marginTop: 20 }}
                            disabled={!isValid || !isOtpVerified}
                        >
                            Reset Password
                        </button>



                    </form>

                </div>
            </div >
        </div >
    );
}
