/**
 * sessionAuthPolicy — soft-fail URL · justLoggedIn / justRefreshed TTL · auth grace
 */
import {
  JUST_LOGGED_IN_AT_KEY,
  JUST_LOGGED_IN_KEY,
  JUST_LOGGED_IN_TTL_MS,
  JUST_REFRESHED_AT_KEY,
  JUST_REFRESHED_KEY,
  JUST_REFRESHED_TTL_MS,
  SESSION_SOFT_FAIL_URL_PATHS
} from '../../constants/session';
import {
  clearJustLoggedIn,
  clearJustRefreshed,
  isSessionSoftFailUrl,
  isWithinAuthGraceWindow,
  isWithinJustLoggedInWindow,
  isWithinJustRefreshedWindow,
  markJustLoggedIn,
  markJustRefreshed
} from '../sessionAuthPolicy';
import { resetSessionSecurityFlagsCacheForTests } from '../sessionSecurityFlags';

describe('sessionAuthPolicy', () => {
  beforeEach(() => {
    clearJustLoggedIn();
    clearJustRefreshed();
    resetSessionSecurityFlagsCacheForTests();
  });

  afterEach(() => {
    clearJustLoggedIn();
    clearJustRefreshed();
    resetSessionSecurityFlagsCacheForTests();
  });

  describe('isSessionSoftFailUrl', () => {
    it('allowlist path 매칭 (query 무시)', () => {
      expect(isSessionSoftFailUrl('/api/v1/admin/branding')).toBe(true);
      expect(isSessionSoftFailUrl('/api/admin/branding')).toBe(true);
      expect(isSessionSoftFailUrl('https://t.example/api/v1/menus/lnb?x=1')).toBe(true);
      expect(isSessionSoftFailUrl('/api/v1/common-codes?codeGroup=X')).toBe(true);
      expect(isSessionSoftFailUrl('/api/v1/consultation-messages/unread-count')).toBe(true);
      expect(isSessionSoftFailUrl('/api/v1/notifications/unread-count?x=1')).toBe(true);
      expect(isSessionSoftFailUrl('/api/v1/admin/consultants')).toBe(false);
    });

    it('회기·샵·current-user 경로는 soft-fail 아님', () => {
      expect(isSessionSoftFailUrl('/api/v1/admin/mappings/client')).toBe(false);
      expect(isSessionSoftFailUrl('/api/v1/tenant/components/active-codes')).toBe(false);
      expect(isSessionSoftFailUrl('/api/v1/auth/current-user')).toBe(false);
    });

    it('soft-fail 스위치 off 이면 allowlist 도 false', () => {
      resetSessionSecurityFlagsCacheForTests({ softFailEnabled: false });
      expect(isSessionSoftFailUrl('/api/v1/menus/lnb')).toBe(false);
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

  describe('justRefreshed TTL', () => {
    it('markJustRefreshed 후 TTL 안이면 true', () => {
      markJustRefreshed();
      expect(isWithinJustRefreshedWindow()).toBe(true);
      expect(sessionStorage.getItem(JUST_REFRESHED_KEY)).toBe('true');
      expect(sessionStorage.getItem(JUST_REFRESHED_AT_KEY)).toBeTruthy();
    });

    it('TTL 만료 시 false 이고 키 제거', () => {
      sessionStorage.setItem(JUST_REFRESHED_KEY, 'true');
      sessionStorage.setItem(
        JUST_REFRESHED_AT_KEY,
        String(Date.now() - JUST_REFRESHED_TTL_MS - 500)
      );
      expect(isWithinJustRefreshedWindow()).toBe(false);
      expect(sessionStorage.getItem(JUST_REFRESHED_KEY)).toBeNull();
    });
  });

  describe('isWithinAuthGraceWindow', () => {
    it('justLoggedIn 또는 justRefreshed 이면 true', () => {
      expect(isWithinAuthGraceWindow()).toBe(false);
      markJustLoggedIn();
      expect(isWithinAuthGraceWindow()).toBe(true);
      clearJustLoggedIn();
      markJustRefreshed();
      expect(isWithinAuthGraceWindow()).toBe(true);
    });
  });
});
