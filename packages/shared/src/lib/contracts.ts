export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

export function createTraceId(): string {
  return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function apiSuccess<T>(data: T, traceId = createTraceId()): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'OK',
    data,
    traceId
  };
}

export function apiError(
  code: number,
  message: string,
  traceId = createTraceId()
): ApiEnvelope<null> {
  return {
    code,
    message,
    data: null,
    traceId
  };
}
