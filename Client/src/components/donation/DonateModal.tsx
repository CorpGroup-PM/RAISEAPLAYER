"use client";

import { useState } from "react";
import { PaymentService } from "../../services/payment.service";
import "./donate-modal.css";
import { useAuth } from "@/context/AuthContext";

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

    const [amount, setAmount] = useState(2500);
    const [tip, setTip] = useState(400);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestMobile, setGuestMobile] = useState("");

    const [showGuestForm, setShowGuestForm] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const total = amount + tip;

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
                alert("Please fill all details");
                return;
            }
        }

        try {
            setLoading(true);

            const res = await PaymentService.createOrder({
                fundraiserId,
                donationAmount: amount,
                platformTipAmount: tip,
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


            console.log("Create order response:", res.data);

            const razorpay = res.data?.razorpay;

            if (!razorpay?.key || !razorpay?.orderId) {
                console.error("Invalid Razorpay data", razorpay);
                alert("Unable to start payment. Please try again.");
                return;
            }

            // 🔥 LOAD SDK BEFORE USING
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                alert("Razorpay SDK failed to load. Please try again.");
                return;
            }

            // @ts-ignore
            const rzp = new window.Razorpay({
                key: razorpay.key,
                order_id: razorpay.orderId,
                amount: razorpay.amount,
                currency: razorpay.currency || "INR",
                name: "Raise A Player",

                handler: function (response: any) {
                    console.log("Payment success:", response);
                    onClose(); // temporary — after verification, redirect to success
                },

                modal: {
                    ondismiss: function () {
                        console.log("Razorpay closed by user");
                    },
                },
            });

            rzp.open();
        } catch (err) {
            console.error("Create order failed", err);
            alert("Payment initiation failed. Please try again.");
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
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(+e.target.value)}
                    />
                </div>

                {/* TIP */}
                <div className="donate-box">
                    <label>Foundation Development Fund (₹)</label>
                    <input
                        type="number"
                        value={tip}
                        onChange={(e) => setTip(+e.target.value)}
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
        </div>
    );
}
