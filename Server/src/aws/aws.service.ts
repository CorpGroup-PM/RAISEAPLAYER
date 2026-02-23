import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { Multer } from 'multer';

@Injectable()
export class AwsS3Service {
  private s3: S3Client;
  private bucket = process.env.AWS_S3_BUCKET!;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /** Upload profile image to S3 */
  async uploadProfileImage(file: Express.Multer.File, folder = 'profile'): Promise<string> {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${folder}/${randomUUID()}.${fileExt}`;

    const params = {
      Bucket: this.bucket,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.send(new PutObjectCommand(params));

    // Return public image URL
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
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

  return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}



  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) {
      return;
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
