import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import type { ApiEnvelope } from '@tep/shared';
import { map, type Observable } from 'rxjs';
import { resolveRequestTraceId } from './http-envelope.js';

@Injectable()
export class TraceResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const traceId = resolveRequestTraceId(request.headers);

    return next.handle().pipe(
      map((body: unknown) => {
        if (isApiEnvelope(body)) {
          return { ...body, traceId };
        }
        return body;
      })
    );
  }
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'traceId' in value
  );
}
