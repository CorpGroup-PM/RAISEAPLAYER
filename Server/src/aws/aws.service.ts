import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Multer } from 'multer';

const ALLOWED_IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

@Injectable()
export class AwsS3Service {
  private s3: S3Client;
  private bucket = process.env.AWS_S3_BUCKET!;
  private region = process.env.AWS_REGION!;

  constructor() {
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /** Upload profile image to S3 */
  async uploadProfileImage(file: Express.Multer.File, folder = 'profile'): Promise<string> {
    const fileExt = ALLOWED_IMAGE_MIME_TO_EXT[file.mimetype];
    if (!fileExt) {
      throw new BadRequestException('Unsupported image type. Allowed: JPEG, PNG, GIF, WEBP');
    }
    const fileName = `${folder}/${randomUUID()}.${fileExt}`;

    const params = {
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.send(new PutObjectCommand(params));

    // Return public image URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileName}`;
  }


  //Uploading Documents
 async uploadPdfDocument(
  file: Express.Multer.File,
  fundraiserId: string,
): Promise<string> {

  // ✅ FIRST LINE — CRITICAL
  if (!file) {
    throw new BadRequestException('PDF file not received');
  }

  if (file.mimetype !== 'application/pdf') {
    throw new BadRequestException('Only PDF files are allowed');
  }

  const fileName = `fundraisers/${fundraiserId}/documents/${randomUUID()}.pdf`;

  const params = {
    Bucket: this.bucket,
    Key: fileName,
    Body: file.buffer,
    ContentType: 'application/pdf',
  };

  await this.s3.send(new PutObjectCommand(params));

  return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileName}`;
}



  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
      return;
    }

    // Validate the URL belongs to our bucket to prevent arbitrary deletions
    const expectedPrefix = `https://${this.bucket}.s3.${this.region}.amazonaws.com/`;
    if (!fileUrl.startsWith(expectedPrefix)) {
      throw new BadRequestException('Invalid file URL: does not belong to expected bucket');
    }

    const parsedUrl = new URL(fileUrl);
    const key = parsedUrl.pathname.replace(/^\//, '');

    await this.s3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }),
    );
  }
}
