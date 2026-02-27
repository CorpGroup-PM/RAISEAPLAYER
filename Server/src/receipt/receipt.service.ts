import PDFDocument from 'pdfkit';
import * as path from 'path';
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
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));

    // 📍 LOGO
    const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
    doc.image(logoPath, 50, 45, { width: 120 });

    // 📍 PLATFORM NAME
    doc
      .fontSize(20)
      .fillColor('#0d6efd')
      .text('RaiseAPlayer', 0, 50, { align: 'center' });

    doc
      .fontSize(10)
      .fillColor('gray')
      .text('Empowering Athletes Through Your Support', { align: 'center' });

    doc.moveDown(2);

    // 📍 RECEIPT TITLE
    doc
      .fontSize(14)
      .fillColor('black')
      .text('DONATION RECEIPT', { align: 'center' });

    doc.moveDown(2);

    // 📦 RECEIPT META
    doc.fontSize(11).fillColor('black');
    doc.text(`Receipt No: ${data.receiptNumber}`);
    doc.text(`Date: ${data.donatedAt.toDateString()}`);

    doc.moveDown();

    // 👤 DONOR DETAILS
    this.sectionTitle(doc, 'Donor Details');

    doc.text(`Name: ${data.donorName}`);
    doc.text(`Email: ${data.donorEmail}`);

    doc.moveDown();

    // 🏏 CAMPAIGN DETAILS
    this.sectionTitle(doc, 'Fundraiser Details');

    doc.text(`Campaign: ${data.campaignTitle}`);

    doc.moveDown();

    // 💰 PAYMENT DETAILS
    this.sectionTitle(doc, 'Donation Details');

    doc
      .fontSize(16)
      .fillColor('#28a745')
      .text(`Amount Donated: ₹${data.amount.toFixed(2)}`);

    doc.fontSize(11).fillColor('black').text(`Payment ID: ${data.paymentId}`);

    doc.moveDown(2);

    // ❤️ THANK YOU MESSAGE
    doc
      .fontSize(11)
      .fillColor('#0d6efd')
      .text('Thank you for supporting an athlete’s dream!', {
        align: 'center',
      });

    doc.moveDown();

    // ⚖️ TAX NOTE
    doc
      .fontSize(9)
      .fillColor('gray')
      .text(
        'This donation may be eligible for tax benefits under applicable laws.',
        { align: 'center' },
      );

    doc.moveDown();

    // 🧾 SYSTEM NOTE
    doc
      .fontSize(9)
      .fillColor('black')
      .text(
        'This is a system-generated receipt from RaiseAPlayer. No signature required.',
        { align: 'center' },
      );

    doc.moveDown(2);

    // 📍 FOOTER
    doc
      .fontSize(9)
      .fillColor('gray')
      .text('support@raiseaplayer.com', { align: 'center' });

    doc.text('www.raiseaplayer.com', { align: 'center' });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    return Buffer.concat(buffers);
  }

  private sectionTitle(doc: InstanceType<typeof PDFDocument>, title: string) {
    doc.moveDown().fontSize(12).fillColor('#0d6efd').text(title);

    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).strokeColor('#eeeeee').stroke();

    doc.moveDown(0.5).fillColor('black').fontSize(11);
  }
}
