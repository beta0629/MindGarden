/**
 * sessionExpiryDisplay — 세션 잔여/만료 포맷·폴백 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-08-05
 */

import { SESSION_DURATION } from '../../constants/session';
import {
  buildSessionExpiryLabel,
  buildSessionRemainingLabel,
  computeSessionExpiryState,
  formatSessionCountdown,
  formatSessionRemainingHms
} from '../sessionExpiryDisplay';

describe('sessionExpiryDisplay', () => {
  const clientNow = 1_700_000_000_000;

  test('session-info timing → remainingMs / expiryMs', () => {
    const lastAcc = clientNow - 60_000;
    const maxSec = 3600;
    const si = {
      maxInactiveInterval: maxSec,
      lastAccessedTime: lastAcc,
      serverNow: clientNow
    };
    const state = computeSessionExpiryState(si, clientNow, { allowFallback: false });
    expect(state.source).toBe('session-info');
    expect(state.expiryMs).toBe(lastAcc + maxSec * 1000);
    expect(state.remainingMs).toBe(maxSec * 1000 - 60_000);
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
    const si = { lastAccessedTime: lastAcc, serverNow: clientNow };
    const state = computeSessionExpiryState(si, clientNow, { allowFallback: true });
    expect(state.source).toBe('session-info');
    expect(state.remainingMs).toBe(SESSION_DURATION);
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
