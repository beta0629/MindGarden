/**
 * 한국 휴대폰 번호 정규화·검증.
 * 백엔드 com.coresolution.consultation.util.LoginIdentifierUtils 와 동일 규칙.
 */

import { toDisplayString } from './safeDisplay';

/** 정규화된 숫자열이 휴대폰 패턴인지 (010 / 011·016~019 만 허용). */
const KOREAN_MOBILE_DIGITS_PATTERN = /^01(0\d{8}|[16789]\d{7,8})$/;

/**
 * 비숫자 제거 후 한국 휴대폰 관용 정규화 (+82 → 0, 10자리 10… → 0 접두).
 *
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function normalizeKoreanMobileDigits(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  let digits = String(raw).replaceAll(/\D/g, '');
  if (digits.startsWith('82') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length === 10 && digits.startsWith('10')) {
    digits = `0${digits}`;
  }
  return digits;
}

/**
 * normalizeKoreanMobileDigits 결과가 휴대폰 번호인지.
 *
 * @param {string} digits
 * @returns {boolean}
 */
export function isValidKoreanMobileDigits(digits) {
  if (!digits) {
    return false;
  }
  return KOREAN_MOBILE_DIGITS_PATTERN.test(digits);
}

/**
 * UI 표시용 휴대폰 포맷(SSOT). 저장/API 값은 변경하지 않음.
 * 정책: `normalizeKoreanMobileDigits` 후 `isValidKoreanMobileDigits`이면 하이픈(11자리 3-4-4, 10자리 3-3-4),
 * 그 외(지역번호·내선·암호문 폴백 문구 등)는 trim 한 원문을 그대로 둔다(`toDisplayString`과 동일 취급).
 *
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function formatKoreanMobileForDisplay(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  const trimmed = String(raw).trim();
  const digits = normalizeKoreanMobileDigits(trimmed);
  if (!digits || !isValidKoreanMobileDigits(digits)) {
    return toDisplayString(trimmed, '');
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return toDisplayString(trimmed, '');
}
