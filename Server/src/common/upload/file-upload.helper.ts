import { BadRequestException } from '@nestjs/common';
import { MulterModuleOptions } from '@nestjs/platform-express';

export type FileValidationOptions = {
  allowedMimeTypes: string[];
  maxFileSizeMB: number;
};

export function createFileInterceptorOptions(
  options: FileValidationOptions,
): MulterModuleOptions {
  const { allowedMimeTypes, maxFileSizeMB } = options;

  return {
    limits: {
      fileSize: maxFileSizeMB * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
          ) as any,
          false,
        );
      }
      cb(null, true);
    },
  };
}