import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ReceiptService {
  async generateDonationReceipt(data: {
    receiptNumber: string;
    donorName: string;
    donorEmail: string;
    campaignTitle: string;
    amount: number;
    paymentId: string;
    donatedAt: Date;
  }): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));

    const W  = doc.page.width;   // 595.28 pts
    const H  = doc.page.height;  // 841.89 pts
    const L  = 50;               // left/right margin
    const CW = W - L * 2;       // usable content width ~495 pts

    /* ── Palette ─────────────────────────────────────────────────── */
    const BRAND       = '#4F46E5';
    const BRAND_DARK  = '#3730A3';
    const BRAND_LIGHT = '#C7D2FE';
    const GREEN       = '#16A34A';
    const GREEN_BG    = '#F0FDF4';
    const BLUE_BG     = '#EEF2FF';
    const BORDER      = '#E5E7EB';
    const MUTED       = '#6B7280';
    const DARK        = '#111827';
    const STRIPE      = '#F9FAFB';
    const WHITE       = '#FFFFFF';

    /* ── Pre-computed strings ─────────────────────────────────────── */
    const fmtAmount = 'Rs. ' + data.amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const fmtDate = data.donatedAt.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const fmtDateTime = data.donatedAt.toLocaleString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // ================================================================
    // 1. HEADER BAR
    // ================================================================
    doc.rect(0, 0, W, 90).fill(BRAND);
    doc.rect(0, 87, W, 4).fill(BRAND_DARK);

    // Left: company name + tagline
    doc.font('Helvetica-Bold').fontSize(26).fillColor(WHITE)
      .text('RaiseAPlayer', L, 20, { lineBreak: false });
    doc.font('Helvetica').fontSize(9.5).fillColor(BRAND_LIGHT)
      .text('Empowering Athletes Through Your Support', L, 52, { lineBreak: false });

    // Right: receipt label + number
    doc.font('Helvetica-Bold').fontSize(13).fillColor(WHITE)
      .text('DONATION RECEIPT', L, 24, { width: CW, align: 'right', lineBreak: false });
    doc.font('Helvetica').fontSize(9.5).fillColor(BRAND_LIGHT)
      .text('Receipt # ' + data.receiptNumber, L, 46, { width: CW, align: 'right', lineBreak: false });

    // ================================================================
    // 2. DATE + STATUS STRIP
    // ================================================================
    let y = 108;
    doc.rect(L, y, CW, 36).fill(STRIPE);
    doc.strokeColor(BORDER).lineWidth(0.5).rect(L, y, CW, 36).stroke();

    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
      .text('Date Issued:', L + 16, y + 12, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
      .text(fmtDate, L + 94, y + 12, { lineBreak: false });

    // PAID badge — pill shape on the right
    const bW = 68, bH = 20, bX = L + CW - bW, bY = y + 8;
    doc.roundedRect(bX, bY, bW, bH, 10).fill('#DCFCE7');
    doc.font('Helvetica-Bold').fontSize(10).fillColor(GREEN)
      .text('PAID', bX, bY + 5, { width: bW, align: 'center', lineBreak: false });

    // ================================================================
    // 3. DONOR | CAMPAIGN INFO CARDS
    // ================================================================
    y = 162;
    const colW = (CW - 12) / 2;

    // ── Donor card ──────────────────────────────────────────────────
    // Blue header band
    doc.rect(L, y, colW, 24).fill(BRAND);
    // White body
    doc.rect(L, y + 24, colW, 68).fill(WHITE);
    // Border
    doc.strokeColor(BORDER).lineWidth(0.5).rect(L, y, colW, 92).stroke();

    doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE)
      .text('DONOR', L + 14, y + 8, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK)
      .text(data.donorName, L + 14, y + 34, { width: colW - 22, ellipsis: true, lineBreak: false });
    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
      .text(data.donorEmail, L + 14, y + 56, { width: colW - 22, ellipsis: true, lineBreak: false });

    // ── Campaign card ────────────────────────────────────────────────
    const c2 = L + colW + 12;
    // Green header band
    doc.rect(c2, y, colW, 24).fill(GREEN);
    // White body
    doc.rect(c2, y + 24, colW, 68).fill(WHITE);
    // Border
    doc.strokeColor(BORDER).lineWidth(0.5).rect(c2, y, colW, 92).stroke();

    doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE)
      .text('FUNDRAISER', c2 + 14, y + 8, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
      .text(data.campaignTitle, c2 + 14, y + 34, { width: colW - 22, ellipsis: true, lineBreak: false });

    // ================================================================
    // 4. AMOUNT HIGHLIGHT BOX
    // ================================================================
    y = 274;
    doc.roundedRect(L, y, CW, 78, 8).fill(GREEN_BG);
    doc.rect(L, y, 6, 78).fill(GREEN);   // left accent bar

    doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED)
      .text('AMOUNT DONATED', L + 22, y + 14, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(30).fillColor(GREEN)
      .text(fmtAmount, L + 22, y + 33, { lineBreak: false });
    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
      .text('INR', L + 22 + doc.widthOfString(fmtAmount, { fontSize: 30 }) + 8, y + 43, { lineBreak: false });

    // ================================================================
    // 5. TRANSACTION DETAILS TABLE
    // ================================================================
    y = 376;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK)
      .text('Transaction Details', L, y, { lineBreak: false });

    y += 20;
    doc.moveTo(L, y).lineTo(L + CW, y).strokeColor(BORDER).lineWidth(1).stroke();
    y += 1;

    const rows: [string, string][] = [
      ['Receipt Number',    data.receiptNumber],
      ['Payment Reference', data.paymentId],
      ['Date & Time',       fmtDateTime],
      ['Amount',            fmtAmount + ' INR'],
      ['Status',            'Successful'],
    ];

    const ROW_H   = 34;
    const TABLE_H = rows.length * ROW_H;

    // Alternating row fills + separators
    rows.forEach((_, i) => {
      const ry = y + i * ROW_H;
      if (i % 2 === 0) doc.rect(L, ry, CW, ROW_H).fill(STRIPE);
      if (i > 0) {
        doc.moveTo(L, ry).lineTo(L + CW, ry)
          .strokeColor(BORDER).lineWidth(0.5).stroke();
      }
    });

    // Outer table border (drawn after fills so it sits on top)
    doc.strokeColor(BORDER).lineWidth(1).rect(L, y, CW, TABLE_H).stroke();

    // Vertical divider between label and value columns
    doc.moveTo(L + 188, y).lineTo(L + 188, y + TABLE_H)
      .strokeColor(BORDER).lineWidth(0.5).stroke();

    // Table text
    rows.forEach(([label, value], i) => {
      const ty = y + i * ROW_H + 11;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED)
        .text(label, L + 14, ty, { width: 164, lineBreak: false });
      doc.font('Helvetica').fontSize(10).fillColor(DARK)
        .text(value, L + 200, ty, { width: CW - 210, ellipsis: true, lineBreak: false });
    });

    // ================================================================
    // 6. THANK YOU BOX
    // ================================================================
    y = y + TABLE_H + 28;
    doc.roundedRect(L, y, CW, 52, 8).fill(BLUE_BG);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(BRAND)
      .text("Thank you for supporting an athlete's dream!", L, y + 18, {
        width: CW, align: 'center', lineBreak: false,
      });

    // ================================================================
    // 7. LEGAL NOTES
    // ================================================================
    y += 68;
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
      .text(
        'This donation may be eligible for tax benefits under applicable laws. Please consult your tax advisor.',
        L, y, { width: CW, align: 'center', lineBreak: false }
      );
    doc.font('Helvetica').fontSize(8.5).fillColor(MUTED)
      .text(
        'This is a system-generated receipt. No signature required.',
        L, y + 16, { width: CW, align: 'center', lineBreak: false }
      );

    // ================================================================
    // 8. PAGE FOOTER
    // ================================================================
    const FY = H - 56;
    doc.rect(0, FY, W, 56).fill('#F3F4F6');
    doc.moveTo(0, FY).lineTo(W, FY).strokeColor(BORDER).lineWidth(1).stroke();

    doc.font('Helvetica-Bold').fontSize(9).fillColor(MUTED)
      .text('support@raiseaplayer.com', 0, FY + 14, { width: W, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
      .text('www.raiseaplayer.com', 0, FY + 32, { width: W, align: 'center', lineBreak: false });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    return Buffer.concat(buffers);
  }

  private sectionTitle(doc: InstanceType<typeof PDFDocument>, title: string) {
    doc.moveDown().fontSize(12).fillColor('#4F46E5').text(title);
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).strokeColor('#eeeeee').stroke();
    doc.moveDown(0.5).fillColor('black').fontSize(11);
  }
}
