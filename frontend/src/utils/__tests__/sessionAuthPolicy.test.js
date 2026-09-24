/**
 * sessionAuthPolicy — soft-fail URL · justLoggedIn TTL
 */
import {
  JUST_LOGGED_IN_AT_KEY,
  JUST_LOGGED_IN_KEY,
  JUST_LOGGED_IN_TTL_MS,
  SESSION_SOFT_FAIL_URL_PATHS
} from '../../constants/session';
import {
  clearJustLoggedIn,
  isSessionSoftFailUrl,
  isWithinJustLoggedInWindow,
  markJustLoggedIn
} from '../sessionAuthPolicy';

describe('sessionAuthPolicy', () => {
  beforeEach(() => {
    clearJustLoggedIn();
  });

  afterEach(() => {
    clearJustLoggedIn();
  });

  describe('isSessionSoftFailUrl', () => {
    it('allowlist path 매칭 (query 무시)', () => {
      expect(isSessionSoftFailUrl('/api/v1/admin/branding')).toBe(true);
      expect(isSessionSoftFailUrl('/api/admin/branding')).toBe(true);
      expect(isSessionSoftFailUrl('https://t.example/api/v1/menus/lnb?x=1')).toBe(true);
      expect(isSessionSoftFailUrl('/api/v1/common-codes?codeGroup=X')).toBe(true);
      expect(isSessionSoftFailUrl('/api/v1/admin/consultants')).toBe(false);
    });

    it('SESSION_SOFT_FAIL_URL_PATHS 상수와 정합', () => {
      SESSION_SOFT_FAIL_URL_PATHS.forEach((p) => {
        expect(isSessionSoftFailUrl(p)).toBe(true);
      });
    });
  });

  describe('justLoggedIn TTL', () => {
    it('markJustLoggedIn 후 TTL 안이면 true, remove 하지 않음', () => {
      markJustLoggedIn();
      expect(isWithinJustLoggedInWindow()).toBe(true);
      expect(isWithinJustLoggedInWindow()).toBe(true);
      expect(sessionStorage.getItem(JUST_LOGGED_IN_KEY)).toBe('true');
      expect(sessionStorage.getItem(JUST_LOGGED_IN_AT_KEY)).toBeTruthy();
    });

    it('TTL 만료 시 false 이고 키 제거', () => {
      sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
      sessionStorage.setItem(
        JUST_LOGGED_IN_AT_KEY,
        String(Date.now() - JUST_LOGGED_IN_TTL_MS - 500)
      );
      expect(isWithinJustLoggedInWindow()).toBe(false);
      expect(sessionStorage.getItem(JUST_LOGGED_IN_KEY)).toBeNull();
      expect(sessionStorage.getItem(JUST_LOGGED_IN_AT_KEY)).toBeNull();
    });

    it('레거시 justLoggedIn only — 첫 체크 시 At 기록 후 창 유지', () => {
      sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
      sessionStorage.removeItem(JUST_LOGGED_IN_AT_KEY);
      expect(isWithinJustLoggedInWindow()).toBe(true);
      expect(sessionStorage.getItem(JUST_LOGGED_IN_AT_KEY)).toBeTruthy();
    });
  });
});
