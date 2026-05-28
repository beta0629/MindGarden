/**
 * DEFAULT_MENU_ITEMS 폴백 정합 테스트 (LNB IA 재배치 Phase 3 — 2026-05-28)
 *
 * SSOT: docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md §2.3
 *       docs/project-management/2026-05-28/ADMIN_LNB_IA_DESIGN_HANDOFF.md
 *
 * 검증 항목:
 *   - 1차 메뉴 수 = 9 (단독 3 + 그룹 6) — Q10 ≤ 8 가드는 ADM_REPORTS 비활성 제외 후 8개
 *   - 단독 vs 그룹 분기 (children 유무)
 *   - DUP-1 fix: 통합 스케줄 1차 단독 존재
 *   - DUP-2 fix: 알림·메시지 path = /admin/notifications
 *   - DUP-3 fix: 콘텐츠·커뮤니티 그룹 + 5 children
 *   - Q9 fix: 매칭·결제·환불 그룹 4 children (매칭/구독/결제수단/PG)
 *   - GNB 퀵 네비 spec 1:1 정합
 */

import { DEFAULT_MENU_ITEMS, buildAdminLnbFallbackQuickNavigateSpecs } from '../menuItems';

describe('DEFAULT_MENU_ITEMS (LNB IA 재배치)', () => {
  describe('1차 트리 구조', () => {
    it('1차 메뉴는 9개이다 (단독 3 + 그룹 6 — 시스템·설정 포함)', () => {
      expect(DEFAULT_MENU_ITEMS).toHaveLength(9);
    });

    it('첫 3개는 단독 메뉴 (대시보드 / 통합 스케줄 / 알림·메시지 그룹 헤더)', () => {
      expect(DEFAULT_MENU_ITEMS[0].label).toBe('대시보드');
      expect(DEFAULT_MENU_ITEMS[0].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[1].label).toBe('통합 스케줄');
      expect(DEFAULT_MENU_ITEMS[1].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[2].label).toBe('알림·메시지');
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
  });
});
