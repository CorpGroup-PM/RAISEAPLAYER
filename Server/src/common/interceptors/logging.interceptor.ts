import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { requestContext } from '../logger/json.logger';

/**
 * Global HTTP logging interceptor.
 *
 * Logs every request and its response (or error) with:
 *   - HTTP method + URL
 *   - Response status code
 *   - Duration in milliseconds
 *   - Request ID (propagated from the request-ID middleware via AsyncLocalStorage)
 *
 * Because the logger goes through JsonLogger, each line is emitted as a
 * structured JSON object that already contains the requestId field.
 * This makes it possible to grep/filter all logs for a single request in any
 * log aggregator (CloudWatch, Datadog, Loki, etc.).
 *
 * Example log lines:
 *   {"level":"info","context":"HTTP","message":"→ POST /api/v1/payments req=abc-123"}
 *   {"level":"info","context":"HTTP","message":"← POST /api/v1/payments 201 42ms","requestId":"abc-123"}
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { method, url } = req;
    const requestId = requestContext.getStore()?.requestId ?? '-';
    const startAt = Date.now();

    this.logger.log(`→ ${method} ${url} req=${requestId}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startAt;
          this.logger.log(
            `← ${method} ${url} ${res.statusCode} ${ms}ms req=${requestId}`,
          );
        },
        error: (err: { status?: number }) => {
          const status = err.status ?? 500;
          const ms = Date.now() - startAt;
          this.logger.error(
            `← ${method} ${url} ${status} ${ms}ms req=${requestId}`,
          );
        },
      }),
    );
  }
}
