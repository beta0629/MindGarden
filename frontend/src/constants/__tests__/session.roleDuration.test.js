import {
  SESSION_DURATION,
  SESSION_DURATION_BY_ROLE,
  SESSION_TIMEOUT_SECONDS_BY_ROLE,
  getSessionDurationMsForRole
} from '../session';

/**
 * BE SessionConstants / SessionTimeoutProperties 역할별 TTL 과 FE 폴백 맵 정합.
 */
describe('SESSION_DURATION_BY_ROLE / getSessionDurationMsForRole', () => {
  test('역할별 초·ms 맵이 BE와 동일(CLIENT 1h, CONSULTANT 2h, ADMIN/STAFF 4h)', () => {
    expect(SESSION_TIMEOUT_SECONDS_BY_ROLE.CLIENT).toBe(3600);
    expect(SESSION_TIMEOUT_SECONDS_BY_ROLE.CONSULTANT).toBe(7200);
    expect(SESSION_TIMEOUT_SECONDS_BY_ROLE.ADMIN).toBe(14400);
    expect(SESSION_TIMEOUT_SECONDS_BY_ROLE.STAFF).toBe(14400);

    expect(SESSION_DURATION_BY_ROLE.CLIENT).toBe(3600 * 1000);
    expect(SESSION_DURATION_BY_ROLE.CONSULTANT).toBe(7200 * 1000);
    expect(SESSION_DURATION_BY_ROLE.ADMIN).toBe(SESSION_DURATION);
    expect(SESSION_DURATION_BY_ROLE.STAFF).toBe(SESSION_DURATION);
  });

  test('getSessionDurationMsForRole — 역할별 ms, null/unknown은 ADMIN 폴백', () => {
    expect(getSessionDurationMsForRole('CLIENT')).toBe(3600 * 1000);
    expect(getSessionDurationMsForRole('CONSULTANT')).toBe(7200 * 1000);
    expect(getSessionDurationMsForRole('ADMIN')).toBe(14400 * 1000);
    expect(getSessionDurationMsForRole('STAFF')).toBe(14400 * 1000);
    expect(getSessionDurationMsForRole('ROLE_CLIENT')).toBe(3600 * 1000);
    expect(getSessionDurationMsForRole('PLAY_THERAPIST')).toBe(7200 * 1000);
    expect(getSessionDurationMsForRole(null)).toBe(SESSION_DURATION);
    expect(getSessionDurationMsForRole('')).toBe(SESSION_DURATION);
    expect(getSessionDurationMsForRole('UNKNOWN_ROLE')).toBe(SESSION_DURATION);
  });
});
