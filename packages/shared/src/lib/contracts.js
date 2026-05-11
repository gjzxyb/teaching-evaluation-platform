export function createTraceId() {
    return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
export function apiSuccess(data, traceId = createTraceId()) {
    return {
        code: 0,
        message: 'OK',
        data,
        traceId
    };
}
export function apiError(code, message, traceId = createTraceId()) {
    return {
        code,
        message,
        data: null,
        traceId
    };
}
