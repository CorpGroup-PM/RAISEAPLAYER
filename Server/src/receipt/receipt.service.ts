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
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));

    // ---- CONTENT ----
    doc
      .fontSize(20)
      .text('RaiseAPlayer', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text('Donation Receipt', { align: 'center' })
      .moveDown(2);

    doc.fontSize(11);
    doc.text(`Receipt No: ${data.receiptNumber}`);
    doc.text(`Date: ${data.donatedAt.toDateString()}`);
    doc.moveDown();

    doc.text(`Donor Name: ${data.donorName}`);
    doc.text(`Email: ${data.donorEmail}`);
    doc.moveDown();

    doc.text(`Campaign: ${data.campaignTitle}`);
    doc.text(`Amount Donated: INR ${data.amount.toFixed(2)}`);
    doc.text(`Payment ID: ${data.paymentId}`);
    doc.moveDown(2);

    doc
      .fontSize(9)
      .fillColor('gray')
      .text(
        'This donation may be eligible for tax benefits under applicable laws.',
        { align: 'center' },
      );

    doc
      .fontSize(10)
      .fillColor('black')
      .text(
        'This is a system-generated receipt from RaiseAPlayer. No signature required.',
        { align: 'center' },
      );

    doc.end();

    // ✅ WAIT for PDF to finish
    await new Promise<void>((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    return Buffer.concat(buffers);
  }
}
