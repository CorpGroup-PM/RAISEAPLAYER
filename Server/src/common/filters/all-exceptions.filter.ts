import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    // 1. Determine the Status Code & Error Type
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorType = 'InternalServerError';

    // --- CASE A: NestJS Standard HTTP Exceptions ---
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const responseBody = exception.getResponse();

      // Handle class-validator array of errors vs single string
      if (typeof responseBody === 'object' && 'message' in responseBody) {
        message = (responseBody as any).message;
      } else {
        message = responseBody as string;
      }
      errorType = exception.name;
    }

    // --- CASE B: Prisma Known Request Errors ---
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Log full Prisma error (code + meta) server-side only
      this.logger.error(
        `Prisma error [${exception.code}]: ${JSON.stringify(exception.meta)}`,
        exception.stack,
      );

      if (exception.code === 'P2002') {
        // Unique constraint — never expose which field
        httpStatus = HttpStatus.CONFLICT;
        message = 'A record with this value already exists.';
        errorType = 'Conflict';
      } else if (exception.code === 'P2025') {
        // Record not found
        httpStatus = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
        errorType = 'NotFound';
      } else if (exception.code === 'P2003') {
        // Foreign key constraint — never expose field name
        httpStatus = HttpStatus.BAD_REQUEST;
        message = 'Related record not found.';
        errorType = 'BadRequest';
      } else {
        // All other Prisma known errors — generic 500
        httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'A database error occurred.';
        errorType = 'InternalServerError';
      }
    }

    // --- CASE B2: Prisma Validation Errors ---
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error('Prisma validation error', exception.message);
      httpStatus = HttpStatus.BAD_REQUEST;
      message = 'Invalid request data.';
      errorType = 'BadRequest';
    }

    // --- CASE C: Generic / Unexpected Errors ---
    else {
      if (exception instanceof Error) {
        // Log full details server-side; never expose raw message to client
        this.logger.error(exception.message, exception.stack);
      }
      // message stays 'Internal server error' — set above
    }

    // 2. Construct the JSON Response
    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      method: httpAdapter.getRequestMethod(ctx.getRequest()),
      error: errorType,
      message: message,
    };

    // 3. Log the Error (Server Side)
    // Prisma errors are already logged in their own case blocks above.
    // Only log non-Prisma errors here to avoid duplicate entries.
    const isPrismaError =
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientValidationError;

    if (!isPrismaError) {
      if (httpStatus >= 500) {
        this.logger.error(
          `Http Status: ${httpStatus} Error Message: ${JSON.stringify(message)}`,
          exception instanceof Error ? exception.stack : '',
        );
      } else {
        this.logger.warn(
          `Http Status: ${httpStatus} Error Message: ${JSON.stringify(message)}`,
        );
      }
    }

    // 4. Send Response
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
