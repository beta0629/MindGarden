/**
 * 결제 흐름 안 휴대폰 인증 — 상태·서버 값 해석 (순수 로직, 웹·앱 공용).
 * 타이머·재전송 간격·남은 시도 횟수는 서버가 주는 값만 쓴다. 없으면 표시하지 않는다(기존 동작).
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  CLIENT_MALL_HTTP_TOO_MANY_REQUESTS,
  CLIENT_MALL_OTP_MISMATCH_MARKER,
  CLIENT_MALL_PHONE_COPY,
  CLIENT_MALL_TIMING
} from '../constants/clientMallConstants';

/** 인증 단계 (§8 a~g) */
export const PHONE_VERIFY_STEP = Object.freeze({
  INPUT: 'INPUT',
  SENT: 'SENT',
  EXPIRED: 'EXPIRED',
  LOCKED: 'LOCKED',
  VERIFIED: 'VERIFIED'
});

export const PHONE_VERIFY_ERROR = Object.freeze({
  WRONG_CODE: 'WRONG_CODE',
  SEND_FAILED: 'SEND_FAILED',
  INVALID_PHONE: 'INVALID_PHONE',
  OTHER: 'OTHER'
});

const SECONDS_PER_MINUTE = 60;

const toNonNegativeInt = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

const toPositiveInt = (value) => {
  const n = toNonNegativeInt(value);
  return n != null && n > 0 ? n : null;
};

/**
 * 발송/확인 응답(또는 오류 본문)에서 서버 정책 값을 읽는다.
 *
 * @param {object|null|undefined} source
 * @returns {{
 *   expiresInSeconds: number|null,
 *   resendCooldownSeconds: number|null,
 *   remainingAttempts: number|null,
 *   retryAfterSeconds: number|null
 * }}
 */
export const parseOtpServerMeta = (source) => {
  const s = source && typeof source === 'object' ? source : {};
  return {
    expiresInSeconds: toPositiveInt(s.expiresInSeconds),
    resendCooldownSeconds: toPositiveInt(s.resendCooldownSeconds),
    remainingAttempts: toNonNegativeInt(s.remainingAttempts),
    retryAfterSeconds: toPositiveInt(s.retryAfterSeconds)
  };
};

/**
 * @param {*} err StandardizedApi 오류
 * @returns {object|null}
 */
const readErrorBody = (err) => {
  const data = err?.response?.data;
  if (data && typeof data === 'object') {
    return data.data && typeof data.data === 'object' ? { ...data, ...data.data } : data;
  }
  return null;
};

/**
 * 확인(검증) 실패 분류.
 *
 * @param {*} err
 * @returns {{ locked: boolean, kind: string, message: string, meta: ReturnType<typeof parseOtpServerMeta> }}
 */
export const classifyPhoneConfirmError = (err) => {
  const meta = parseOtpServerMeta(readErrorBody(err));
  const status = Number(err?.status);
  const message = typeof err?.message === 'string' ? err.message.trim() : '';
  if (status === CLIENT_MALL_HTTP_TOO_MANY_REQUESTS || meta.remainingAttempts === 0) {
    return { locked: true, kind: PHONE_VERIFY_ERROR.OTHER, message, meta };
  }
  if (message.includes(CLIENT_MALL_OTP_MISMATCH_MARKER)) {
    return { locked: false, kind: PHONE_VERIFY_ERROR.WRONG_CODE, message, meta };
  }
  return { locked: false, kind: PHONE_VERIFY_ERROR.OTHER, message, meta };
};

/**
 * 발송 실패 분류 (429 = 시도 초과 잠김).
 *
 * @param {*} err
 * @returns {{ locked: boolean, meta: ReturnType<typeof parseOtpServerMeta> }}
 */
export const classifyPhoneSendError = (err) => {
  const meta = parseOtpServerMeta(readErrorBody(err));
  const status = Number(err?.status);
  return { locked: status === CLIENT_MALL_HTTP_TOO_MANY_REQUESTS, meta };
};

/**
 * @param {number|null} remainingAttempts
 * @returns {string}
 */
export const buildWrongCodeMessage = (remainingAttempts) => {
  const base = CLIENT_MALL_PHONE_COPY.WRONG_CODE;
  if (remainingAttempts == null || remainingAttempts <= 0) {
    return base;
  }
  const { WRONG_CODE_ATTEMPTS_PREFIX: prefix, WRONG_CODE_ATTEMPTS_SUFFIX: suffix } = CLIENT_MALL_PHONE_COPY;
  return `${base}${prefix}${remainingAttempts}${suffix}`;
};

/**
 * @param {number|null} retryAfterSeconds
 * @returns {string}
 */
export const buildLockedMessage = (retryAfterSeconds) => {
  if (retryAfterSeconds == null) {
    return CLIENT_MALL_PHONE_COPY.LOCKED_BODY_FALLBACK;
  }
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / SECONDS_PER_MINUTE));
  return `${minutes}${CLIENT_MALL_PHONE_COPY.LOCKED_BODY_MINUTES_SUFFIX}`;
};

/**
 * @param {number|null} targetMs
 * @param {number} nowMs
 * @returns {number|null} 남은 초 (대상 없으면 null)
 */
export const secondsUntil = (targetMs, nowMs) => {
  if (targetMs == null) {
    return null;
  }
  return Math.max(0, Math.ceil((targetMs - nowMs) / CLIENT_MALL_TIMING.MS_PER_SECOND));
};
