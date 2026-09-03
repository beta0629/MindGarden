/**
 * dashboardUtils 라우팅 단위 테스트.
 *
 * Product lock: ADMIN→/erp/dashboard, STAFF→/admin/dashboard, CONSULTANT→/consultant/dashboard
 *
 * @author MindGarden
 */

import {
  getLegacyDashboardPath,
  getDashboardComponentName,
  getDynamicDashboardPath,
  resolvePostLoginLandingPath
} from '../dashboardUtils';

describe('dashboardUtils — landing / role routing SSOT', () => {
  describe('getLegacyDashboardPath', () => {
    test('STAFF 는 /admin/dashboard 로 매핑된다 (CLIENT 폴백·erp 금지)', () => {
      expect(getLegacyDashboardPath('STAFF')).toBe('/admin/dashboard');
    });

    test('소문자 staff 도 동일하게 매핑된다', () => {
      expect(getLegacyDashboardPath('staff')).toBe('/admin/dashboard');
    });

    test('ADMIN 매핑은 /erp/dashboard', () => {
      expect(getLegacyDashboardPath('ADMIN')).toBe('/erp/dashboard');
    });

    test('CLIENT 매핑은 변경되지 않는다', () => {
      expect(getLegacyDashboardPath('CLIENT')).toBe('/client/dashboard');
    });

    test('CONSULTANT 매핑은 변경되지 않는다', () => {
      expect(getLegacyDashboardPath('CONSULTANT')).toBe('/consultant/dashboard');
    });

    test('미지정 역할은 /client/dashboard 폴백', () => {
      expect(getLegacyDashboardPath('UNKNOWN')).toBe('/client/dashboard');
    });
  });

  describe('resolvePostLoginLandingPath — dual-role landing matrix', () => {
    test('ADMIN → /erp/dashboard', () => {
      expect(resolvePostLoginLandingPath({ role: 'ADMIN' })).toBe('/erp/dashboard');
    });

    test('STAFF → /admin/dashboard (erp 아님)', () => {
      expect(resolvePostLoginLandingPath({ role: 'STAFF' })).toBe('/admin/dashboard');
    });

    test('CONSULTANT → /consultant/dashboard', () => {
      expect(resolvePostLoginLandingPath({ role: 'CONSULTANT' })).toBe('/consultant/dashboard');
    });

    test('ADMIN + counselingEnabled → /erp/dashboard (operator priority)', () => {
      expect(resolvePostLoginLandingPath({ role: 'ADMIN', counselingEnabled: true })).toBe('/erp/dashboard');
    });

    test('dual ADMIN flags → /erp/dashboard', () => {
      expect(resolvePostLoginLandingPath({
        role: 'ADMIN',
        hasOperatorRole: true,
        hasCounselorRole: true
      })).toBe('/erp/dashboard');
    });
  });

  describe('getDashboardComponentName', () => {
    test('STAFF dashboardType 은 AdminDashboard 컴포넌트로 매핑된다', () => {
      expect(getDashboardComponentName('STAFF')).toBe('AdminDashboard');
    });

    test('소문자 staff 도 동일 매핑', () => {
      expect(getDashboardComponentName('staff')).toBe('AdminDashboard');
    });

    test('ADMIN dashboardType 매핑은 변경되지 않는다', () => {
      expect(getDashboardComponentName('ADMIN')).toBe('AdminDashboard');
    });

    test('CLIENT dashboardType 매핑은 변경되지 않는다', () => {
      expect(getDashboardComponentName('CLIENT')).toBe('ClientDashboard');
    });
  });

  describe('getDynamicDashboardPath', () => {
    test('dashboardType STAFF 는 /admin/dashboard 경로 반환', () => {
      expect(getDynamicDashboardPath({ dashboardType: 'STAFF' })).toBe('/admin/dashboard');
    });

    test('dashboardType admin 도 /admin/dashboard 반환 (동적 타입 폴백; 랜딩 SSOT는 resolve)', () => {
      expect(getDynamicDashboardPath({ dashboardType: 'ADMIN' })).toBe('/admin/dashboard');
    });

    test('dashboard 가 null 이면 /dashboard 반환', () => {
      expect(getDynamicDashboardPath(null)).toBe('/dashboard');
    });
  });
});
