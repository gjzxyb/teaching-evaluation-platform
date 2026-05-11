import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { createErrorEnvelope, resolveRequestTraceId } from './http-envelope.js';

interface JsonResponse {
  status(code: number): { json(body: unknown): unknown };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const response = context.getResponse<JsonResponse>();
    const traceId = resolveRequestTraceId(request.headers);
    const envelope = createErrorEnvelope(exception, traceId);
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json(envelope);
  }
}
