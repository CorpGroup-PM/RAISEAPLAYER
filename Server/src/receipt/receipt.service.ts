import PDFDocument from 'pdfkit';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

const C = {
  blueDark: '#1e3a8a',
  blueMid: '#1d4ed8',
  blueAccent: '#93c5fd',
  blueLight: '#eff6ff',
  blueBorder: '#bfdbfe',
  green: '#15803d',
  greenMid: '#16a34a',
  greenLight: '#f0fdf4',
  greenBorder: '#86efac',
  amber: '#b45309',
  amberMid: '#d97706',
  amberLight: '#fffbeb',
  amberBorder: '#fcd34d',
  pageBg: '#eef2f7',
  white: '#ffffff',
  shadow: '#c2c8d8',
  divider: '#e5e7eb',
  textDark: '#111827',
  textMid: '#374151',
  textLight: '#6b7280',
  textXLight: '#9ca3af',
};

@Injectable()
export class ReceiptService {
  async generateDonationReceipt(data: {
    receiptNumber: string;
    donorName: string;
    donorEmail: string;
    campaignTitle?: string;
    fundraiserId?: string;
    fundraiserOwner?: string;
    amount: number;
    paymentId: string;
    donatedAt: Date;
    hideFundraiserDetails?: boolean;
  }): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const W = 595.28;
    const H = 841.89;
    const mx = 48;
    const cw = W - mx * 2;

    // ── PAGE BACKGROUND ───────────────────────────────────────
    doc.rect(0, 0, W, H).fill(C.pageBg);

    // ── THREE-COLOR ACCENT STRIP ───────────────────────────────
    doc.rect(0, 0, W / 3, 5).fill('#15803d');
    doc.rect(W / 3, 0, W / 3, 5).fill('#2563eb');
    doc.rect((W * 2) / 3, 0, W / 3, 5).fill(C.blueDark);

    // ── HEADER ────────────────────────────────────────────────
    doc.rect(0, 5, W, 115).fill(C.blueDark);

    const logoPath = path.join(process.cwd(), 'assets/logo.png');
    try {
      doc.image(logoPath, mx, 16, { fit: [55, 55] });
    } catch {
      // skip if logo missing
    }

    // "PAID" badge — hidden for foundation receipts
    if (!data.hideFundraiserDetails) {
      doc.roundedRect(W - mx - 54, 30, 54, 22, 11).fill('#15803d');
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(C.white)
        .text('PAID', W - mx - 54, 38, { width: 54, align: 'center' });
    }

    // Brand name
    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor(C.white)
      .text('RAISEAPLAYER', 0, 29, { align: 'center' });

    // Tagline
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(C.blueAccent)
      .text('Empowering Athletes Through Your Support', 0, 59, {
        align: 'center',
      });

    // Thin rule inside header
    doc
      .moveTo(mx + 60, 82)
      .lineTo(W - mx - 60, 82)
      .lineWidth(0.5)
      .strokeColor('#2d4fa6')
      .stroke();

    // ── TITLE BAND ────────────────────────────────────────────
    doc.rect(mx, 92, cw, 44).fill(C.white);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(C.blueDark)
      .text('DONATION RECEIPT', 0, 107, { align: 'center', characterSpacing: 3 });

    // ── CARD SHADOW (offset 4px right + 4px down, same width as card) ─
    doc.rect(mx + 4, 141, cw - 4, 620).fill('#d0d5e8');

    // ── MAIN CONTENT CARD ─────────────────────────────────────
    doc.rect(mx, 137, cw, 620).fill(C.white);

    // ── META ROW ──────────────────────────────────────────────
    const metaY = 157;
    // Blue top strip on meta card
    doc.rect(mx + 16, metaY, cw - 32, 4).fill(C.blueMid);
    doc.rect(mx + 16, metaY + 4, cw - 32, 56).fill(C.blueLight);

    // Vertical divider
    const metaColX = mx + 16 + (cw - 32) / 2;
    doc
      .moveTo(metaColX, metaY + 10)
      .lineTo(metaColX, metaY + 56)
      .lineWidth(0.5)
      .strokeColor(C.blueBorder)
      .stroke();

    const col2X = metaColX + 16;

