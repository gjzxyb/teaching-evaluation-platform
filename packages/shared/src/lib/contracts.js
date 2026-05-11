export function apiSuccess(data) {
    return {
        code: 0,
        message: 'OK',
        data,
        traceId: `trace-${Date.now()}`
    };
}
