import { extractServerErrorMessageFromError } from './ajax';
import { isGenericServerErrorMessage } from '../constants/genericServerErrorMessages';

/**
 * ajax·StandardizedApi 가 담은 서버 문구를 고른다.
 * 응답 본문 message 를 먼저 보고, 없거나 일반 5xx 문구이면 Error.message 를 본다.
 * 둘 다 없거나 일반 5xx 이면 fallback 을 반환한다.
 *
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function resolveUserFacingApiErrorMessage(error, fallback) {
  const fromBody = extractServerErrorMessageFromError(error);
  const fromError = error != null && typeof error.message === 'string' ? error.message : '';
  const candidates = [fromBody, fromError];
  for (let i = 0; i < candidates.length; i += 1) {
    const text = typeof candidates[i] === 'string' ? candidates[i].trim() : '';
    if (text !== '' && !isGenericServerErrorMessage(text)) {
      return text;
    }
  }
  return fallback;
}
