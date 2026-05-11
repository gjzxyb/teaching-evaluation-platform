export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
}

export function apiSuccess<T>(data: T): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'OK',
    data,
    traceId: `trace-${Date.now()}`
  };
}
