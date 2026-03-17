import { LoggerService } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage that propagates request-scoped context (requestId)
 * through the entire async call chain for a single HTTP request.
 * Populated by the request-ID middleware registered in main.ts.
 */
export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

/**
 * Structured JSON logger — implements NestJS LoggerService so it integrates
 * with app.useLogger() and all existing `new Logger(context)` call sites.
 *
 * Each log line is a single JSON object written to stdout (or stderr for errors),
 * making it compatible with log aggregators (CloudWatch, Datadog, Loki, etc.).
 *
 * Fields:
 *   timestamp  — ISO-8601
 *   level      — info | warn | error | debug | verbose | fatal
 *   context    — NestJS class name (e.g. 'WebhooksService')
 *   message    — string
 *   requestId  — present when inside an HTTP request context
 *   trace      — present on error calls that include a stack trace
 */
export class JsonLogger implements LoggerService {
  private write(
    level: string,
    message: any,
    context?: string,
    trace?: string,
  ): void {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? 'App',
      message:
        message instanceof Error
          ? message.message
          : typeof message === 'string'
            ? message
            : JSON.stringify(message),
    };

    const requestId = requestContext.getStore()?.requestId;
    if (requestId) entry.requestId = requestId;
    if (trace) entry.trace = trace;

    const line = JSON.stringify(entry) + '\n';

    if (level === 'error' || level === 'fatal') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
  }

  log(message: any, context?: string): void {
    this.write('info', message, context);
  }

  warn(message: any, context?: string): void {
    this.write('warn', message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  debug(message: any, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: any, context?: string): void {
    this.write('verbose', message, context);
  }

  fatal(message: any, context?: string): void {
    this.write('fatal', message, context);
  }
}
