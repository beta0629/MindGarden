/**
 * dashboardUtils 라우팅 단위 테스트.
 *
 * STAFF_PERMISSION_POLICY_PHASE2 (2026-06): STAFF는 ERP만 제외하고 ADMIN과
 * 동일한 대시보드 경로/컴포넌트로 매핑되어야 한다는 정책을 검증한다.
 *
 * @author MindGarden
 */

import {
  getLegacyDashboardPath,
  getDashboardComponentName,
  getDynamicDashboardPath
} from '../dashboardUtils';

describe('dashboardUtils — STAFF 라우팅 정책 (Phase 2)', () => {
  describe('getLegacyDashboardPath', () => {
    test('STAFF 는 /admin/dashboard 로 매핑된다 (CLIENT 폴백 금지)', () => {
      expect(getLegacyDashboardPath('STAFF')).toBe('/admin/dashboard');
    });

    test('소문자 staff 도 동일하게 매핑된다', () => {
      expect(getLegacyDashboardPath('staff')).toBe('/admin/dashboard');
    });

    test('ADMIN 매핑은 변경되지 않는다', () => {
      expect(getLegacyDashboardPath('ADMIN')).toBe('/admin/dashboard');
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

    test('dashboardType admin 도 /admin/dashboard 반환 (회귀 보호)', () => {
      expect(getDynamicDashboardPath({ dashboardType: 'ADMIN' })).toBe('/admin/dashboard');
    });

    test('dashboard 가 null 이면 /dashboard 반환', () => {
      expect(getDynamicDashboardPath(null)).toBe('/dashboard');
    });
  });
});
