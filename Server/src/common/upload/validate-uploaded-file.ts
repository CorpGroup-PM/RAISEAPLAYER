import { BadRequestException } from '@nestjs/common';
import { fromBuffer } from 'file-type';

/**
 * Validate an uploaded file by size, declared MIME type, AND actual magic bytes.
 *
 * The MIME type from a multipart/form-data request is client-controlled and
 * can be spoofed (e.g. a PHP file submitted with Content-Type: image/jpeg).
 * This function reads the first few bytes of the buffer with `file-type` to
 * confirm the real format before the file is processed or stored.
 *
 * Must be awaited — the magic-bytes check is asynchronous.
 */
export async function validateUploadedFile(
  file: Express.Multer.File,
  allowedMimeTypes: string[],
  maxFileSizeMB: number,
): Promise<void> {
  if (!file) {
    throw new BadRequestException('No file provided');
  }

  // Fast reject on declared MIME type before reading the buffer.
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

  // Inspect actual magic bytes — the only reliable way to determine file type.
  // This catches spoofed Content-Type headers (e.g. a JS file disguised as a PDF).
  const detected = await fromBuffer(file.buffer);
  if (!detected || !allowedMimeTypes.includes(detected.mime)) {
    throw new BadRequestException(
      `File content does not match the declared type. Allowed: ${allowedMimeTypes.join(', ')}`,
    );
  }
}
