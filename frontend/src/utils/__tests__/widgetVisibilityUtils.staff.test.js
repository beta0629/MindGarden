/**
 * widgetVisibilityUtils — STAFF 권한 정책 단위 테스트.
 *
 * STAFF_PERMISSION_POLICY_PHASE2 (2026-06): STAFF 는 ERP 위젯만 차단,
 * 그 외 위젯(공통/관리자/특화)은 ADMIN 과 동일하게 노출되어야 한다.
 *
 * @author MindGarden
 */

import { isWidgetVisible, validateWidgetAccess } from '../widgetVisibilityUtils';

describe('widgetVisibilityUtils — STAFF 정책 (Phase 2)', () => {
  describe('isWidgetVisible', () => {
    test('STAFF 는 공통 위젯(welcome) 접근 허용 (업종 정보 없이도)', () => {
      expect(isWidgetVisible('welcome', null, 'STAFF')).toBe(true);
    });

    test('STAFF 는 관리자 위젯(system-overview) 접근 허용', () => {
      expect(isWidgetVisible('system-overview', null, 'STAFF')).toBe(true);
    });

    test('STAFF 는 ERP 위젯(erp-stats-grid) 접근 거부', () => {
      expect(isWidgetVisible('erp-stats-grid', null, 'STAFF')).toBe(false);
    });

    test('STAFF 는 ERP 위젯(erp-management-grid) 접근 거부', () => {
      expect(isWidgetVisible('erp-management-grid', null, 'STAFF')).toBe(false);
    });

    test('ADMIN 은 ERP 위젯도 접근 허용 (회귀 보호)', () => {
      expect(isWidgetVisible('erp-stats-grid', null, 'ADMIN')).toBe(true);
    });
  });

  describe('validateWidgetAccess', () => {
    test('STAFF + ERP 위젯 → allowed=false', () => {
      const result = validateWidgetAccess('erp-stats-grid', 'CONSULTATION', 'STAFF');
      expect(result.allowed).toBe(false);
      expect(result.category).toBe('erp');
    });

    test('ADMIN + ERP 위젯 → allowed=true (회귀 보호)', () => {
      const result = validateWidgetAccess('erp-stats-grid', 'CONSULTATION', 'ADMIN');
      expect(result.allowed).toBe(true);
      expect(result.category).toBe('erp');
    });

    test('STAFF + 관리자 위젯(system-overview) → allowed=true', () => {
      const result = validateWidgetAccess('system-overview', 'CONSULTATION', 'STAFF');
      expect(result.allowed).toBe(true);
    });

    test('STAFF + 공통 위젯(welcome) → allowed=true', () => {
      const result = validateWidgetAccess('welcome', null, 'STAFF');
      expect(result.allowed).toBe(true);
      expect(result.category).toBe('common');
    });
  });
});
