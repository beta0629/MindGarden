/**
 * 한국 휴대폰 번호 정규화·검증 — LoginIdentifierUtils 와 동일 규칙
 */

import { TRINITY_CONSTANTS } from '../constants/trinity';

const KOREAN_MOBILE_PATTERN = /^01(0\d{8}|[16789]\d{7,8})$/;

/** 비숫자 제거 후 한국 휴대폰 관용 정규화 (+82 → 0 접두) */
export function normalizeKoreanMobileDigits(raw: string): string {
  if (!raw) {
    return '';
  }
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('82') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length === 10 && digits.startsWith('10')) {
    digits = `0${digits}`;
  }
  return digits;
}

export function isValidKoreanMobileDigits(digits: string): boolean {
  if (!digits) {
    return false;
  }
  return KOREAN_MOBILE_PATTERN.test(digits);
}

export function validatePhoneFormat(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_PHONE_REQUIRED };
  }
  const normalized = normalizeKoreanMobileDigits(phone);
  if (!isValidKoreanMobileDigits(normalized)) {
    return { valid: false, error: TRINITY_CONSTANTS.MESSAGES.ERROR_PHONE_INVALID };
  }
  return { valid: true };
}

/** 화면 표시용 010-1234-5678 형식 */
export function formatPhoneDisplay(digits: string): string {
  const d = normalizeKoreanMobileDigits(digits);
  if (d.length <= 3) {
    return d;
  }
  if (d.length <= 7) {
    return `${d.slice(0, 3)}-${d.slice(3)}`;
  }
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export function buildOtpSentMessage(channel?: string | null): string {
  if (channel === TRINITY_CONSTANTS.OTP.DELIVERY_CHANNEL_PUSH) {
    return TRINITY_CONSTANTS.MESSAGES.OTP_SENT_PUSH;
  }
  if (channel === TRINITY_CONSTANTS.OTP.DELIVERY_CHANNEL_SMS_STUB) {
    return TRINITY_CONSTANTS.MESSAGES.OTP_SENT_SMS_STUB;
  }
  if (channel === TRINITY_CONSTANTS.OTP.DELIVERY_CHANNEL_SMS) {
    return TRINITY_CONSTANTS.MESSAGES.OTP_SENT_SMS;
  }
  return TRINITY_CONSTANTS.MESSAGES.OTP_SENT_DEFAULT;
}
