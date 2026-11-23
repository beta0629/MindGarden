/**
 * 결제창 사용자 취소 vs 결제 실패 판정 (Expo — fail-closed minimal).
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { PORTONE_USER_CANCEL_CODE } from '@/constants/clientShopConstants';

const trimmedOrNull = (value: unknown): string | null => {
  if (value == null || typeof value === 'object') {
    return null;
  }
  const s = String(value).trim();
  return s || null;
};

const USER_CANCEL_MESSAGE_TOKEN = `[${PORTONE_USER_CANCEL_CODE}]`;

export type PortOneResultLike = {
  code?: string | null;
  pgCode?: string | null;
  message?: string | null;
  pgMessage?: string | null;
};

/**
 * PortOne 응답이 사용자가 결제창을 닫은 경우인지.
 *
 * @param result SDK/redirect 결과
 */
export const isPortOneUserCancel = (
  result: PortOneResultLike | null | undefined,
): boolean => {
  if (!result || typeof result !== 'object') {
    return false;
  }
  const code = trimmedOrNull(result.code);
  const pgCode = trimmedOrNull(result.pgCode);
  const message = trimmedOrNull(result.message) || '';
  return (
    code === PORTONE_USER_CANCEL_CODE ||
    pgCode === PORTONE_USER_CANCEL_CODE ||
    message.includes(USER_CANCEL_MESSAGE_TOKEN)
  );
};

/**
 * PortOne 실패 응답에서 사용자에게 보여줄 사유.
 *
 * @param result 실패 결과
 * @param fallback 기본 문구
 */
export const resolvePortOneFailureReason = (
  result: PortOneResultLike | null | undefined,
  fallback: string,
): string => {
  const raw = trimmedOrNull(result?.pgMessage) || trimmedOrNull(result?.message);
  if (!raw) {
    return fallback;
  }
  const withoutCode = raw.replace(/^\[[^\]]*\]\s*/, '').trim();
  return withoutCode || fallback;
};
