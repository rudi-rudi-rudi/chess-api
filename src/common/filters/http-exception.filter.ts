import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttp ? exception.getResponse() : 'Internal server error';

    const message =
      typeof raw === 'string'
        ? raw
        : Array.isArray((raw as any)?.message)
          ? (raw as any).message.join(', ')
          : ((raw as any)?.message ?? 'Internal server error');

    const error =
      typeof raw === 'object' && raw !== null && 'error' in (raw as Record<string, unknown>)
        ? String((raw as Record<string, unknown>).error)
        : HttpStatus[status] || 'Error';

    response.status(status).json({
      error: {
        statusCode: status,
        code: error,
        message,
      },
      path: request?.url,
      timestamp: new Date().toISOString(),
    });
  }
}
