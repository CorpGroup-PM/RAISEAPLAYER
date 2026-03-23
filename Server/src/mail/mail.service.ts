import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as hbs from 'handlebars';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    try {
      if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        throw new Error('MAIL_USER or MAIL_PASS not set');
      }

      this.transporter = nodemailer.createTransport({
        host: "p3plzcpnl505439.prod.phx3.secureserver.net",
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      this.logger.log('Mail Service initialized using Gmail SMTP');
    } catch (error) {
      this.logger.error('Failed to initialize mail transporter', error);
      throw new InternalServerErrorException(
        'Mail service initialization failed',
      );
    }
  }

  // Load & compile Handlebars template
  private renderTemplate(templatePath: string, context: any = {}) {
    try {
      const filePath = path.join(
        process.cwd(),
        'src',
        'mail',
        'templates',
        templatePath,
      );

      const templateSource = fs.readFileSync(filePath, 'utf8');
      const compiledTemplate = hbs.compile(templateSource);

      return compiledTemplate(context);
    } catch (error) {
      this.logger.error('Email template rendering failed', error);
      throw new InternalServerErrorException('Failed to render email template');
    }
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    attachments?: {
      filename: string;
      content: Buffer;
      contentType: string;
    }[],
  ) {
    try {
      await this.transporter.sendMail({
        from: `"RaiseAPlayer" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
        attachments,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email to "${to}" with subject "${subject}"`,
        error instanceof Error ? error.stack : error,
      );
      // Re-throw so callers can decide to handle (e.g. webhook wraps in its own try/catch)
      throw error;
    }
  }


  // Email OTP verification
  async sendUserConfirmation(email: string, otp: string) {
    const html = this.renderTemplate('otp/otp.hbs', { otp });
    await this.sendMail(email, 'Confirm Your Email', html);
  }

  // Password reset OTP
  async sendPasswordReset(email: string, otp: string) {
    const html = this.renderTemplate('otp/otp.hbs', { otp });
    await this.sendMail(email, 'Reset Your Password', html);
  }

  // FUNDRAISER APPROVED EMAIL
  async sendFundraiserApprovedMail(
    email: string,
    data: {
      name: string;
      title: string;
    },
  ) {
    const body = this.renderTemplate(
      'fundraisers/approved.hbs',
      data,
    );

    const css = this.renderTemplate(
      'fundraisers/approved.css.hbs',
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Your Fundraiser Has Been Approved',
      body,
      css,
    });

    await this.sendMail(
      email,
      '🎉 Your Fundraiser Has Been Approved',
      html,
    );
  }

  // FUNDRAISER REJECTED EMAIL
  async sendFundraiserRejectedMail(
    email: string,
    data: {
      name: string;
      title: string;
      reason: string;
    },
  ) {
    const body = this.renderTemplate(
      'fundraisers/rejected.hbs',
      data,
    );

    const css = this.renderTemplate(
      'fundraisers/rejected.css.hbs',
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Your Fundraiser Was Rejected',
      body,
      css,
    });

    await this.sendMail(
      email,
      '❌ Your Fundraiser Was Rejected',
      html,
    );
  }

  // FUNDRAISER ACTIVATED (GO LIVE)
  async sendFundraiserActivatedMail(
    email: string,
    data: {
      name: string;
      title: string;
    },
  ) {
    const body = this.renderTemplate(
      'fundraisers/activated.hbs',
      data,
    );

    const css = this.renderTemplate(
      'fundraisers/activated.css.hbs',
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Your Fundraiser Is Now Live 🚀',
      body,
      css,
    });

    await this.sendMail(
      email,
      '🚀 Your Fundraiser Is Now Live',
      html,
    );
  }

  // FUNDRAISER SUSPENDED EMAIL
  async sendFundraiserSuspendedMail(
    email: string,
    data: {
      name: string;
      title: string;
      reason: string;
    },
  ) {
    const body = this.renderTemplate('fundraisers/suspended.hbs', data);
    const css = this.renderTemplate('fundraisers/suspended.css.hbs');
    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Your Fundraiser Has Been Suspended',
      body,
      css,
    });
    await this.sendMail(email, 'Important Notice About Your RaiseAPlayer Fundraiser', html);
  }

  // DONATION RECEIVED EMAIL (FUNDRAISER – NO AMOUNT)
  async sendDonationReceivedMail(
    email: string,
    data: {
      fundraiserName: string;
      campaignTitle: string;
    },
  ) {
    const body = this.renderTemplate(
      'donation/received.hbs',
      data,
    );

    const css = this.renderTemplate(
      'donation/received.css.hbs',
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'New Donation Received',
      body,
      css,
    });

    await this.sendMail(
      email,
      '💖 You Received a New Donation',
      html,
    );
  }

  // DONOR THANK-YOU EMAIL (NO AMOUNT)
  async sendDonorThankYouMail(
    email: string,
    data: {
      donorName: string;
      campaignTitle: string;
      receiptPdf: Buffer;
    },
  ) {
    const body = this.renderTemplate(
      'donation/donor-thankyou.hbs',
      data,
    );

    const css = this.renderTemplate(
      'donation/donor-thankyou.css.hbs',
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Thank You for Supporting a Fundraiser 💙',
      body,
      css,
    });

    await this.sendMail(
      email,
      'Thank You for Your Support 💙',
      html,
      [
        {
          filename: 'RaiseAPlayer-Donation-Receipt.pdf',
          content: data.receiptPdf,
          contentType: 'application/pdf',
        },
      ],
    );
  }


  // WELCOME EMAIL
  async sendWelcomeMail(
    email: string,
    data: {
      name: string;
    },
  ) {
    // render welcome body
    const body = this.renderTemplate(
      'welcome/welcome.hbs',
      data,
    );

    // wrap with layout + css
    const css = this.renderTemplate('welcome/welcome.css.hbs');

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Welcome to RaiseAPlayer',
      body,
      css,
    });

    await this.sendMail(
      email,
      '🎉 Welcome to RaiseAPlayer!',
      html,
    );
  }

  // FUNDRAISER CREATED EMAIL
  async sendFundraiserCreatedMail(
    email: string,
    data: {
      name: string;
      title: string;
    },
  ) {
    // render fundraiser body
    const body = this.renderTemplate(
      'fundraisers/created.hbs',
      data,
    );

    // wrap with layout + css
    const css = this.renderTemplate('fundraisers/created.css.hbs');

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Your Fundraiser Has Been Created',
      body,
      css,
    });

    await this.sendMail(
      email,
      '📌 Your Fundraiser Has Been Created',
      html,
    );
  }

  async sendPayoutRequestUserMail(
    email: string,
    data: {
      name: string;
      fundraiserTitle: string;
      amount: string;
      status: string;
    },
  ) {
    const body = this.renderTemplate('payouts/payout-request-user.hbs', data);

    const css = `
:root{color-scheme:light}
body{margin:0!important;padding:0!important;background:#f6f7fb!important;font-family:Arial,Helvetica,sans-serif;color:#101828}
.wrapper{width:100%;background:#f6f7fb;padding:24px 0}
.container{max-width:640px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eaecf0;box-shadow:0 8px 28px rgba(16,24,40,.10)}
.header{background:linear-gradient(90deg,#16a34a,#22c55e);padding:18px 22px}
.brand{color:#fff;font-weight:900;letter-spacing:.6px;font-size:14px;margin:0}
.subtitle{color:rgba(255,255,255,.88);font-size:12px;margin-top:4px}
.badge{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.25)}
.content{padding:22px}
.title{font-size:18px;font-weight:900;margin:0 0 8px 0}
.text{font-size:14px;line-height:22px;color:#475467;margin:0 0 16px 0}
.card{background:#f9fafb;border:1px solid #eaecf0;border-radius:14px;padding:14px}
.row{padding:8px 0;border-bottom:1px dashed #e5e7eb}
.row:last-child{border-bottom:none}
.label{font-size:12px;color:#667085}
.value{font-size:14px;color:#101828;font-weight:800;text-align:right}
.amount{font-size:18px;font-weight:900;color:#16a34a}
.pill{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;background:#e2e8f0;border:1px solid #cbd5e1;color:#0f172a}
.divider{height:1px;background:#eaecf0;margin:22px 0}
.footer{padding:16px 22px;border-top:1px solid #eaecf0;font-size:11px;color:#98a2b3;line-height:16px}
a{color:#16a34a;text-decoration:none;font-weight:800}
`;

    const html = this.renderTemplate('layouts/main.hbs', {
      title: '💸 Payout Request Submitted',
      body,
      css,
    });

    await this.sendMail(email, '💸 Payout Request Submitted', html);
  }

  async sendPayoutRequestAdminMail(
    emails: string[],
    data: {
      userName: string;
      userEmail: string;
      fundraiserTitle: string;
      amount: string;
      requestId: string;
    },
  ) {
    const body = this.renderTemplate('payouts/payout-request-admin.hbs', data);

    const css = `
:root{color-scheme:light}
body{margin:0!important;padding:0!important;background:#f6f7fb!important;font-family:Arial,Helvetica,sans-serif;color:#101828}
.wrapper{width:100%;background:#f6f7fb;padding:24px 0}
.container{max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eaecf0;box-shadow:0 8px 28px rgba(16,24,40,.10)}
.header{background:linear-gradient(90deg,#b42318,#ef4444);padding:18px 22px}
.brand{color:#fff;font-weight:900;letter-spacing:.6px;font-size:14px;margin:0}
.subtitle{color:rgba(255,255,255,.88);font-size:12px;margin-top:4px}
.badge{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.25)}
.content{padding:22px}
.title{font-size:18px;font-weight:900;margin:0 0 8px 0}
.text{font-size:14px;line-height:22px;color:#475467;margin:0 0 16px 0}
.card{background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:14px}
.row{padding:8px 0;border-bottom:1px dashed #fed7aa}
.row:last-child{border-bottom:none}
.label{font-size:12px;color:#7c2d12}
.value{font-size:14px;color:#111827;font-weight:900;text-align:right}
.amount{font-size:18px;font-weight:900;color:#b42318}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
.cta{display:inline-block;margin-top:14px;background:#b42318;color:#fff;padding:12px 16px;border-radius:12px;font-size:14px;font-weight:900;text-decoration:none}
.divider{height:1px;background:#eaecf0;margin:22px 0}
.footer{padding:16px 22px;border-top:1px solid #eaecf0;font-size:11px;color:#98a2b3;line-height:16px}
a{color:#b42318;text-decoration:none;font-weight:900}
`;

    const html = this.renderTemplate('layouts/main.hbs', {
      title: '🚨 New Payout Request',
      body,
      css,
    });

    await this.sendMail(emails.join(','), '🚨 New Payout Request Pending', html);
  }


  async sendPayoutApprovedMail(
    email: string,
    data: {
      name: string;
      fundraiserTitle: string;
      amount: string;
    },
  ) {
    const body = this.renderTemplate(
      'payouts/payout-approved.hbs',
      data,
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Payout Approved',
      body,
      css: '',
    });

    await this.sendMail(
      email,
      '✅ Your payout request has been approved',
      html,
    );
  }

  async sendPayoutRejectedMail(
    email: string,
    data: {
      name: string;
      fundraiserTitle: string;
      amount: string;
      reason: string;
    },
  ) {
    const body = this.renderTemplate(
      'payouts/payout-rejected.hbs',
      data,
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Payout Request Rejected',
      body,
      css: '',
    });

    await this.sendMail(
      email,
      '❌ Your payout request was rejected',
      html,
    );
  }

  async sendPayoutFailedMail(
    email: string,
    data: {
      name: string;
      fundraiserTitle: string;
      amount: string;
      reason: string;
    },
  ) {
    const body = this.renderTemplate(
      'payouts/payout-failed.hbs',
      data,
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Payout Transfer Failed',
      body,
      css: '',
    });

    await this.sendMail(
      email,
      '⚠️ Your payout transfer failed',
      html,
    );
  }

  async sendPayoutPaidMail(
    email: string,
    data: {
      name: string;
      fundraiserTitle: string;
      amount: string;
      transactionId?: string | null;
    },
  ) {
    const body = this.renderTemplate(
      'payouts/payout-paid.hbs',
      data,
    );

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Payout Successful',
      body,
      css: '',
    });

    await this.sendMail(
      email,
      '💰 Your payout has been successfully transferred',
      html,
    );
  }

  // FOUNDATION DEVELOPMENT DONOR THANK-YOU EMAIL
  async sendFoundationDonorThankYouMail(
    email: string,
    data: {
      donorName: string;
      amount: string;
      receiptPdf?: Buffer;
    },
  ) {
    const body = this.renderTemplate('foundation/foundation-thankyou.hbs', data);
    const css = this.renderTemplate('foundation/foundation-thankyou.css.hbs');

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Thank You for Supporting Foundation Development 💙',
      body,
      css,
    });

    const attachments = data.receiptPdf
      ? [
          {
            filename: 'RaiseAPlayer-Foundation-Receipt.pdf',
            content: data.receiptPdf,
            contentType: 'application/pdf',
          },
        ]
      : undefined;

    await this.sendMail(
      email,
      '💙 Thank You for Your Foundation Donation',
      html,
      attachments,
    );
  }

  // CONTACT US EMAIL
  async sendContactUsMail(
    data: {
      name: string;
      email: string;
      phoneNumber: string;
      message: string;
    },
  ) {
    const adminEmail = process.env.CONTACT_US_EMAIL;
    if (!adminEmail) {
      this.logger.warn('CONTACT_US_EMAIL is not set — skipping contact form email');
      return;
    }

    const body = `
    <h2>New Contact Us Submission</h2>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Phone:</strong> ${data.phoneNumber}</p>
    <p><strong>Message:</strong> ${data.message}</p>
    <hr />
    <p>Sent from RaiseAPlayer Contact Us form.</p>
  `;

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'New Contact Us Submission',
      body,
      css: '',
    });

    await this.sendMail(adminEmail, '📩 New Contact Us Form Submission', html);
  }

  async sendFundraiserCompletedMail(
    email: string,
    data: {
      name: string;
      title: string;
      goalAmount?: string | number;
      raisedAmount?: string | number;
    },
  ) {
    // render fundraiser body
    const body = this.renderTemplate('fundraisers/completed.hbs', data);

    // wrap with layout + css
    const css = this.renderTemplate('fundraisers/completed.css.hbs');

    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Fundraiser Completed',
      body,
      css,
    });

    await this.sendMail(
      email,
      `🎉 Fundraiser Completed: ${data.title}`,
      html,
    );
  }

  async sendFundraiserCompletedAdminMail(
    emails: string[] | string,
    data: {
      fundraiserId: string;
      title: string;
      creatorEmail: string;
      creatorName: string;
      goalAmount?: string | number;
      raisedAmount?: string | number;
      adminPanelUrl?: string;
    },
  ) {
    const toList = (Array.isArray(emails) ? emails : [emails])
      .map((e) => (e ?? '').trim())
      .filter(Boolean);

    if (!toList.length) return;

    //  render admin body from fundraisers folder
    const body = this.renderTemplate('fundraisers/admincomplete.hbs', data);

    //  render admin css from same folder
    const css = this.renderTemplate('fundraisers/admincomplete.css.hbs');

    //  wrap with layout (same as you already do)
    const html = this.renderTemplate('layouts/main.hbs', {
      title: 'Campaign Completed (Admin)',
      body,
      css,
    });

    //  send to all admins
    for (const email of toList) {
      await this.sendMail(email, `✅ Campaign Completed: ${data.title}`, html);
    }
  }
}
