/* ================================================================
   RAISE A PLAYER — LEGAL PAGES CONTENT
   All 12 legal pages content lives here.
   ================================================================ */

export interface LegalSection {
  id: string;
  title: string;
  body: string; // HTML string (safe, no user input)
}

export interface LegalPage {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: LegalSection[];
}

const EFFECTIVE_DATE = "25/02/2025";
const LAST_UPDATED = "25/02/2025";

export const legalPages: LegalPage[] = [
  /* ─────────────────────────────────────────────────────────────
     1. TERMS & CONDITIONS
  ───────────────────────────────────────────────────────────── */
  {
    slug: "terms",
    title: "Terms & Conditions",
    subtitle:
      "Please read these terms carefully before using the Raise A Player platform.",
    category: "Legal",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "intro",
        title: "Introduction",
        body: `<p>These Terms &amp; Conditions ("Terms") govern your access to and use of the <strong>Raise A Player</strong> platform ("Platform"), operated by <strong>Navyug Raise a Player Foundation</strong> ("Foundation", "we", "us", "our").</p>
<p>By accessing or using the Platform, creating an account, making a donation, submitting a campaign, or otherwise using any services available on the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.</p>`,
      },
      {
        id: "definitions",
        title: "Definitions",
        body: `<ul>
<li><strong>Platform</strong> — the Raise A Player website/application and related services.</li>
<li><strong>Foundation</strong> — Navyug Raise a Player Foundation, a Section 8 company incorporated in India.</li>
<li><strong>User</strong> — any visitor, donor, campaign creator, beneficiary, or other person using the Platform.</li>
<li><strong>Donor</strong> — a user who makes a voluntary contribution through the Platform.</li>
<li><strong>Campaign Creator</strong> — a user who creates and submits a fundraising campaign for an athlete/beneficiary.</li>
<li><strong>Beneficiary / Athlete</strong> — the athlete for whose support the campaign is created.</li>
<li><strong>Minor Beneficiary</strong> — a beneficiary under the age of 18 years.</li>
<li><strong>Donation</strong> — a voluntary contribution made through the Platform.</li>
<li><strong>Disbursal</strong> — release/transfer of collected funds by the Foundation in accordance with applicable policies.</li>
</ul>`,
      },
      {
        id: "eligibility",
        title: "Eligibility",
        body: `<p>You must be legally competent to enter into a binding agreement under applicable Indian law to create an account, make donations, or create campaigns.</p>
<p>Campaigns for a Minor Beneficiary may only be created and managed by a parent, legal guardian, or duly authorised representative.</p>
<p>By using the Platform, you represent that the information submitted by you is true, accurate, and complete.</p>`,
      },
      {
        id: "platform-role",
        title: "Platform Role",
        body: `<p>The Platform facilitates fundraising support for athletes and related athlete development needs. Donations made through the Platform are received by Navyug Raise a Player Foundation and disbursed in accordance with the Platform's policies and verification processes.</p>
<p>The Foundation may review and verify campaign information/documents to a reasonable extent. However, the Foundation does not guarantee: fundraising success, athlete performance, athlete selection, scholarships, sponsorships, tournament outcomes, or any specific result from a campaign.</p>`,
      },
      {
        id: "account",
        title: "Account Registration and Security",
        body: `<p>Certain features may require account registration. You agree to provide accurate and updated information during registration.</p>
<p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
<p>The Foundation may suspend, restrict, or terminate accounts that provide false information, engage in fraud or misuse, violate these Terms or Platform policies, or pose legal or security risk.</p>`,
      },
      {
        id: "campaigns",
        title: "Campaign Submission, Review, and Approval",
        body: `<p>All campaigns are subject to review and approval before publication. The Foundation may request additional documents, clarifications, proof of identity, guardian consent (for minors), bank details, or supporting records before approving a campaign.</p>
<p>The Foundation may, at its sole discretion (acting reasonably), reject, pause, remove, or restrict a campaign if information appears false or misleading, required documents are not provided, there is suspected misuse/fraud, complaints are received, or the campaign violates Platform policies or applicable law.</p>`,
      },
      {
        id: "donations",
        title: "Donations",
        body: `<p>Donations made through the Platform are voluntary contributions. The Foundation currently does not charge any platform fee. However, payment gateway, banking, or transaction processing charges may apply.</p>
<p>Donors may be given the option to make donations anonymously for public display purposes. Internal records may still be maintained for compliance and transaction purposes.</p>
<p>Donations are generally non-refundable, except in limited cases such as duplicate transactions or technical/payment processing errors, subject to the Refund &amp; Cancellation Policy.</p>
<div class="legal-note">12AB and 80G registrations are currently applied for. Donors should not assume tax benefit eligibility unless and until registrations are approved and all applicable conditions are satisfied.</div>`,
      },
      {
        id: "fund-disbursal",
        title: "Fund Collection and Disbursal",
        body: `<p>Donations are collected through the Platform's payment gateway partner (currently Razorpay) and received by the Foundation.</p>
<p>Disbursal of funds is subject to: verification of beneficiary/campaign details, compliance with Platform policies, availability of required documents, bank verification, absence of unresolved complaints, and lawful use requirements.</p>
<p>The Foundation may delay, pause, or hold disbursal where there is suspected fraud or misuse, incomplete documentation, conflicting claims, legal/regulatory concerns, or a complaint under review.</p>`,
      },
      {
        id: "conduct",
        title: "User Conduct and Prohibited Activities",
        body: `<p>Users shall not:</p>
<ul>
<li>Create fake or misleading campaigns</li>
<li>Submit forged/falsified documents</li>
<li>Misuse collected funds</li>
<li>Impersonate any person/entity</li>
<li>Upload illegal, abusive, defamatory, hateful, obscene, or infringing content</li>
<li>Engage in payment fraud or chargeback abuse</li>
<li>Use the Platform for unlawful purposes</li>
</ul>
<p>The Foundation reserves the right to remove content, disable comments, suspend accounts, or take legal action where necessary.</p>`,
      },
      {
        id: "ip",
        title: "Intellectual Property",
        body: `<p>The Platform, its branding, logos, design elements, and non-user content are owned by or licensed to the Foundation. Users may not copy, reproduce, distribute, or exploit Platform content without prior written permission, except as permitted by law.</p>
<p>By uploading or submitting content, you grant the Foundation a non-exclusive, royalty-free, limited licence to use, host, store, reproduce, display, and publish such content for Platform operation, campaign display, fundraising communication, moderation, verification/compliance, and legal recordkeeping.</p>`,
      },
      {
        id: "disclaimer-clause",
        title: "Disclaimer and Limitation of Liability",
        body: `<p>The Platform is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, the Foundation shall not be liable for failure of a campaign to reach its target, beneficiary outcomes or performance, acts/omissions of users, third-party payment/technical failures, or indirect, incidental, or consequential damages arising from use of the Platform.</p>
<p>Nothing in these Terms excludes liability where such exclusion is not permitted by law.</p>`,
      },
      {
        id: "governing-law",
        title: "Governing Law and Jurisdiction",
        body: `<p>These Terms shall be governed by the laws of India. Subject to applicable law, courts at Hyderabad, Telangana shall have jurisdiction in relation to disputes arising from these Terms.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>For queries relating to these Terms, please contact:</p>
<p><strong>Navyug Raise a Player Foundation</strong><br/>
CIN: U93120TS2025NPL207492 · PAN: AALCN0816H<br/>
Support: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Grievance: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     2. PRIVACY POLICY
  ───────────────────────────────────────────────────────────── */
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    subtitle:
      "How we collect, use, store, share, and protect your personal information.",
    category: "Privacy",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "who-we-are",
        title: "Who We Are",
        body: `<p>Raise A Player is a fundraising platform operated by <strong>Navyug Raise a Player Foundation</strong> (CIN: U93120TS2025NPL207492, PAN: AALCN0816H). This Privacy Policy describes how we collect, use, store, share, and protect personal information when you use our Platform.</p>`,
      },
      {
        id: "scope",
        title: "Scope",
        body: `<p>This Privacy Policy applies to personal information collected through: the Platform, account registration forms, campaign submission forms, donation checkout pages, support/grievance communication, report-a-campaign forms, and cookies/analytics technologies.</p>`,
      },
      {
        id: "info-collected",
        title: "Information We Collect",
        body: `<p><strong>Donor Information:</strong> name, email, mobile number, address, PAN/tax-related details (if requested), donation amount and transaction details, payment status, communication preferences, device/browser/IP/cookie data.</p>
<p><strong>Campaign Creator / Beneficiary Information:</strong> full name, contact information, date of birth/age, athlete profile and sport-related information, identity/KYC documents, bank account details, supporting documents, campaign story, photos, videos, updates.</p>
<p><strong>Minor Beneficiary Information:</strong> collected through a parent/legal guardian, including the minor's name/age/category, guardian information and authorisation, consent for use/publication of details.</p>
<p><strong>Automatically Collected:</strong> IP address, browser type, device type, operating system, pages visited, referral URLs, date/time access logs, cookies and similar technologies.</p>`,
      },
      {
        id: "public-info",
        title: "Publicly Visible Campaign Information",
        body: `<p>Certain information may be visible to the public including: campaign title, campaign story/description, athlete/beneficiary name (subject to consent), campaign images/videos, target amount and amount raised, campaign updates, and comments (if enabled).</p>
<p>If anonymous donation is selected, the donor's public display name may not be shown, though transaction records may still be maintained internally for compliance.</p>`,
      },
      {
        id: "how-we-use",
        title: "How We Use Information",
        body: `<ul>
<li>To create and manage accounts</li>
<li>To review and verify campaigns</li>
<li>To process donations and transaction records</li>
<li>To manage disbursal of funds</li>
<li>To communicate with donors/campaign creators/beneficiaries</li>
<li>To send transaction confirmations/updates</li>
<li>To detect, prevent, and investigate fraud or misuse</li>
<li>To comply with legal, regulatory, accounting, and audit obligations</li>
<li>To operate, secure, and improve the Platform</li>
<li>To moderate content and comments</li>
</ul>`,
      },
      {
        id: "payment-processing",
        title: "Payment Processing (Razorpay)",
        body: `<p>Donations are processed using Razorpay. Payment-related data may be collected/processed by Razorpay in accordance with their terms and privacy practices. We may receive transaction-related information necessary to confirm payment status, process records, handle support, and manage refunds.</p>`,
      },
      {
        id: "sharing",
        title: "Sharing of Information",
        body: `<p>We may share information only as reasonably necessary, including with: payment gateway partners (e.g., Razorpay), banking/payment processing institutions, hosting/cloud and infrastructure service providers, email/SMS/notification service providers, KYC/verification service providers, professional advisors, auditors, or compliance support providers, and legal/regulatory/government authorities where required by law.</p>
<p><strong>We do not sell personal information to third parties for unrelated commercial use.</strong></p>`,
      },
      {
        id: "minors",
        title: "Minor Beneficiaries and Guardian Consent",
        body: `<p>Campaigns involving a minor beneficiary must be submitted by a parent/legal guardian/authorised representative. The person submitting such campaign confirms they are authorised to provide the minor's information and grant required consents.</p>
<p>The Foundation may require additional verification or documentation before publication or disbursal in minor-related campaigns. We may apply additional caution in the display and handling of minor-related information.</p>`,
      },
      {
        id: "retention",
        title: "Data Retention",
        body: `<p>We retain personal information for as long as reasonably necessary for Platform operations, campaign and donation records, disbursal and audit trails, fraud prevention/investigation, legal/regulatory/accounting compliance, and dispute and grievance handling.</p>`,
      },
      {
        id: "security",
        title: "Security Measures",
        body: `<p>We implement reasonable technical and organisational measures to protect information against unauthorised access, loss, misuse, or alteration. However, no system can be guaranteed to be completely secure. Users are also responsible for maintaining the confidentiality of their account credentials.</p>`,
      },
      {
        id: "cookies-section",
        title: "Cookies and Tracking Technologies",
        body: `<p>We may use cookies and similar technologies for essential site functionality, session management, analytics and performance, security, and user experience improvements. For more details, please refer to our <a href="/legal/cookie-policy">Cookie Policy</a>.</p>`,
      },
      {
        id: "user-rights",
        title: "User Rights / Requests",
        body: `<p>Subject to applicable law and legal/compliance obligations, users may request: access to certain personal information, correction/update of inaccurate information, deletion of certain information (where feasible and legally permissible), withdrawal of consent, and grievance escalation.</p>
<p>To make a request, contact: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
      {
        id: "contact",
        title: "Contact / Grievance",
        body: `<p><strong>Navyug Raise a Player Foundation</strong><br/>
CIN: U93120TS2025NPL207492 · PAN: AALCN0816H<br/>
Registered Office: Unit-NO: 7-140/2, E 5, Left Portion, Nagendra Nagar, Scientist Colony, Habsiguda, Hyderabad — 500 007, Telangana, India<br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     3. REFUND & CANCELLATION POLICY
  ───────────────────────────────────────────────────────────── */
  {
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    subtitle:
      "Understand when and how refunds are processed for donations on Raise A Player.",
    category: "Payments",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "general",
        title: "General Refund Policy",
        body: `<p>Donations made on the Platform are voluntary contributions and are <strong>generally non-refundable</strong>. Refunds are only considered in the limited circumstances described below.</p>`,
      },
      {
        id: "eligible-cases",
        title: "Eligible Refund Cases",
        body: `<p>A refund request may be considered in the following cases:</p>
<ul>
<li><strong>Duplicate Transaction:</strong> The donor was charged more than once for the same intended donation.</li>
<li><strong>Technical / Payment Processing Error:</strong> An incorrect amount was debited due to a technical issue, or an amount was debited but the transaction failed due to a payment processing error (subject to verification).</li>
<li><strong>Other Similar Technical Cases:</strong> Any demonstrable technical or gateway-related error causing unintended debit, subject to review by the Foundation and payment partner records.</li>
</ul>`,
      },
      {
        id: "non-refund",
        title: "Non-Refund Cases",
        body: `<p>Refunds will generally <strong>not</strong> be provided for:</p>
<ul>
<li>Change of mind after a successful donation</li>
<li>Donor dissatisfaction after a valid donation</li>
<li>Campaign not reaching its target amount</li>
<li>Misunderstanding of campaign goals where disclosures were already made</li>
<li>Request made without valid transaction proof</li>
<li>Delay in campaign outcome/performance/athlete result</li>
</ul>`,
      },
      {
        id: "cancellation",
        title: "Cancellation",
        body: `<p>Once a donation transaction is successfully completed, it cannot be cancelled by the donor through the Platform. Any refund, if eligible, shall be processed only in accordance with this Policy.</p>`,
      },
      {
        id: "process",
        title: "Refund Request Process",
        body: `<p>To request a refund for an eligible case, the donor must contact the Foundation with the following details:</p>
<ul>
<li>Donor name</li>
<li>Registered email/mobile number</li>
<li>Transaction ID / Payment reference ID</li>
<li>Date and amount of donation</li>
<li>Reason for refund request</li>
<li>Supporting screenshots/documents (if any)</li>
</ul>
<p>Send requests to: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Subject line (recommended): <em>Refund Request – [Transaction ID]</em></p>`,
      },
      {
        id: "timeline",
        title: "Refund Request Timeline",
        body: `<p>Refund requests for eligible cases should be submitted within <strong>7 days</strong> from the date of transaction. Late requests may be reviewed at the Foundation's discretion depending on case details and payment partner records.</p>`,
      },
      {
        id: "processing",
        title: "Review and Processing",
        body: `<p>The Foundation will review the request and verify transaction details with internal records and, where necessary, payment gateway/payment partner data (including Razorpay records).</p>
<p>If approved, the refund will typically be initiated to the original payment source, subject to payment partner and banking rules. Actual credit time may vary depending on payment gateway processing, bank/card issuer timelines, and UPI/payment method used.</p>`,
      },
      {
        id: "chargebacks",
        title: "Chargebacks and Disputes",
        body: `<p>In case of payment disputes or chargebacks, the Foundation may cooperate with the payment gateway, banks, and relevant parties by sharing necessary transaction records and case information, subject to applicable law and privacy obligations.</p>`,
      },
      {
        id: "contact",
        title: "Contact and Escalation",
        body: `<p>Support Email: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>
<p>If you are not satisfied with the response, you may escalate your complaint through the <a href="/legal/grievance">Grievance Redressal</a> process.</p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     4. DONOR POLICY
  ───────────────────────────────────────────────────────────── */
  {
    slug: "donor-policy",
    title: "Donor Policy",
    subtitle:
      "Terms and expectations applicable to users making donations through Raise A Player.",
    category: "Donors",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "nature",
        title: "Nature of Donations",
        body: `<p>Donations made on Raise A Player are voluntary contributions intended to support athlete-related fundraising campaigns hosted on the Platform.</p>
<p>Donations are <strong>not investments, deposits, loans, or purchases of financial products</strong>, and do not create ownership or repayment rights.</p>`,
      },
      {
        id: "donation-flow",
        title: "Donation Flow",
        body: `<p>Donations made on the Platform are received by <strong>Navyug Raise a Player Foundation</strong>. Funds are managed and disbursed by the Foundation in accordance with the Platform's policies, verification processes, and compliance requirements.</p>`,
      },
      {
        id: "anonymous",
        title: "Anonymous Donations",
        body: `<p>The Platform may provide donors with an option to make their donation display as <em>Anonymous</em> on the public campaign page.</p>
<p>Anonymous display only affects public visibility. The Foundation may still maintain internal transaction records and donor details for compliance, accounting, or legal requirements.</p>`,
      },
      {
        id: "platform-fee",
        title: "Platform Fee",
        body: `<p>The Foundation currently does not charge a platform fee for donations made through Raise A Player. Payment gateway, bank, or processing charges may still apply depending on the payment method and service providers.</p>`,
      },
      {
        id: "tax",
        title: "Tax Benefit Clarification",
        body: `<div class="legal-note">12AB and 80G registrations are currently applied for. Donors should not assume tax deduction/tax benefit eligibility unless and until the relevant registration(s) are approved and all applicable legal conditions are satisfied. A payment confirmation/transaction acknowledgement is <strong>not</strong> the same as a tax exemption receipt.</div>`,
      },
      {
        id: "responsibilities",
        title: "Donor Responsibilities",
        body: `<p>Donors agree to:</p>
<ul>
<li>Provide accurate information where requested</li>
<li>Use lawful and authorised payment methods</li>
<li>Not engage in fraudulent transactions or chargeback abuse</li>
<li>Not misuse Platform communication or comments</li>
<li>Review campaign details and exercise personal judgement before donating</li>
</ul>`,
      },
      {
        id: "verification-disclaimer",
        title: "Campaign Information and Verification Disclaimer",
        body: `<p>The Foundation may review and verify campaign information/documents to a reasonable extent. However, the Foundation does not guarantee completeness or absolute accuracy of all campaign information, fundraising success, or athlete outcomes.</p>
<p>Donors are encouraged to read campaign descriptions and updates carefully before contributing.</p>`,
      },
      {
        id: "refunds",
        title: "Refunds",
        body: `<p>Donations are generally non-refundable except in limited cases such as duplicate transactions or technical/payment errors, as set out in the <a href="/legal/refund-policy">Refund &amp; Cancellation Policy</a>.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>Support Email: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     5. CAMPAIGN CREATOR POLICY
  ───────────────────────────────────────────────────────────── */
  {
    slug: "campaign-creator-policy",
    title: "Campaign Creator Policy",
    subtitle:
      "Guidelines and obligations for anyone submitting or managing a fundraising campaign.",
    category: "Campaigns",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "who-can-create",
        title: "Who May Create a Campaign",
        body: `<p>A campaign may be created by: an adult athlete (for self), a parent/legal guardian (for a minor athlete), or an authorised representative (such as coach/academy/family member), subject to proof of authorisation and Foundation approval.</p>
<p>The Foundation may require documentary proof of identity, relationship, or authorisation before approval or disbursal.</p>`,
      },
      {
        id: "minor-campaigns",
        title: "Campaigns for Minor Beneficiaries",
        body: `<p>Campaigns involving a minor beneficiary must be submitted and managed by a parent/legal guardian or duly authorised representative. The campaign creator must provide guardian/representative details, authorisation/relationship proof, and consent for use/publication of the minor's campaign information and media.</p>`,
      },
      {
        id: "mandatory-docs",
        title: "Mandatory Information and Documents",
        body: `<p>Campaign creators may be required to submit:</p>
<ul>
<li>Identity proof and contact details</li>
<li>Athlete/beneficiary details</li>
<li>Purpose and need for funds</li>
<li>Cost estimates/quotations/invoices (where available)</li>
<li>Bank account details for disbursal</li>
<li>Supporting sports-related documents/certificates/proofs</li>
<li>Guardian authorisation and consent (for minors)</li>
</ul>
<p>Failure to provide required information may delay or prevent campaign approval/disbursal.</p>`,
      },
      {
        id: "verification",
        title: "Verification and Approval",
        body: `<p>All campaigns are subject to Foundation review and approval. The Foundation may request additional documents, clarifications, or verification steps at any time. The Foundation is not obligated to approve every campaign and may reject or remove campaigns that do not meet policy, legal, or verification requirements.</p>`,
      },
      {
        id: "truthfulness",
        title: "Truthfulness and Accuracy",
        body: `<p>Campaign creators must ensure all campaign information is truthful, accurate, and not misleading. Campaign creators shall not: submit forged/falsified documents, exaggerate or fabricate achievements/needs, impersonate athletes/guardians, or provide misleading claims to influence donations.</p>
<p>Campaign creators must update material changes where relevant (e.g., event completed, funding need changed, beneficiary status changed).</p>`,
      },
      {
        id: "permitted-uses",
        title: "Permitted Uses of Funds",
        body: `<p>Funds raised are expected to be used only for stated and approved athlete-related purposes, which may include:</p>
<ul>
<li>Coaching/training fees and academy fees</li>
<li>Tournament registration fees</li>
<li>Travel and related participation expenses</li>
<li>Sports equipment/gear</li>
<li>Rehabilitation/physiotherapy/sports medicine support</li>
<li>Other athlete development expenses disclosed in the campaign</li>
</ul>`,
      },
      {
        id: "prohibited-uses",
        title: "Prohibited Uses of Funds",
        body: `<p>Funds must <strong>not</strong> be used for: personal luxury expenses, gambling/betting activities, unlawful activities, undisclosed unrelated purposes, misleading or fraudulent diversion of funds, or any use prohibited by law or Platform policy.</p>`,
      },
      {
        id: "utilization-proof",
        title: "Utilisation Proof and Updates",
        body: `<p>Campaign creators agree to provide campaign updates and/or supporting proof of utilisation when reasonably requested by the Foundation. Such proof may include invoices, receipts, registration confirmations, travel proofs, fee receipts, or other supporting records.</p>
<p>Failure to cooperate may lead to hold/restriction on disbursal or other action.</p>`,
      },
      {
        id: "violations",
        title: "Violations and Enforcement",
        body: `<p>If a campaign creator violates this Policy, the Foundation may take action including but not limited to: request correction/clarification, pause or remove the campaign, hold or stop disbursal, restrict or suspend account access, report suspected unlawful conduct to authorities, or take other legal or policy-based action.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>Support Email: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     6. KYC & VERIFICATION POLICY
  ───────────────────────────────────────────────────────────── */
  {
    slug: "kyc-policy",
    title: "KYC & Verification Policy",
    subtitle:
      "How we verify campaigns, beneficiaries, and related information on the Platform.",
    category: "Verification",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "purpose",
        title: "Purpose of Verification",
        body: `<p>The Foundation may conduct verification to support donor trust, fraud prevention, lawful and responsible disbursal of funds, policy compliance, and safety and misuse prevention.</p>`,
      },
      {
        id: "who-verified",
        title: "Who May Be Verified",
        body: `<p>Depending on the campaign and risk level, the Foundation may verify:</p>
<ul>
<li>Campaign creator</li>
<li>Athlete/beneficiary</li>
<li>Minor beneficiary's parent/legal guardian</li>
<li>Authorised representative (coach/family member/academy representative)</li>
<li>Bank account holder/recipient</li>
<li>Supporting information/documents relevant to the campaign</li>
</ul>`,
      },
      {
        id: "types",
        title: "Types of Verification",
        body: `<p>Verification may include: identity verification, contact verification (email/mobile), relationship/authorisation verification (especially for minor beneficiaries), bank account verification, review of supporting documents, and additional checks in case of complaints, suspicious activity, or high-risk campaigns.</p>`,
      },
      {
        id: "timing",
        title: "Timing of Verification",
        body: `<p>Verification may be conducted: before campaign publication, during a live campaign, before disbursal, after complaints or reports, or at any other stage where reasonably necessary.</p>`,
      },
      {
        id: "outcomes",
        title: "Verification Outcomes",
        body: `<p>A campaign or account may be marked/handled as: approved, pending additional information, under review, rejected, or paused/restricted. The Foundation may act based on verification findings in accordance with Platform policies.</p>`,
      },
      {
        id: "ongoing",
        title: "Ongoing Review and Re-Verification",
        body: `<p>Verification is not a one-time guarantee. The Foundation may revisit or re-verify campaigns/accounts if new information, complaints, or concerns arise.</p>`,
      },
      {
        id: "disclaimer",
        title: "Verification Disclaimer",
        body: `<p>Verification reduces risk but does not amount to a guarantee of fundraising success, beneficiary outcome, or absolute correctness of all facts at all times.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>Support Email: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     7. FUND DISBURSAL & UTILIZATION POLICY
  ───────────────────────────────────────────────────────────── */
  {
    slug: "fund-disbursal-policy",
    title: "Fund Disbursal & Utilisation Policy",
    subtitle:
      "How donations collected through Raise A Player are received, reviewed, disbursed, and monitored.",
    category: "Finance",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "collection",
        title: "Collection of Funds",
        body: `<p>Donations made on the Platform are processed through the Platform's payment partner (currently Razorpay) and received by Navyug Raise a Player Foundation. The Foundation currently does not charge a platform fee. However, payment processing or banking charges may apply depending on transaction method and payment partner rules.</p>`,
      },
      {
        id: "disbursal-model",
        title: "Disbursal Model",
        body: `<p>Funds are disbursed by the Foundation in accordance with campaign purpose, verification outcomes, policy compliance, supporting documents, and lawful and responsible use requirements.</p>
<p>The Foundation may disburse funds to the beneficiary, parent/legal guardian (for minor beneficiary), or authorised recipient/representative, as applicable and approved.</p>`,
      },
      {
        id: "pre-disbursal",
        title: "Pre-Disbursal Checks",
        body: `<p>Before disbursal, the Foundation may verify or review: identity/KYC details, bank account details, campaign compliance status, supporting proof/documents, complaint status (if any), and utilisation requirements.</p>`,
      },
      {
        id: "utilization",
        title: "Utilisation Expectations",
        body: `<p>Funds are expected to be used only for the athlete-related purpose(s) stated in the campaign and accepted by the Foundation. The Foundation may request campaign creators/beneficiaries to provide updates and supporting proof such as invoices, receipts, fee payment records, registration proof, travel/supporting documents, or other relevant utilisation evidence.</p>`,
      },
      {
        id: "holds",
        title: "Holds, Delays, and Restrictions",
        body: `<p>The Foundation may delay, pause, or restrict disbursal in cases including: incomplete documentation, failed verification, suspected misuse or fraud, complaint/report under review, inconsistencies in submitted information, legal/regulatory issues, or payment settlement/technical issues.</p>`,
      },
      {
        id: "misuse",
        title: "Misuse Handling",
        body: `<p>If the Foundation reasonably suspects misuse, diversion, or misrepresentation, it may: seek clarification and documents, pause further disbursal, remove or restrict the campaign, take policy enforcement action, or escalate/report where legally required.</p>`,
      },
      {
        id: "transparency",
        title: "Public Transparency and Display",
        body: `<p>Campaign information such as campaign title, goal amount, amount raised, updates, and comments (if enabled) may be publicly displayed. Donor names may be publicly displayed unless the donor selects anonymous donation display (if available).</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>Support Email: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     8. GRIEVANCE REDRESSAL & COMPLAINTS
  ───────────────────────────────────────────────────────────── */
  {
    slug: "grievance",
    title: "Grievance Redressal & Complaints",
    subtitle:
      "How to submit and escalate complaints relating to the Raise A Player platform.",
    category: "Support",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "who-can-file",
        title: "Who Can File a Complaint",
        body: `<p>Complaints may be submitted by donors, campaign creators, beneficiaries/guardians, users/visitors, and persons affected by content or conduct on the Platform.</p>`,
      },
      {
        id: "types",
        title: "Types of Complaints",
        body: `<ul>
<li>Donation/payment issues</li>
<li>Refund request disputes</li>
<li>Fake or misleading campaigns</li>
<li>Misuse/diversion of funds concerns</li>
<li>Privacy/data concerns</li>
<li>Inappropriate/abusive comments or content</li>
<li>Impersonation or identity misuse</li>
<li>Copyright/IP concerns</li>
<li>Account access issues</li>
</ul>`,
      },
      {
        id: "how-to-submit",
        title: "How to Submit a Complaint",
        body: `<p>You may submit a complaint by email and/or through the "Report a Campaign" / grievance form on the Platform. Please provide, where applicable:</p>
<ul>
<li>Full name and email and/or mobile number</li>
<li>Your user type (donor/campaign creator/visitor/etc.)</li>
<li>Campaign URL or account details</li>
<li>Transaction ID/payment reference (for payment/refund complaints)</li>
<li>Detailed description of the issue</li>
<li>Supporting documents/screenshots</li>
</ul>
<p>Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
      {
        id: "review-process",
        title: "Complaint Review Process",
        body: `<p>The Foundation will review complaints and may seek additional information before taking action. Depending on the nature of the complaint, the Foundation may: request clarification from relevant users, temporarily pause campaign/disbursal/comment access, remove content, reject the complaint if unsupported, or escalate internally or externally where necessary.</p>`,
      },
      {
        id: "timelines",
        title: "Timelines",
        body: `<p>The Foundation will aim to respond within reasonable timelines:</p>
<ul>
<li><strong>Acknowledgement:</strong> within 2 business days</li>
<li><strong>Initial review/update:</strong> within 5 business days</li>
<li><strong>Resolution target:</strong> within 15 business days (subject to complexity)</li>
</ul>`,
      },
      {
        id: "escalation",
        title: "Escalation — Grievance Officer",
        body: `<p>If you are not satisfied with the initial response, you may escalate the matter to the Grievance Officer.</p>
<div class="legal-note legal-note--info">The Grievance Officer details (name and designation) will be published before the Platform goes live, as required under applicable law.</div>
<p>Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a><br/>
Postal Address: Navyug Raise a Player Foundation, Nagendra Nagar, Scientist Colony, Habsiguda, Hyderabad — 500 007, Telangana, India</p>`,
      },
      {
        id: "false-complaints",
        title: "False / Malicious Complaints",
        body: `<p>The Foundation may take appropriate action against users who repeatedly submit knowingly false, abusive, or malicious complaints.</p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     9. DISCLAIMER
  ───────────────────────────────────────────────────────────── */
  {
    slug: "disclaimer",
    title: "Disclaimer",
    subtitle:
      "Important limitations and disclaimers applicable to the Raise A Player platform.",
    category: "Legal",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "facilitation",
        title: "Platform Facilitation Disclaimer",
        body: `<p>Raise A Player is a fundraising facilitation platform for athlete-related support campaigns. The Foundation receives donations and administers disbursal in accordance with Platform policies and verification processes.</p>`,
      },
      {
        id: "no-guarantee",
        title: "No Guarantee of Outcomes",
        body: `<p>The Foundation does not guarantee:</p>
<ul>
<li>Campaign target achievement</li>
<li>Athlete performance, selection, or results</li>
<li>Sponsorship/scholarship opportunities</li>
<li>Tournament outcomes</li>
<li>Rehabilitation/recovery outcomes</li>
<li>Any specific result from a donation or campaign</li>
</ul>`,
      },
      {
        id: "info-accuracy",
        title: "Information Accuracy Disclaimer",
        body: `<p>Campaign content, stories, updates, and supporting information are largely provided by campaign creators, beneficiaries, guardians, or authorised representatives. While the Foundation may conduct review/verification to a reasonable extent, it does not guarantee absolute accuracy, completeness, or timeliness of all campaign information.</p>`,
      },
      {
        id: "third-party",
        title: "Third-Party Services Disclaimer",
        body: `<p>The Platform may depend on third-party services including payment gateway providers (such as Razorpay), hosting/infrastructure providers, email/SMS services, and other technology vendors. The Foundation is not responsible for downtime, delays, or errors caused solely by such third-party services.</p>`,
      },
      {
        id: "no-advice",
        title: "No Legal / Tax / Financial Advice",
        body: `<p>Information on the Platform (including donation/tax-related information) is provided for general informational purposes only and does not constitute legal, tax, accounting, financial, or professional advice. Users should consult qualified professionals before making decisions based on such information.</p>`,
      },
      {
        id: "external-links",
        title: "External Links and User-Generated Content",
        body: `<p>The Platform may contain links to third-party websites or user-generated content (including comments, if enabled). The Foundation is not responsible for the content, accuracy, or practices of third-party websites or user-generated content posted by users.</p>`,
      },
      {
        id: "limitation",
        title: "Limitation Subject to Law",
        body: `<p>Nothing in this Disclaimer excludes liability where such exclusion is not permitted by applicable law.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>Support Email: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     10. LEGAL IDENTITY & REGISTRATIONS
  ───────────────────────────────────────────────────────────── */
  {
    slug: "legal-identity",
    title: "Legal Identity & Registrations",
    subtitle:
      "Official legal and registration information for Navyug Raise a Player Foundation.",
    category: "Legal",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "org-name",
        title: "Organisation Name",
        body: `<p><strong>Navyug Raise a Player Foundation</strong></p>`,
      },
      {
        id: "legal-status",
        title: "Legal Status",
        body: `<p>Navyug Raise a Player Foundation is a <strong>Section 8 company incorporated in India</strong> and operates the Raise A Player platform to support athlete-focused fundraising initiatives.</p>`,
      },
      {
        id: "corporate-id",
        title: "Corporate Identification",
        body: `<p><strong>CIN:</strong> U93120TS2025NPL207492<br/>
<strong>PAN:</strong> AALCN0816H</p>`,
      },
      {
        id: "registered-office",
        title: "Registered Office Address",
        body: `<p>Unit-NO: 7-140/2, E 5, Left Portion, Nagendra Nagar, Scientist Colony, Habsiguda, Hyderabad — 500 007, Telangana, India</p>`,
      },
      {
        id: "tax-status",
        title: "Tax / Exemption Registration Status",
        body: `<div class="legal-note"><strong>12AB:</strong> Applied<br/><strong>80G:</strong> Applied<br/><br/>Tax benefit eligibility on donations, if any, will be subject to approval of applicable registrations and satisfaction of applicable legal conditions.</div>`,
      },
      {
        id: "foreign-donations",
        title: "Foreign Donations",
        body: `<p>Foreign donations are <strong>not accepted</strong> as of now. If this changes in future, this page and all relevant policies will be updated only after legal compliance is in place.</p>`,
      },
      {
        id: "donation-flow",
        title: "Donation Flow Disclosure",
        body: `<p>Donations made through Raise A Player are received by Navyug Raise a Player Foundation and managed/disbursed in accordance with Platform policies and applicable requirements.</p>`,
      },
      {
        id: "payment-gateway",
        title: "Payment Gateway",
        body: `<p>Current payment gateway partner: <strong>Razorpay</strong></p>`,
      },
      {
        id: "platform-fee",
        title: "Platform Fee",
        body: `<p>The Foundation currently does not charge a platform fee. Payment processing/banking charges may apply depending on payment method and partner systems.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>Support Email: <a href="mailto:support@raiseaplayer.org">support@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     11. REPORT A CAMPAIGN
  ───────────────────────────────────────────────────────────── */
  {
    slug: "report-campaign",
    title: "Report a Campaign",
    subtitle:
      "How to flag campaigns or content that you believe violates Platform policies.",
    category: "Safety",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "what-to-report",
        title: "What You Can Report",
        body: `<ul>
<li>Fake or misleading campaign claims</li>
<li>Suspected misuse/diversion of funds</li>
<li>Impersonation or unauthorised campaign creation</li>
<li>Inappropriate or abusive content</li>
<li>Harassment in comments</li>
<li>Copyright/IP concerns</li>
<li>Privacy-related concerns</li>
<li>Any other policy violation</li>
</ul>`,
      },
      {
        id: "info-to-include",
        title: "Information to Include in Your Report",
        body: `<p>Please provide as much detail as possible:</p>
<ul>
<li>Your name and email/mobile number</li>
<li>Campaign URL / campaign name</li>
<li>Category of complaint</li>
<li>Description of the concern</li>
<li>Supporting screenshots/documents (if available)</li>
<li>Any relevant transaction reference (if applicable)</li>
</ul>
<p>Report Email: <a href="mailto:report@raiseaplayer.org">report@raiseaplayer.org</a></p>`,
      },
      {
        id: "good-faith",
        title: "Good-Faith Reporting",
        body: `<p>By submitting a report, you confirm that the information provided by you is true to the best of your knowledge and that the report is being made in good faith.</p>`,
      },
      {
        id: "after-report",
        title: "What Happens After You Report",
        body: `<p>After receiving a report, the Foundation may: acknowledge receipt, review the report and available records, request additional information, contact relevant users, temporarily pause campaign/disbursal/comment features (if necessary), and take appropriate action as per Platform policies and applicable law.</p>`,
      },
      {
        id: "no-immediate-action",
        title: "No Immediate Action Guarantee",
        body: `<p>Submitting a report does not guarantee immediate removal or takedown. The Foundation may review available evidence before taking action.</p>`,
      },
      {
        id: "false-reports",
        title: "False or Malicious Reports",
        body: `<p>Knowingly false, abusive, or malicious reporting may lead to restrictions or other appropriate action.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>Report Email: <a href="mailto:report@raiseaplayer.org">report@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     12. COOKIE POLICY
  ───────────────────────────────────────────────────────────── */
  {
    slug: "cookie-policy",
    title: "Cookie Policy",
    subtitle:
      "How Raise A Player uses cookies and similar technologies on the Platform.",
    category: "Privacy",
    effectiveDate: EFFECTIVE_DATE,
    lastUpdated: LAST_UPDATED,
    sections: [
      {
        id: "what-are-cookies",
        title: "What Are Cookies?",
        body: `<p>Cookies are small text files stored on your device when you visit a website. They help websites function properly, remember preferences, improve user experience, and understand site usage.</p>`,
      },
      {
        id: "types",
        title: "Types of Cookies We May Use",
        body: `<p><strong>Essential Cookies:</strong> Necessary for the Platform to function properly — session management, login/authentication support, security and fraud prevention, and core site functionality.</p>
<p><strong>Performance / Analytics Cookies:</strong> These help us understand how users interact with the Platform (page visits, feature usage, performance metrics) so we can improve the site.</p>
<p><strong>Functional Cookies:</strong> These may remember preferences or settings to improve user experience.</p>
<p><strong>Marketing / Tracking Cookies:</strong> Not currently used. If the Platform uses such cookies in the future, this policy will be updated accordingly.</p>`,
      },
      {
        id: "third-party-cookies",
        title: "Third-Party Cookies",
        body: `<p>Some cookies may be placed by third-party services used on the Platform (e.g., analytics tools, payment-related embedded services, or other integrations), subject to their own policies.</p>`,
      },
      {
        id: "managing-cookies",
        title: "How You Can Manage Cookies",
        body: `<p>You can manage or disable cookies through your browser settings. Please note that disabling essential cookies may affect Platform functionality. If a cookie consent banner/tool is implemented, you may also manage preferences through that tool.</p>`,
      },
      {
        id: "effect-of-disabling",
        title: "Effect of Disabling Cookies",
        body: `<p>If you disable some or all cookies: certain features may not work properly, login/session behaviour may be affected, and user experience may be reduced.</p>`,
      },
      {
        id: "contact",
        title: "Contact",
        body: `<p>For questions regarding this Cookie Policy:<br/>
Privacy Email: <a href="mailto:privacy@raiseaplayer.org">privacy@raiseaplayer.org</a><br/>
Grievance Email: <a href="mailto:grievance@raiseaplayer.org">grievance@raiseaplayer.org</a></p>`,
      },
    ],
  },
];

export function getLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((p) => p.slug === slug);
}

export function getAllLegalSlugs(): string[] {
  return legalPages.map((p) => p.slug);
}
