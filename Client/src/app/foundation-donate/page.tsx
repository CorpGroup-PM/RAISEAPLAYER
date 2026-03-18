"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FoundationService } from "@/services/foundation.service";
import "./foundation-donate.css";


export default function FoundationDonatePage() {
  const { isAuthenticated } = useAuth();

  const [amount, setAmount] = useState("500");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    name?: string;
    email?: string;
    mobile?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 1) errors.amount = "Enter a valid amount (min ₹1)";
    if (numAmount > 1_000_000) errors.amount = "Amount cannot exceed ₹10,00,000";

    if (!isAuthenticated) {
      if (!guestName.trim() || guestName.trim().length < 2) errors.name = "Enter your full name";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!guestEmail.trim() || !emailRegex.test(guestEmail.trim())) errors.email = "Enter a valid email";
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(guestMobile)) errors.mobile = "Enter a valid 10-digit mobile number";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePay = async () => {
    if (!validate() || loading) return;

    try {
      setLoading(true);
      setErrorMsg("");

      const payload: any = { amount: Number(amount) };
      if (!isAuthenticated) {
        payload.guestName = guestName.trim();
        payload.guestEmail = guestEmail.trim();
        payload.guestMobile = `+91${guestMobile}`;
      }

      const res = await FoundationService.createOrder(payload);
      const razorpay = res.data?.razorpay;

      if (!razorpay?.key || !razorpay?.orderId) {
        setErrorMsg("Unable to start payment. Please try again.");
        return;
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        setErrorMsg("Payment SDK failed to load. Please try again.");
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpay.key,
        order_id: razorpay.orderId,
        amount: razorpay.amount,
        currency: razorpay.currency || "INR",
        name: "Raise A Player",
        handler: () => setSuccess(true),
        modal: { ondismiss: () => {} },
      });

      rzp.open();
    } catch {
      setErrorMsg("Payment could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fd-page">
        <div className="fd-card fd-success">
          <div className="fd-success-icon">✓</div>
          <h2>Thank you for your support!</h2>
          <p>Your contribution to the foundation has been received successfully.</p>
          <a href="/" className="fd-btn">Back to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="fd-page">
      <div className="fd-card">
        <div className="fd-header">
          <h1>Support Foundation Development</h1>
          <p>
            Your donation helps us build and maintain the platform that empowers
            athletes across India. Every contribution goes directly to platform
            development.
          </p>
        </div>

        {/* Amount */}
        <div className="fd-section">
          <label className="fd-label">Donation Amount (₹)</label>
          <input
            className={`fd-input${fieldErrors.amount ? " fd-input-error" : ""}`}
            type="text"
            inputMode="numeric"
            placeholder="Or enter custom amount"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "").replace(/^0+/, "");
              setAmount(v);
              setFieldErrors((err) => ({ ...err, amount: undefined }));
            }}
          />
          {fieldErrors.amount && <span className="fd-error">{fieldErrors.amount}</span>}
        </div>

        {/* Guest fields */}
        {!isAuthenticated && (
          <div className="fd-section">
            <label className="fd-label">Your Details</label>

            <input
              className={`fd-input${fieldErrors.name ? " fd-input-error" : ""}`}
              placeholder="Full Name"
              value={guestName}
              onChange={(e) => { setGuestName(e.target.value); setFieldErrors((err) => ({ ...err, name: undefined })); }}
            />
            {fieldErrors.name && <span className="fd-error">{fieldErrors.name}</span>}

            <input
              className={`fd-input${fieldErrors.email ? " fd-input-error" : ""}`}
              placeholder="Email Address"
              value={guestEmail}
              onChange={(e) => { setGuestEmail(e.target.value); setFieldErrors((err) => ({ ...err, email: undefined })); }}
            />
            {fieldErrors.email && <span className="fd-error">{fieldErrors.email}</span>}

            <div className={`fd-phone-wrap${fieldErrors.mobile ? " fd-input-error" : ""}`}>
              <span className="fd-prefix">+91</span>
              <input
                placeholder="10-digit mobile"
                value={guestMobile}
                maxLength={10}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setGuestMobile(v);
                  setFieldErrors((err) => ({ ...err, mobile: undefined }));
                }}
              />
            </div>
            {fieldErrors.mobile && <span className="fd-error">{fieldErrors.mobile}</span>}
          </div>
        )}

        {errorMsg && <p className="fd-error fd-error-block">{errorMsg}</p>}

        <button className="fd-btn fd-pay-btn" onClick={handlePay} disabled={loading}>
          {loading ? "Processing..." : `Donate ₹${Number(amount || 0).toLocaleString()}`}
        </button>
      </div>
    </div>
  );
}
