/**
 * HTTP 세션 만료·잔여 시간 표시용 계산·포맷.
 * 데이터: session-info(maxInactiveInterval/lastAccessedTime/serverNow) 우선,
 * 폴백: storage SESSION_EXPIRY / LOGIN_TIME+SESSION_DURATION.
 * JWT·쿠키 원문은 다루지 않는다.
 *
 * @author CoreSolution
 * @since 2026-08-05
 */

import { SESSION_DURATION, SESSION_KEYS, SESSION_REMAINING_DISPLAY } from '../constants/session';
import { storage } from './common';
import { toDisplayString, toSafeNumber } from './safeDisplay';

/**
 * Context `sessionInfo`와 `sessionManager.getSessionInfo()` 중 더 최신 스냅샷을 고른다.
 * `clientReceivedAt`이 더 큰 쪽 우선, 동률이면 `lastAccessedTime`이 더 큰 쪽.
 *
 * @param {object|null|undefined} contextInfo
 * @param {object|null|undefined} managerInfo
 * @returns {object|null|undefined}
 */
export function pickFresherSessionInfo(contextInfo, managerInfo) {
  if (!managerInfo) {
    return contextInfo;
  }
  if (!contextInfo) {
    return managerInfo;
  }
  const ctxReceived = toSafeNumber(contextInfo.clientReceivedAt, 0);
  const mgrReceived = toSafeNumber(managerInfo.clientReceivedAt, 0);
  if (mgrReceived > ctxReceived) {
    return managerInfo;
  }
  if (ctxReceived > mgrReceived) {
    return contextInfo;
  }
  const ctxLast = toSafeNumber(contextInfo.lastAccessedTime, 0);
  const mgrLast = toSafeNumber(managerInfo.lastAccessedTime, 0);
  if (mgrLast > ctxLast) {
    return managerInfo;
  }
  return contextInfo;
}

/**
 * @param {object|null|undefined} si — sessionInfo (session-info API).
 *   `clientReceivedAt`(클라 수신 epoch ms)이 있으면 서버-클라 offset을 그 시점에 고정한다.
 * @param {number} clientNowMs
 * @param {{ fallbackExpiryMs?: (number|null), allowFallback?: boolean }} [options]
 * @returns {{ expiryMs: (number|null), offsetMs: number, remainingMs: (number|null), source: string }}
 */
export function computeSessionExpiryState(si, clientNowMs, options = {}) {
  const now = toSafeNumber(clientNowMs, Date.now());
  const allowFallback = options.allowFallback !== false;

  if (si) {
    let maxSec = toSafeNumber(si.maxInactiveInterval, -1);
    const lastAcc = toSafeNumber(si.lastAccessedTime, -1);
    if (maxSec <= 0 && lastAcc > 0 && allowFallback) {
      maxSec = SESSION_DURATION / 1000;
    }
    if (maxSec > 0 && lastAcc > 0) {
      const serverNow =
        si.serverNow != null ? toSafeNumber(si.serverNow, now) : now;
      // 오프셋은 session-info 스냅샷 시점(clientReceivedAt)에 고정. 매 틱 now로 재계산하면 remaining이 상수로 고정됨.
      const receivedAt = toSafeNumber(si.clientReceivedAt, now);
      const offsetMs = serverNow - receivedAt;
      const expiryMs = lastAcc + maxSec * 1000;
      const remainingMs = expiryMs - (now + offsetMs);
      return { expiryMs, offsetMs, remainingMs, source: 'session-info' };
    }
  }

  if (!allowFallback) {
    return { expiryMs: null, offsetMs: 0, remainingMs: null, source: 'none' };
  }

  const explicitFallback = options.fallbackExpiryMs;
  if (explicitFallback != null) {
    const expiryMs = toSafeNumber(explicitFallback, -1);
    if (expiryMs > 0) {
      return {
        expiryMs,
        offsetMs: 0,
        remainingMs: expiryMs - now,
        source: 'explicit-fallback'
      };
    }
  }

  try {
    const storedExpiry = storage.get(SESSION_KEYS.SESSION_EXPIRY);
    const expiryFromStorage = toSafeNumber(storedExpiry, -1);
    if (expiryFromStorage > 0) {
      return {
        expiryMs: expiryFromStorage,
        offsetMs: 0,
        remainingMs: expiryFromStorage - now,
        source: 'storage-expiry'
      };
    }
    const loginTime = toSafeNumber(storage.get(SESSION_KEYS.LOGIN_TIME), -1);
    if (loginTime > 0) {
      const expiryMs = loginTime + SESSION_DURATION;
      return {
        expiryMs,
        offsetMs: 0,
        remainingMs: expiryMs - now,
        source: 'login-time-duration'
      };
    }
  } catch {
    // storage 미가용 시 duration 폴백으로 진행
  }

  // 고정 expiry를 스냅샷·저장해 이후 틱에서 카운트다운되도록 함 (매 틱 now+duration이면 remaining 상수 고정)
  const expiryMs = now + SESSION_DURATION;
  try {
    storage.set(SESSION_KEYS.SESSION_EXPIRY, expiryMs);
  } catch {
    // storage 미가용 시에도 이번 호출의 고정 expiry로 반환
  }
  return {
    expiryMs,
    offsetMs: 0,
    remainingMs: expiryMs - now,
    source: 'duration-fallback'
  };
}

/**
 * 남은 초 → MM:SS (idle 경고 모달용, 음수는 0).
 * @param {number|*} totalSeconds
 * @returns {string}
 */
export function formatSessionCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(toSafeNumber(totalSeconds, 0)));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/**
 * 남은 ms → H:MM:SS (헤더 상시 표시용).
 * @param {number|*} remainingMs
 * @returns {string}
 */
export function formatSessionRemainingHms(remainingMs) {
  const totalSec = Math.max(0, Math.floor(toSafeNumber(remainingMs, 0) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 만료 epoch ms → 로케일 시각 문자열.
 * @param {number|*} expiryMs
 * @param {string} [locale]
 * @returns {string}
 */
export function formatSessionExpiryLocale(expiryMs, locale = 'ko-KR') {
  const ms = toSafeNumber(expiryMs, -1);
  if (ms <= 0) {
    return '';
  }
  try {
    return new Date(ms).toLocaleString(locale, {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return new Date(ms).toLocaleString();
  }
}

/**
 * 헤더용 한 줄 라벨: `세션 잔여 3:42:10`
 * @param {number|null|undefined} remainingMs
 * @returns {string}
 */
export function buildSessionRemainingLabel(remainingMs) {
  if (remainingMs == null) {
    return '';
  }
  const hms = formatSessionRemainingHms(remainingMs);
  return toDisplayString(`${SESSION_REMAINING_DISPLAY.LABEL_PREFIX} ${hms}`, '');
}

/**
 * 모달/마이페이지용 만료 시각 한 줄: `만료 시각 8. 5. 오후 10:42`
 * @param {number|null|undefined} expiryMs
 * @returns {string}
 */
export function buildSessionExpiryLabel(expiryMs) {
  const localeStr = formatSessionExpiryLocale(expiryMs);
  if (!localeStr) {
    return '';
  }
  return toDisplayString(`${SESSION_REMAINING_DISPLAY.EXPIRY_PREFIX} ${localeStr}`, '');
}
