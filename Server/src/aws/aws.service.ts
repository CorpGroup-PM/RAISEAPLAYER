import { BadRequestException, Injectable } from '@nestjs/common';
import { VirusScanService } from 'src/common/virus-scan/virus-scan.service';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromBuffer } from 'file-type';
import { randomUUID } from 'crypto';

const ALLOWED_IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/** Default signed-URL TTL for sensitive documents (15 minutes). */
const DOCUMENT_SIGNED_URL_TTL_SECONDS = 900;

@Injectable()
export class AwsS3Service {
  private s3: S3Client;
  private bucket = process.env.AWS_S3_BUCKET!;
  private region = process.env.AWS_REGION!;

  constructor(private readonly virusScan: VirusScanService) {
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  // ── Public media (profile images, cover photos, player images) ───────────
  // These remain as permanent public URLs — bucket policy allows public read
  // only on the profile/ and fundraisers/*/media/ prefixes.

  /** Upload profile/cover image and return a permanent public URL. */
  async uploadProfileImage(file: Express.Multer.File, folder = 'profile'): Promise<string> {
    // Detect the real MIME type from magic bytes — never trust the client-supplied
    // Content-Type or the original filename extension (.php.jpg, etc.).
    const detected = await fromBuffer(file.buffer);
    const fileExt = detected ? ALLOWED_IMAGE_MIME_TO_EXT[detected.mime] : undefined;
    if (!detected || !fileExt) {
      throw new BadRequestException('Unsupported image type. Allowed: JPEG, PNG, GIF, WEBP');
    }

    await this.virusScan.scan(file.buffer, file.originalname);

    // Key and ContentType are both derived from the magic-bytes-detected type,
    // not from file.mimetype (client-supplied) or file.originalname.
    const fileName = `${folder}/${randomUUID()}.${fileExt}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: detected.mime,
    }));

    // Public URL — intentional for player media and profile images only.
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileName}`;
  }

  /**
   * Upload a KYC Aadhaar PDF (front or back) as a private S3 object.
   * Returns the S3 key (NOT a public URL). Use `getSignedDocumentUrl(key)` to
   * generate a time-limited access URL for display/download.
   */
  async uploadKycPdf(
    file: Express.Multer.File,
    userId: string,
    side: 'front' | 'back',
  ): Promise<string> {
    if (!file) throw new BadRequestException('PDF file not received');

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed for Aadhaar KYC');
    }

    // Verify actual magic bytes — client-supplied Content-Type can be spoofed.
    const detected = await fromBuffer(file.buffer);
    if (!detected || detected.mime !== 'application/pdf') {
      throw new BadRequestException('File content is not a valid PDF');
    }

    await this.virusScan.scan(file.buffer, file.originalname);

    const key = `kyc/${userId}/aadhaar/${side}-${randomUUID()}.pdf`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: 'application/pdf',
    }));

    return key;
  }

  // ── Sensitive documents (KYC, identity proofs, athlete certificates) ─────
  // Bucket must be private. Access is granted only via short-lived signed URLs.

  /**
   * Upload a KYC PAN card PDF as a private S3 object.
   * Returns the S3 key. Use `getSignedDocumentUrl(key)` to generate a time-limited URL.
   */
  async uploadPanPdf(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    if (!file) throw new BadRequestException('PDF file not received');

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed for PAN KYC');
    }

    const detected = await fromBuffer(file.buffer);
    if (!detected || detected.mime !== 'application/pdf') {
      throw new BadRequestException('File content is not a valid PDF');
    }

    await this.virusScan.scan(file.buffer, file.originalname);

    const key = `kyc/${userId}/pan/${randomUUID()}.pdf`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: 'application/pdf',
    }));

    return key;
  }

  /**
   * Upload a PDF document and return its S3 key (NOT a public URL).
   *
   * The key must be stored in the database. Callers must use
   * `getSignedDocumentUrl(key)` to generate a time-limited access URL
   * whenever a client needs to view or download the file.
   */
  async uploadPdfDocument(
    file: Express.Multer.File,
    fundraiserId: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('PDF file not received');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Verify actual magic bytes — client-supplied Content-Type can be spoofed.
    const detected = await fromBuffer(file.buffer);
    if (!detected || detected.mime !== 'application/pdf') {
      throw new BadRequestException('File content is not a valid PDF');
    }

    // Scan for malware before storing. ClamAV catches embedded JS, exploit
    // payloads, and known malicious signatures in PDF and image files.
    await this.virusScan.scan(file.buffer, file.originalname);

    const key = `fundraisers/${fundraiserId}/documents/${randomUUID()}.pdf`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: 'application/pdf',
      // No ACL — bucket must be fully private; access is via signed URLs only.
    }));

    // Return the S3 key, NOT a public URL.
    return key;
  }

  /**
   * Generate a pre-signed GET URL for a private document.
   *
   * @param keyOrUrl  S3 object key (e.g. "fundraisers/id/documents/uuid.pdf")
   *                  or a legacy full S3 URL (handled transparently).
   * @param expiresIn TTL in seconds. Defaults to 15 minutes (900 s).
   */
  async getSignedDocumentUrl(
    keyOrUrl: string,
    expiresIn = DOCUMENT_SIGNED_URL_TTL_SECONDS,
  ): Promise<string> {
    const key = this.extractKey(keyOrUrl);
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  // ── Shared deletion ──────────────────────────────────────────────────────

  /**
   * Delete an object from S3.
   *
   * Accepts either a full S3 URL (e.g. from legacy public-image records) or a
   * bare S3 key (e.g. from new private-document records).
   */
  async deleteFile(fileUrlOrKey: string): Promise<void> {
    if (!fileUrlOrKey) return;

    const expectedPrefix = `https://${this.bucket}.s3.${this.region}.amazonaws.com/`;

    let key: string;
    if (fileUrlOrKey.startsWith('https://')) {
      // Full URL — validate it belongs to our bucket before extracting the key.
      if (!fileUrlOrKey.startsWith(expectedPrefix)) {
        throw new BadRequestException('Invalid file URL: does not belong to expected bucket');
      }
      key = new URL(fileUrlOrKey).pathname.replace(/^\//, '');
    } else {
      // Already a bare S3 key (private document path).
      key = fileUrlOrKey;
    }

    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /** Extract the S3 key from either a full URL or a bare key string. */
  private extractKey(fileUrlOrKey: string): string {
    if (fileUrlOrKey.startsWith('https://')) {
      return new URL(fileUrlOrKey).pathname.replace(/^\//, '');
    }
    return fileUrlOrKey;
  }
}
