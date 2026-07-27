/**
 * DEFAULT_MENU_ITEMS 폴백 정합 테스트 (LNB IA 재배치 Phase 3 — 2026-05-28)
 * + 사용자 관리 1차 숏컷 (V20260727_001)
 *
 * SSOT: docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md §2.3
 *       docs/project-management/2026-05-28/ADMIN_LNB_IA_DESIGN_HANDOFF.md
 *
 * 검증 항목:
 *   - 1차 메뉴 수 = 11 (단독 숏컷 포함; 디러티 매칭·시스템·설정 포함)
 *   - 단독 vs 그룹 분기 (children 유무)
 *   - DUP-1 fix: 통합 스케줄 1차 단독 존재
 *   - 사용자 관리 숏컷: 통합 스케줄 다음, path=/admin/user-management, 「사용자/권한」 그룹 유지
 *   - DUP-2 fix: 알림·메시지 path = /admin/notifications
 *   - DUP-3 fix: 콘텐츠·커뮤니티 그룹 + 5 children
 *   - Q9 fix: 매칭·결제·환불 그룹 4 children (매칭/구독/결제수단/PG)
 *   - GNB 퀵 네비 spec 1:1 정합
 */

import { ADMIN_ROUTES } from '../../../../constants/adminRoutes';
import { DEFAULT_MENU_ITEMS, buildAdminLnbFallbackQuickNavigateSpecs } from '../menuItems';

describe('DEFAULT_MENU_ITEMS (LNB IA 재배치)', () => {
  describe('1차 트리 구조', () => {
    it('1차 메뉴는 11개이다 (사용자 관리 숏컷 + 디러티·시스템·설정 포함)', () => {
      expect(DEFAULT_MENU_ITEMS).toHaveLength(11);
    });

    it('첫 항목은 대시보드 · 통합 스케줄 · 사용자 관리 단독 순이다', () => {
      expect(DEFAULT_MENU_ITEMS[0].label).toBe('대시보드');
      expect(DEFAULT_MENU_ITEMS[0].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[1].label).toBe('통합 스케줄');
      expect(DEFAULT_MENU_ITEMS[1].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[2].label).toBe('사용자 관리');
      expect(DEFAULT_MENU_ITEMS[2].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[2].to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
      expect(DEFAULT_MENU_ITEMS[3].label).toBe('알림·메시지');
    });
  });

  describe('DUP-1 fix — 통합 스케줄 1차 단독', () => {
    it('통합 스케줄이 path=/admin/integrated-schedule 로 1차 단독에 존재', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '통합 스케줄');
      expect(item).toBeDefined();
      expect(item.to).toBe('/admin/integrated-schedule');
      expect(item.children).toBeUndefined();
    });
  });

  describe('사용자 관리 숏컷 (V20260727_001)', () => {
    it('사용자 관리가 통합 스케줄 다음 1차 단독으로 존재하고 path 는 USER_MANAGEMENT', () => {
      const shortcut = DEFAULT_MENU_ITEMS.find((m) => m.label === '사용자 관리' && !m.children);
      expect(shortcut).toBeDefined();
      expect(shortcut.to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
      expect(shortcut.menuCode).toBe('ADM_USER_MANAGEMENT');
      const scheduleIdx = DEFAULT_MENU_ITEMS.findIndex((m) => m.label === '통합 스케줄');
      const shortcutIdx = DEFAULT_MENU_ITEMS.findIndex(
        (m) => m.label === '사용자 관리' && !m.children
      );
      const notifyIdx = DEFAULT_MENU_ITEMS.findIndex((m) => m.label === '알림·메시지');
      expect(shortcutIdx).toBe(scheduleIdx + 1);
      expect(shortcutIdx).toBeLessThan(notifyIdx);
    });

    it('사용자/권한 그룹은 유지되고 동일 USER_MANAGEMENT path 를 공유한다', () => {
      const group = DEFAULT_MENU_ITEMS.find((m) => m.label === '사용자/권한');
      expect(group).toBeDefined();
      expect(group.children?.length).toBeGreaterThanOrEqual(1);
      expect(group.to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
      expect(group.menuCode).toBe('ADM_USERS');
      const list = group.children.find((c) => c.label === '사용자 목록');
      expect(list?.to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
    });
  });

  describe('DUP-2 fix — 알림 path 통일', () => {
    it('알림·메시지가 path=/admin/notifications 로 통일됨', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '알림·메시지');
      expect(item).toBeDefined();
      expect(item.to).toBe('/admin/notifications');
    });

    it('상담일지가 알림·메시지 그룹 하위로 들어감', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '알림·메시지');
      const log = item.children.find((c) => c.label === '상담일지');
      expect(log).toBeDefined();
      expect(log.to).toBe('/admin/consultation-logs');
    });
  });

  describe('DUP-3 fix — 콘텐츠·커뮤니티 그룹 신설', () => {
    it('콘텐츠·커뮤니티 그룹이 1차로 존재하고 5개 하위를 가진다', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '콘텐츠·커뮤니티');
      expect(item).toBeDefined();
      expect(item.children).toHaveLength(5);
      const childLabels = item.children.map((c) => c.label);
      expect(childLabels).toContain('커뮤니티 검수큐');
      expect(childLabels).toContain('심리교육·힐링 마스터');
      expect(childLabels).toContain('마음 날씨 관측');
      expect(childLabels).toContain('마음 정원 관측');
      expect(childLabels).toContain('푸시 설정 모니터링');
    });
  });

  describe('Q9 fix — 매칭·결제·환불 그룹 (ADM_MAPPING / ADM_BILLING 강등)', () => {
    it('매칭·결제·환불 그룹이 매칭/구독/결제수단/PG 4개 하위를 가진다', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '매칭·결제·환불');
      expect(item).toBeDefined();
      expect(item.children).toHaveLength(4);
      const childLabels = item.children.map((c) => c.label);
      expect(childLabels).toContain('매칭 관리(환불·취소)');
      expect(childLabels).toContain('결제/구독 관리');
      expect(childLabels).toContain('결제 수단');
      expect(childLabels).toContain('PG 승인(운영)');
    });
  });

  describe('GNB 퀵 네비 spec 정합', () => {
    it('buildAdminLnbFallbackQuickNavigateSpecs 가 1차 메뉴와 1:1 매칭된다', () => {
      const specs = buildAdminLnbFallbackQuickNavigateSpecs();
      expect(specs).toHaveLength(DEFAULT_MENU_ITEMS.length);
    });

    it('시스템·설정 1차는 SYSTEM_CONFIG 라우트로 대체된다', () => {
      const specs = buildAdminLnbFallbackQuickNavigateSpecs();
      const systemConfig = specs.find((s) => s.id === 'system-config');
      expect(systemConfig).toBeDefined();
      expect(systemConfig.to).toBe('/admin/system-config');
    });

    it('사용자 관리 숏컷과 사용자/권한 그룹의 GNB id 가 구분된다', () => {
      const specs = buildAdminLnbFallbackQuickNavigateSpecs();
      const shortcut = specs.find((s) => s.label === '사용자 관리');
      const group = specs.find((s) => s.label === '사용자/권한');
      expect(shortcut?.id).toBe('user-management');
      expect(group?.id).toBe('users-permissions');
      expect(shortcut?.to).toBe(group?.to);
    });
  });
});