    doc.font('Helvetica').fontSize(7.5).fillColor(C.textLight);
    doc.text('RECEIPT NUMBER', mx + 28, metaY + 12);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.textDark);
    doc.text(data.receiptNumber, mx + 28, metaY + 24, {
      width: (cw - 32) / 2 - 20,
    });

    doc.font('Helvetica').fontSize(7.5).fillColor(C.textLight);
    doc.text('DATE ISSUED', col2X, metaY + 12);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.textDark);
    doc.text(data.donatedAt.toDateString(), col2X, metaY + 24);

    let y = metaY + 74;

    // ── DONOR SECTION ─────────────────────────────────────────
    y = this.sectionHeader(doc, 'Donor Details', mx, y, cw, C.blueMid);

    doc.font('Helvetica').fontSize(7.5).fillColor(C.textXLight);
    doc.text('FULL NAME', mx + 28, y + 2);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.textDark);
    doc.text(data.donorName, mx + 28, y + 13);

    doc.font('Helvetica').fontSize(7.5).fillColor(C.textXLight);
    doc.text('EMAIL ADDRESS', mx + 28 + cw / 2 - 12, y + 2);
    doc.font('Helvetica').fontSize(10).fillColor(C.textMid);
    doc.text(data.donorEmail, mx + 28 + cw / 2 - 12, y + 13, {
      width: cw / 2 - 20,
    });

    y += 42;

    // ── FUNDRAISER SECTION (hidden for foundation donations) ─
    if (!data.hideFundraiserDetails) {
      y = this.sectionHeader(doc, 'Fundraiser Details', mx, y, cw, C.blueMid);

      // Campaign Name — full width so long titles never overflow into the right column
      doc.font('Helvetica').fontSize(7.5).fillColor(C.textXLight);
      doc.text('CAMPAIGN NAME', mx + 28, y + 2);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.textDark);
      doc.text(data.campaignTitle ?? '', mx + 28, y + 13, {
        width: cw - 56,
        lineBreak: true,
      });
      const titleLines = Math.ceil(
        doc.widthOfString(data.campaignTitle ?? '') / (cw - 56),
      );
      y += 16 + Math.max(1, titleLines) * 14 + 8;

      // Campaign ID | Campaign Organizer on the same row below
      doc.font('Helvetica').fontSize(7.5).fillColor(C.textXLight);
      doc.text('CAMPAIGN ID', mx + 28, y + 2);
      doc.font('Helvetica').fontSize(8.5).fillColor(C.textMid);
      doc.text(data.fundraiserId ?? '', mx + 28, y + 13, {
        width: cw / 2 - 30,
      });

      doc.font('Helvetica').fontSize(7.5).fillColor(C.textXLight);
      doc.text('CAMPAIGN ORGANIZER', mx + 28 + cw / 2, y + 2);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C.textDark);
      doc.text(data.fundraiserOwner ?? '', mx + 28 + cw / 2, y + 13);

      y += 30;
    }

    // ── DONATION SECTION ──────────────────────────────────────
    y = this.sectionHeader(doc, 'Donation Details', mx, y, cw, C.greenMid);

    // Amount card shadow — same width as card so shadow is visible on right + bottom
    doc.rect(mx + 19, y + 4, cw - 32, 106).fill('#c6ebd4');
    // Amount card
    doc.rect(mx + 16, y, cw - 32, 106).fill(C.greenLight);
    doc
      .rect(mx + 16, y, cw - 32, 106)
      .lineWidth(0.5)
      .strokeColor(C.greenBorder)
      .stroke();
    // Top accent strip
    doc.rect(mx + 16, y, cw - 32, 3).fill(C.greenMid);

    // Confirmed circle
    doc.circle(mx + 30, y + 20, 8).fill(C.greenMid);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(C.white)
      .text('OK', mx + 24, y + 16, { width: 12, align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(C.greenMid)
      .text('PAYMENT CONFIRMED', mx + 44, y + 15);

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(C.textLight)
      .text('AMOUNT DONATED', mx + 28, y + 36);

    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor(C.green)
      .text(
        `Rs. ${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        mx + 28,
        y + 48,
      );

    // Payment reference — stacked (label on top, value below)
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(C.textLight)
      .text('PAYMENT REFERENCE', mx + 28, y + 82);
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(C.textMid)
      .text(data.paymentId, mx + 28, y + 92, { width: cw - 56 });

    y += 122;

    // ── DOT DIVIDER ───────────────────────────────────────────
    for (let i = 0; i < 7; i++) {
      doc.circle(W / 2 - 45 + i * 15, y + 6, 2.5).fill(C.blueBorder);
    }

    y += 24;

    // ── THANK YOU ─────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(C.blueDark)
      .text("Thank you for supporting an athlete's dream!", 0, y, {
        align: 'center',
      });

    y += 22;

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(C.textLight)
      .text(
        'This donation may be eligible for tax benefits under applicable laws.',
        0,
        y,
        { align: 'center' },
      );

    y += 15;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(C.textMid)
      .text(
        'This is a system-generated receipt from RaiseAPlayer. No signature required.',
        0,
        y,
        { align: 'center' },
      );

    // ── FOOTER ────────────────────────────────────────────────
    const footerY = 768;
    doc.rect(0, footerY, W, H - footerY).fill(C.blueDark);

    doc
      .moveTo(mx + 50, footerY + 2)
      .lineTo(W - mx - 50, footerY + 2)
      .lineWidth(1.5)
      .strokeColor(C.blueMid)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(C.blueAccent)
      .text(
        'support@raiseaplayer.org  |  www.raiseaplayer.org',
        0,
        footerY + 18,
        { align: 'center' },
      );

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#60a5fa')
      .text('© 2026 RaiseAPlayer. All rights reserved.', 0, footerY + 40, {
        align: 'center',
      });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    return Buffer.concat(buffers);
  }

  private sectionHeader(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    mx: number,
    y: number,
    cw: number,
    accentColor: string,
  ): number {
    // Small filled square icon
    doc.rect(mx + 16, y + 5, 8, 8).fill(accentColor);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(accentColor)
      .text(title, mx + 30, y + 4);

    doc
      .moveTo(mx + 16, y + 22)
      .lineTo(mx + cw - 16, y + 22)
      .lineWidth(0.5)
      .strokeColor(C.divider)
      .stroke();

    return y + 30;
  }
}
