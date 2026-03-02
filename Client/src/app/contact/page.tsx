"use client";

import { useState } from "react";
import { z } from "zod";
import "./contact.css";
import { ContactService } from "@/services/contact.service";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setStatus(null);

  

  const form = e.currentTarget;

  const values = {
    name: (form.elements.namedItem("name") as HTMLInputElement).value,
    email: (form.elements.namedItem("email") as HTMLInputElement).value,
    phoneNumber: (form.elements.namedItem("phoneNumber") as HTMLInputElement).value,
    message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
  };

  const contactSchema = z.object({
    message: z
      .string()
      .min(10, "Message must be at least 10 characters long"),
  });

  const result = contactSchema.safeParse({
    message: values.message,
  });

  if (!result.success) {
    setStatus(result.error.issues[0].message);
    return; // ❌ stop API call
  }

  setMessageError(null);

  try {
    setLoading(true);
    const response = await ContactService.sendMessage(values);

    if (response.data?.success) {
      setStatus("Message sent successfully.");
      form.reset();
    }
  } catch (error: any) {
    setStatus(error?.response?.data?.message || "Failed to send message");
  } finally {
    setLoading(false);
  }
};

  return (
    <section className="contact-section">
      <div className="contact-container">
        {/* LEFT */}
        <div className="contact-left">
          <h1 className="contact-heading">Get In Touch With Us</h1>

          <p className="contact-description">
            Have questions or want to collaborate with RaiseaPlayer Foundation?
            Reach out to us and we’ll respond as soon as possible.
          </p>

          <div className="contact-info-box">
            <div className="contact-info-item">
              <div className="contact-icon">🏠</div>
              <div>
                <h4>Our Location</h4>
                <p>
                  Hyderabad, Telangana
                  <br />
                  India
                </p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon">📞</div>
              <div>
                <h4>Phone Number</h4>
                <p>+91 9263 10 20 30</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon">✉️</div>
              <div>
                <h4>Email Address</h4>
                <p>support@raiseaplayer.org</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="contact-form-card">
          <form className="contact-form" onSubmit={handleSubmit}>
            <input name="name" placeholder="Your Name" required />
            <input
              name="email"
              type="email"
              placeholder="Your Email"
              required
            />
            <input name="phoneNumber" placeholder="Your Phone" />
            <textarea
  name="message"
  placeholder="Your Message"
  rows={4}
  className={messageError ? "input-error" : ""}
/>
{messageError && (
  <p className="contact-error">{messageError}</p>
)}
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>

            {status && <p className="contact-status">{status}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
