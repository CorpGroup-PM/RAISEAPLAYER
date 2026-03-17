"use client";

import { useState, useRef, useEffect } from "react";
import { PaymentService } from "../../services/payment.service";
import "./donate-modal.css";
import { useAuth } from "@/context/AuthContext";
import AlertModal from "@/components/ui/AlertModal";
import { logger } from "@/lib/logger";

// ── Razorpay SDK type declaration ──────────────────────────────────────────────
interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency?: string;
  name?: string;
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type Props = {
    fundraiserId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
};

export default function DonateModal({
    fundraiserId,
    isOpen,
    onClose,
    onSuccess,
}: Props) {
    const { isAuthenticated } = useAuth();

    const [amount, setAmount] = useState("2500");
    const [tip, setTip] = useState("400");
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestMobile, setGuestMobile] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; mobile?: string }>({});

    const [showGuestForm, setShowGuestForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // B-8-3: show success screen after payment instead of closing immediately
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // B-8-4: focus management — store trigger element, focus modal on open
    const modalRef = useRef<HTMLDivElement>(null);
    const prevFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            prevFocusRef.current = document.activeElement as HTMLElement;
            setTimeout(() => modalRef.current?.focus(), 0);
        } else {
            setPaymentSuccess(false);
            prevFocusRef.current?.focus();
            prevFocusRef.current = null;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // B-8-3: success screen
    if (paymentSuccess) {
        return (
            <div className="donate-overlay" role="dialog" aria-modal="true" aria-label="Donation successful">
                <div className="donate-modal donate-success-modal" ref={modalRef} tabIndex={-1}>
                    <div className="donate-header">
                        <h2>Thank you!</h2>
                        <button aria-label="Close" onClick={onClose}>×</button>
                    </div>
                    <div className="donate-success-body">
                        <div className="donate-success-icon">✓</div>
                        <p className="donate-success-msg">Your donation was received successfully. You will get a confirmation shortly.</p>
                        <button className="pay-btn" onClick={onClose}>Done</button>
                    </div>
                </div>
            </div>
        );
    }

    const numAmount = Number(amount) || 0;
    const numTip = Number(tip) || 0;
    const total = numAmount + numTip;

    /* ================= RAZORPAY SCRIPT LOADER ================= */
    const loadRazorpay = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (typeof window === "undefined") {
                resolve(false);
                return;
            }

            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;

            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);

            document.body.appendChild(script);
        });
    };

    /* ================= PAY HANDLER ================= */
    const handlePay = async () => {
        // Guest → show form first
        if (!isAuthenticated && !showGuestForm) {
            setShowGuestForm(true);
            return;
        }

        // Guest → validate details
        if (!isAuthenticated) {
            const errors: { name?: string; email?: string; mobile?: string } = {};

            if (!guestName.trim() || guestName.trim().length < 2) {
                errors.name = "Enter a valid full name";
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!guestEmail.trim() || !emailRegex.test(guestEmail.trim())) {
                errors.email = "Enter a valid email address";
            }

            const mobileRegex = /^[6-9]\d{9}$/;
            if (!mobileRegex.test(guestMobile)) {
                errors.mobile = "Enter a valid 10-digit Indian mobile number";
            }

            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
            }
            setFieldErrors({});
        }

        // Validate amounts
        if (numAmount < 1) {
            setErrorMsg("Donation amount must be at least ₹1");
            return;
        }
        if (numAmount > 1_000_000) {
            setErrorMsg("Donation amount cannot exceed ₹10,00,000");
            return;
        }

        // Prevent duplicate submissions (double-click guard)
        if (loading) return;

        try {
            setLoading(true);

            const res = await PaymentService.createOrder({
                fundraiserId,
                donationAmount: numAmount,
                platformTipAmount: numTip,
                isAnonymous,

                guestName:
                    isAnonymous ? undefined :
                        isAuthenticated ? undefined : guestName,

                guestEmail:
                    isAnonymous ? undefined :
                        isAuthenticated ? undefined : guestEmail,

                guestMobile:
                    isAnonymous ? undefined :
                        isAuthenticated ? undefined : `+91${guestMobile}`,
            });

            const razorpay = res.data?.razorpay;

            if (!razorpay?.key || !razorpay?.orderId) {
                setErrorMsg("Unable to start payment. Please try again.");
                return;
            }

            // Load SDK before using
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                setErrorMsg("Razorpay SDK failed to load. Please try again.");
                return;
            }

            const rzp = new window.Razorpay({
                key: razorpay.key,
                order_id: razorpay.orderId,
                amount: razorpay.amount,
                currency: razorpay.currency || "INR",
                name: "Raise A Player",

                handler: function (_response: any) {
                    setPaymentSuccess(true);
                    onSuccess?.();
                },

                modal: {
                    ondismiss: function () { },
                },
            });

            rzp.open();
        } catch (err) {
            logger.error("[DonateModal] Payment error", err, { fundraiserId });
            setErrorMsg("Payment could not be completed. Please try again or contact support.");
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */
    return (
        <div className="donate-overlay" role="dialog" aria-modal="true" aria-label="Make a donation">
            <div className="donate-modal" ref={modalRef} tabIndex={-1}>
                <div className="donate-header">
                    <h2>Make a secure donation</h2>
                    <button aria-label="Close" onClick={onClose}>×</button>
                </div>

                {/* DONATION AMOUNT */}
                <div className="donate-box">
                    <label>Donation Amount (₹)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, "");
                            setAmount(v);
                        }}
                    />
                </div>

                {/* TIP */}
                <div className="donate-box">
                    <label>Foundation Development Fund (₹)</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={tip}
                        onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, "");
                            setTip(v);
                        }}
                    />
                    <p className="tip-hint">
                        We charge no platform fees. Tip is optional.
                    </p>
                </div>

                {/* GUEST DETAILS */}
                {/* GUEST DETAILS (only for guests) */}
                {!isAuthenticated && showGuestForm && (
                    <div className="guest-section">
                        <h4>Your details</h4>

                        <input
                            placeholder="Full Name"
                            value={guestName}
                            className={fieldErrors.name ? "input-error" : ""}
                            onChange={(e) => { setGuestName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
                        />
                        {fieldErrors.name && <span className="field-error" role="alert">{fieldErrors.name}</span>}

                        <input
                            placeholder="Email"
                            value={guestEmail}
                            className={fieldErrors.email ? "input-error" : ""}
                            onChange={(e) => { setGuestEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                        />
                        {fieldErrors.email && <span className="field-error" role="alert">{fieldErrors.email}</span>}

                        <div className={`phone-prefix-wrap${fieldErrors.mobile ? " input-error" : ""}`}>
                            <span className="prefix">+91</span>
                            <input
                                placeholder="10-digit mobile"
                                value={guestMobile}
                                maxLength={10}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    setGuestMobile(v);
                                    setFieldErrors((p) => ({ ...p, mobile: undefined }));
                                }}
                            />
                        </div>
                        {fieldErrors.mobile && <span className="field-error" role="alert">{fieldErrors.mobile}</span>}
                    </div>
                )}

                {/* ANONYMOUS TOGGLE — FOR BOTH USERS */}
                {(isAuthenticated || showGuestForm) && (
                    <label className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={() => setIsAnonymous(!isAnonymous)}
                        />
                        Keep my details private
                    </label>
                )}


                {/* PAY BUTTON */}
                <button
                    className="pay-btn"
                    onClick={handlePay}
                    disabled={loading}
                >
                    {loading ? "Processing..." : `Continue to Pay ₹${total}`}

                </button>
            </div>

            {errorMsg && (
                <AlertModal message={errorMsg} type="error" onClose={() => setErrorMsg("")} />
            )}
        </div>
    );
}
