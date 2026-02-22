import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export function buildRequestLogLine(input: {
  requestId: string;
  method?: string;
  url?: string;
  statusCode?: number;
  durationMs?: number;
}) {
  const { requestId, method = 'UNKNOWN', url = '/', statusCode = 0, durationMs = 0 } = input;
  return `[${requestId}] ${method} ${url} -> ${statusCode} ${durationMs}ms`;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: any, res: any, next: () => void) {
    const startedAt = Date.now();
    const incoming = req.headers?.['x-request-id'];
    const requestId = typeof incoming === 'string' && incoming.length > 5 ? incoming : randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        buildRequestLogLine({
          requestId,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs,
        }),
      );
    });

    next();
  }
}
