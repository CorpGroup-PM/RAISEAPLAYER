"use client";

import { useState } from "react";
import { PaymentService } from "../../services/payment.service";
import "./donate-modal.css";
import { useAuth } from "@/context/AuthContext";
import AlertModal from "@/components/ui/AlertModal";

type Props = {
    fundraiserId: string;
    isOpen: boolean;
    onClose: () => void;
};

export default function DonateModal({
    fundraiserId,
    isOpen,
    onClose,
}: Props) {
    const { isAuthenticated } = useAuth();

    const [amount, setAmount] = useState("2500");
    const [tip, setTip] = useState("400");
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestMobile, setGuestMobile] = useState("");

    const [showGuestForm, setShowGuestForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    if (!isOpen) return null;

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
            if (!guestName || !guestEmail || !guestMobile) {
                setErrorMsg("Please fill all details");
                return;
            }
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
                        isAuthenticated ? undefined : guestMobile,
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

            // @ts-ignore
            const rzp = new window.Razorpay({
                key: razorpay.key,
                order_id: razorpay.orderId,
                amount: razorpay.amount,
                currency: razorpay.currency || "INR",
                name: "Raise A Player",

                handler: function (_response: any) {
                    onClose();
                },

                modal: {
                    ondismiss: function () { },
                },
            });

            rzp.open();
        } catch (_err) {
        } finally {
            setLoading(false);
        }
    };

    /* ================= UI ================= */
    return (
        <div className="donate-overlay">
            <div className="donate-modal">
                <div className="donate-header">
                    <h2>Make a secure donation</h2>
                    <button onClick={onClose}>×</button>
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
                            onChange={(e) => setGuestName(e.target.value)}
                        />

                        <input
                            placeholder="Email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                        />

                        <input
                            placeholder="Mobile Number"
                            value={guestMobile}
                            onChange={(e) => setGuestMobile(e.target.value)}
                        />
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
