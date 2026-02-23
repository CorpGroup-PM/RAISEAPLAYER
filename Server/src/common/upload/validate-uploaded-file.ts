import { BadRequestException } from '@nestjs/common';

export function validateUploadedFile(
  file: Express.Multer.File,
  allowedMimeTypes: string[],
  maxFileSizeMB: number,
) {
  if (!file) {
    throw new BadRequestException('No file provided');
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new BadRequestException(
      `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
    );
  }

  if (file.size > maxFileSizeMB * 1024 * 1024) {
    throw new BadRequestException(
      `File too large. Max size is ${maxFileSizeMB}MB`,
    );
  }
}