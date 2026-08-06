/**
 * sessionIdle 유틸 — 웹 4h(14400s) 정합·만료 시 sign_out 결정.
 *
 * @author MindGarden
 * @since 2026-08-05
 */
import {
  HTTP_SESSION_MAX_INACTIVE_SECONDS,
  SESSION_IDLE_ACTIVITY_THROTTLE_MS,
  SESSION_IDLE_MAX_MS,
} from '@/constants/session';
import {
  evaluateSessionIdleSignOut,
  isSessionIdleExpired,
  shouldRecordIdleActivity,
} from '../sessionIdle';

describe('session constants (web SSOT)', () => {
  it('matches web 4h idle (14400s / 14400000ms)', () => {
    expect(HTTP_SESSION_MAX_INACTIVE_SECONDS).toBe(14400);
    expect(SESSION_IDLE_MAX_MS).toBe(14_400_000);
    expect(SESSION_IDLE_MAX_MS).toBe(HTTP_SESSION_MAX_INACTIVE_SECONDS * 1000);
  });
});

describe('isSessionIdleExpired', () => {
  const base = 1_000_000;

  it('returns false before idle max', () => {
    expect(isSessionIdleExpired(base, base + SESSION_IDLE_MAX_MS - 1)).toBe(false);
  });

  it('returns true at and after idle max', () => {
    expect(isSessionIdleExpired(base, base + SESSION_IDLE_MAX_MS)).toBe(true);
    expect(isSessionIdleExpired(base, base + SESSION_IDLE_MAX_MS + 1)).toBe(true);
  });

  it('returns false for invalid lastActivity', () => {
    expect(isSessionIdleExpired(0, base + SESSION_IDLE_MAX_MS)).toBe(false);
    expect(isSessionIdleExpired(Number.NaN, base + SESSION_IDLE_MAX_MS)).toBe(false);
  });
});

describe('shouldRecordIdleActivity', () => {
  it('allows first record and after throttle', () => {
    expect(shouldRecordIdleActivity(0, 1000)).toBe(true);
    expect(shouldRecordIdleActivity(1000, 1000 + SESSION_IDLE_ACTIVITY_THROTTLE_MS - 1)).toBe(
      false,
    );
    expect(shouldRecordIdleActivity(1000, 1000 + SESSION_IDLE_ACTIVITY_THROTTLE_MS)).toBe(true);
  });
});

describe('evaluateSessionIdleSignOut', () => {
  const last = 5_000_000;

  it('continues when not authenticated even if idle', () => {
    expect(
      evaluateSessionIdleSignOut({
        isAuthenticated: false,
        lastActivityAtMs: last,
        nowMs: last + SESSION_IDLE_MAX_MS + 1,
      }),
    ).toBe('continue');
  });

  it('continues when authenticated but within idle window', () => {
    expect(
      evaluateSessionIdleSignOut({
        isAuthenticated: true,
        lastActivityAtMs: last,
        nowMs: last + SESSION_IDLE_MAX_MS - 1,
      }),
    ).toBe('continue');
  });

  it('sign_out when authenticated and idle exceeded (performSignOut 경로 트리거)', () => {
    expect(
      evaluateSessionIdleSignOut({
        isAuthenticated: true,
        lastActivityAtMs: last,
        nowMs: last + SESSION_IDLE_MAX_MS,
      }),
    ).toBe('sign_out');
  });
});
