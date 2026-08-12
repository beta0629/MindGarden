/**
 * sessionExpiryDisplay — 세션 잔여/만료 포맷·폴백 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-08-05
 */

import { SESSION_DURATION, SESSION_KEYS } from '../../constants/session';
import { storage } from '../common';
import {
  buildSessionExpiryLabel,
  buildSessionRemainingLabel,
  clearStoredSessionExpiry,
  computeSessionExpiryState,
  formatSessionCountdown,
  formatSessionRemainingHms,
  pickFresherSessionInfo,
  syncStoredSessionExpiry
} from '../sessionExpiryDisplay';

describe('sessionExpiryDisplay', () => {
  const clientNow = 1_700_000_000_000;

  afterEach(() => {
    try {
      storage.remove(SESSION_KEYS.SESSION_EXPIRY);
      storage.remove(SESSION_KEYS.LOGIN_TIME);
    } catch {
      // ignore
    }
  });

  test('pickFresherSessionInfo prefers higher clientReceivedAt', () => {
    const older = {
      clientReceivedAt: clientNow,
      lastAccessedTime: clientNow
    };
    const newer = {
      clientReceivedAt: clientNow + 1000,
      lastAccessedTime: clientNow + 500
    };
    expect(pickFresherSessionInfo(older, newer)).toBe(newer);
    expect(pickFresherSessionInfo(newer, older)).toBe(newer);
  });

  test('pickFresherSessionInfo ties on receivedAt then uses lastAccessedTime', () => {
    const a = {
      clientReceivedAt: clientNow,
      lastAccessedTime: clientNow
    };
    const b = {
      clientReceivedAt: clientNow,
      lastAccessedTime: clientNow + 2000
    };
    expect(pickFresherSessionInfo(a, b)).toBe(b);
    expect(pickFresherSessionInfo(b, a)).toBe(b);
  });

  test('pickFresherSessionInfo falls back when one side missing', () => {
    const only = { clientReceivedAt: clientNow, lastAccessedTime: clientNow };
    expect(pickFresherSessionInfo(null, only)).toBe(only);
    expect(pickFresherSessionInfo(only, null)).toBe(only);
  });

  test('session-info timing → remainingMs / expiryMs', () => {
    const lastAcc = clientNow - 60_000;
    const maxSec = 3600;
    const si = {
      maxInactiveInterval: maxSec,
      lastAccessedTime: lastAcc,
      serverNow: clientNow,
      clientReceivedAt: clientNow
    };
    const state = computeSessionExpiryState(si, clientNow, { allowFallback: false });
    expect(state.source).toBe('session-info');
    expect(state.expiryMs).toBe(lastAcc + maxSec * 1000);
    expect(state.remainingMs).toBe(maxSec * 1000 - 60_000);
  });

  test('clientNow만 진행해도 remainingMs 감소 (오프셋 스냅샷 고정)', () => {
    const lastAcc = clientNow - 60_000;
    const maxSec = 3600;
    const si = {
      maxInactiveInterval: maxSec,
      lastAccessedTime: lastAcc,
      serverNow: clientNow,
      clientReceivedAt: clientNow
    };
    const t0 = computeSessionExpiryState(si, clientNow, { allowFallback: false });
    const t1 = computeSessionExpiryState(si, clientNow + 1000, { allowFallback: false });
    expect(t1.remainingMs).toBe(t0.remainingMs - 1000);
    expect(t1.offsetMs).toBe(t0.offsetMs);
  });

  test('session-info 갱신(활동 연장) 시 remaining이 ~maxInactive로 리필', () => {
    const maxSec = 4 * 60 * 60;
    const before = {
      maxInactiveInterval: maxSec,
      lastAccessedTime: clientNow - 30 * 60 * 1000,
      serverNow: clientNow,
      clientReceivedAt: clientNow
    };
    const afterSlide = {
      maxInactiveInterval: maxSec,
      lastAccessedTime: clientNow + 1000,
      serverNow: clientNow + 1000,
      clientReceivedAt: clientNow + 1000
    };
    const remBefore = computeSessionExpiryState(before, clientNow, {
      allowFallback: false
    }).remainingMs;
    const remAfter = computeSessionExpiryState(afterSlide, clientNow + 1000, {
      allowFallback: false
    }).remainingMs;
    expect(remBefore).toBeLessThan(maxSec * 1000);
    expect(remAfter).toBe(maxSec * 1000);
  });

  test('allowFallback false + missing timing → null remaining', () => {
    const state = computeSessionExpiryState({ isAuthenticated: true }, clientNow, {
      allowFallback: false
    });
    expect(state.remainingMs).toBeNull();
    expect(state.expiryMs).toBeNull();
  });

  test('maxInactive 없을 때 SESSION_DURATION 폴백(lastAccessed 있음)', () => {
    const lastAcc = clientNow;
    const si = {
      lastAccessedTime: lastAcc,
      serverNow: clientNow,
      clientReceivedAt: clientNow
    };
    const state = computeSessionExpiryState(si, clientNow, { allowFallback: true });
    expect(state.source).toBe('session-info');
    expect(state.remainingMs).toBe(SESSION_DURATION);
  });

  test('duration-fallback도 고정 expiry 기준으로 카운트다운', () => {
    const t0 = computeSessionExpiryState(null, clientNow, { allowFallback: true });
    expect(t0.source).toBe('duration-fallback');
    expect(t0.remainingMs).toBe(SESSION_DURATION);
    expect(t0.expiryMs).toBe(clientNow + SESSION_DURATION);

    const t1 = computeSessionExpiryState(null, clientNow + 2000, { allowFallback: true });
    expect(t1.source).toBe('storage-expiry');
    expect(t1.remainingMs).toBe(SESSION_DURATION - 2000);
    expect(t1.expiryMs).toBe(t0.expiryMs);
  });

  test('syncStoredSessionExpiry: 인증 스냅샷이면 lastAccessed + maxInactive 로 슬라이딩 저장', () => {
    const maxSec = SESSION_DURATION / 1000;
    storage.set(SESSION_KEYS.SESSION_EXPIRY, clientNow);

    const expiryMs = syncStoredSessionExpiry({
      isAuthenticated: true,
      maxInactiveInterval: maxSec,
      lastAccessedTime: clientNow,
      serverNow: clientNow,
      clientReceivedAt: clientNow
    });

    expect(expiryMs).toBe(clientNow + maxSec * 1000);
    expect(storage.get(SESSION_KEYS.SESSION_EXPIRY)).toBe(clientNow + maxSec * 1000);
  });

  test('syncStoredSessionExpiry: 미인증·타이밍 없음이면 저장값 제거', () => {
    storage.set(SESSION_KEYS.SESSION_EXPIRY, clientNow + SESSION_DURATION);
    expect(syncStoredSessionExpiry({ isAuthenticated: false })).toBeNull();
    expect(storage.get(SESSION_KEYS.SESSION_EXPIRY)).toBeNull();

    storage.set(SESSION_KEYS.SESSION_EXPIRY, clientNow + SESSION_DURATION);
    expect(syncStoredSessionExpiry({ isAuthenticated: true })).toBeNull();
    expect(storage.get(SESSION_KEYS.SESSION_EXPIRY)).toBeNull();
  });

  test('clearStoredSessionExpiry 후에는 storage-expiry 폴백이 없다', () => {
    storage.set(SESSION_KEYS.SESSION_EXPIRY, clientNow + SESSION_DURATION);
    clearStoredSessionExpiry();
    const state = computeSessionExpiryState(null, clientNow, { allowFallback: false });
    expect(state.remainingMs).toBeNull();
    expect(storage.get(SESSION_KEYS.SESSION_EXPIRY)).toBeNull();
  });

  test('formatSessionCountdown pads MM:SS', () => {
    expect(formatSessionCountdown(65)).toBe('01:05');
    expect(formatSessionCountdown(-3)).toBe('00:00');
  });

  test('formatSessionRemainingHms and label', () => {
    expect(formatSessionRemainingHms(3 * 3600 * 1000 + 42 * 60 * 1000 + 10 * 1000)).toBe(
      '3:42:10'
    );
    expect(buildSessionRemainingLabel(10_000)).toBe('세션 잔여 0:00:10');
  });

  test('buildSessionExpiryLabel returns locale prefix', () => {
    const label = buildSessionExpiryLabel(clientNow + 60_000);
    expect(label.startsWith('만료 시각 ')).toBe(true);
    expect(label.length).toBeGreaterThan('만료 시각 '.length);
  });
});
