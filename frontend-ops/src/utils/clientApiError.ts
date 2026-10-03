export type NotifiedClientError = Error & {
  status?: number;
  body?: unknown;
  notified?: boolean;
};

/**
 * HTTP 오류는 clientApi 가 이미 알림을 띄운다.
 * 호출부가 같은 실패를 다시 알리지 않도록 notified 를 남긴다.
 */
export function createNotifiedClientError(
  message: string,
  status: number,
  body: unknown,
): NotifiedClientError {
  const error = new Error(message) as NotifiedClientError;
  error.status = status;
  error.body = body;
  error.notified = true;
  return error;
}

export function isClientApiErrorNotified(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("notified" in error)) {
    return false;
  }
  return Boolean((error as NotifiedClientError).notified);
}
