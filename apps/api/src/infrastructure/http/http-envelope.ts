import { HttpException, HttpStatus } from '@nestjs/common';
import { apiError, createTraceId, type ApiEnvelope } from '@tep/shared';

export type HeaderValue = string | string[] | undefined;

export function resolveRequestTraceId(headers: Record<string, HeaderValue>): string {
  const raw = headers['x-trace-id'] ?? headers['X-Trace-Id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ? value : createTraceId();
}

export function createErrorEnvelope(error: unknown, traceId: string): ApiEnvelope<null> {
  if (error instanceof HttpException) {
    return apiError(error.getStatus(), resolveHttpExceptionMessage(error), traceId);
  }
  return apiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error', traceId);
}

function resolveHttpExceptionMessage(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === 'string') {
    return response;
  }
  if (isObject(response)) {
    const message = response.message;
    if (Array.isArray(message)) {
      return message.join('; ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return error.message;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
