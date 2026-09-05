/**
 * DEFAULT_MENU_ITEMS 폴백 정합 테스트
 * LNB IA 재배치 + V20260905_001 센터 어드민 LNB P0/P1
 *
 * 검증 항목:
 *   - 1차 메뉴 수 = 11 (디러티 top-level 제거 + 상담·기록 추가)
 *   - P0 미포함: PG 승인(운영), 공통코드, 알림 테스트 발송
 *   - 계정·권한 / 사용자 목록 미포함
 *   - 상담·기록 / 매칭 children(디러티) / 알림·메시지에 메시지 발송
 *   - GNB id 「계정·권한」
 */

import { ADMIN_ROUTES } from '../../../../constants/adminRoutes';
import { DEFAULT_MENU_ITEMS, ERP_MENU_ITEMS, buildAdminLnbFallbackQuickNavigateSpecs } from '../menuItems';

describe('DEFAULT_MENU_ITEMS (LNB IA P0/P1)', () => {
  describe('1차 트리 구조', () => {
    it('1차 메뉴는 11개이다 (상담·기록 추가 · 디러티 top-level 제거)', () => {
      expect(DEFAULT_MENU_ITEMS).toHaveLength(11);
    });

    it('첫 항목은 대시보드 · 통합 스케줄 · 사용자 관리 · 상담·기록 · 알림·메시지 순이다', () => {
      expect(DEFAULT_MENU_ITEMS[0].label).toBe('대시보드');
      expect(DEFAULT_MENU_ITEMS[0].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[1].label).toBe('통합 스케줄');
      expect(DEFAULT_MENU_ITEMS[1].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[2].label).toBe('사용자 관리');
      expect(DEFAULT_MENU_ITEMS[2].children).toBeUndefined();
      expect(DEFAULT_MENU_ITEMS[2].to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
      expect(DEFAULT_MENU_ITEMS[3].label).toBe('상담·기록');
      expect(DEFAULT_MENU_ITEMS[3].menuCode).toBe('ADM_CONSULTATION_RECORDS');
      expect(DEFAULT_MENU_ITEMS[4].label).toBe('알림·메시지');
    });

    it('디러티 매칭 정리는 1차에 없다', () => {
      expect(DEFAULT_MENU_ITEMS.some((m) => m.label === '디러티 매칭 정리' && !m.children)).toBe(false);
    });
  });

  describe('P0 — hide', () => {
    it('PG 승인(운영)·공통코드·알림 테스트 발송이 폴백에 없다', () => {
      const allLabels = DEFAULT_MENU_ITEMS.flatMap((m) => [
        m.label,
        ...(m.children || []).map((c) => c.label)
      ]);
      expect(allLabels).not.toContain('PG 승인(운영)');
      expect(allLabels).not.toContain('공통코드');
      expect(allLabels).not.toContain('알림 테스트 발송');
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

  describe('사용자 관리 숏컷 · 계정·권한', () => {
    it('사용자 관리가 통합 스케줄 다음 1차 단독으로 존재하고 path 는 USER_MANAGEMENT', () => {
      const shortcut = DEFAULT_MENU_ITEMS.find((m) => m.label === '사용자 관리' && !m.children);
      expect(shortcut).toBeDefined();
      expect(shortcut.to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
      expect(shortcut.menuCode).toBe('ADM_USER_MANAGEMENT');
      const scheduleIdx = DEFAULT_MENU_ITEMS.findIndex((m) => m.label === '통합 스케줄');
      const shortcutIdx = DEFAULT_MENU_ITEMS.findIndex(
        (m) => m.label === '사용자 관리' && !m.children
      );
      const consultIdx = DEFAULT_MENU_ITEMS.findIndex((m) => m.label === '상담·기록');
      const notifyIdx = DEFAULT_MENU_ITEMS.findIndex((m) => m.label === '알림·메시지');
      expect(shortcutIdx).toBe(scheduleIdx + 1);
      expect(consultIdx).toBe(shortcutIdx + 1);
      expect(consultIdx).toBeLessThan(notifyIdx);
    });

    it('계정·권한 그룹은 유지되고 사용자 목록이 없으며 계좌·휴면만 둔다', () => {
      const group = DEFAULT_MENU_ITEMS.find((m) => m.label === '계정·권한');
      expect(group).toBeDefined();
      expect(group.to).toBe(ADMIN_ROUTES.USER_MANAGEMENT);
      expect(group.menuCode).toBe('ADM_USERS');
      const childLabels = group.children.map((c) => c.label);
      expect(childLabels).not.toContain('사용자 목록');
      expect(childLabels).toContain('계좌 관리');
      expect(childLabels).toContain('휴면 사용자');
      expect(DEFAULT_MENU_ITEMS.some((m) => m.label === '사용자/권한')).toBe(false);
    });
  });

  describe('상담·기록 · 알림·메시지', () => {
    it('상담·기록 그룹 하위에 상담일지가 있다', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '상담·기록');
      expect(item).toBeDefined();
      expect(item.to).toBe('/admin/consultation-logs');
      const log = item.children.find((c) => c.label === '상담일지');
      expect(log).toBeDefined();
      expect(log.to).toBe('/admin/consultation-logs');
    });

    it('알림·메시지가 path=/admin/notifications 이고 메시지 발송만 하위로 둔다', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '알림·메시지');
      expect(item).toBeDefined();
      expect(item.to).toBe('/admin/notifications');
      const childLabels = item.children.map((c) => c.label);
      expect(childLabels).toContain('메시지 발송');
      expect(childLabels).not.toContain('상담일지');
      const messageSend = item.children.find((c) => c.label === '메시지 발송');
      expect(messageSend.to).toBe(ADMIN_ROUTES.PUSH_MONITORING);
      expect(messageSend.to).toBe('/admin/push-monitoring');
    });
  });

  describe('DUP-3 fix — 콘텐츠·커뮤니티 그룹', () => {
    it('콘텐츠·커뮤니티 그룹이 1차로 존재하고 4개 하위를 가진다', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '콘텐츠·커뮤니티');
      expect(item).toBeDefined();
      expect(item.children).toHaveLength(4);
      const childLabels = item.children.map((c) => c.label);
      expect(childLabels).toContain('커뮤니티 검수큐');
      expect(childLabels).toContain('심리교육·힐링 마스터');
      expect(childLabels).toContain('마음 날씨 관측');
      expect(childLabels).toContain('마음 정원 관측');
      expect(childLabels).not.toContain('푸시 설정 모니터링');
      expect(childLabels).not.toContain('메시지 발송');
    });
  });

  describe('시스템·설정 — P0/P1 제외 항목', () => {
    it('시스템·설정 children에 메시지 발송·공통코드·알림 테스트가 없다', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '시스템·설정');
      expect(item).toBeDefined();
      const childLabels = item.children.map((c) => c.label);
      expect(childLabels).not.toContain('메시지 발송');
      expect(childLabels).not.toContain('공통코드');
      expect(childLabels).not.toContain('알림 테스트 발송');
      expect(childLabels).toContain('센터 코드');
    });
  });

  describe('매칭·결제·환불 — cleanup 하위 · PG 제외', () => {
    it('매칭·결제·환불 그룹이 매칭/구독/결제수단/디러티 4개 하위를 가진다', () => {
      const item = DEFAULT_MENU_ITEMS.find((m) => m.label === '매칭·결제·환불');
      expect(item).toBeDefined();
      expect(item.children).toHaveLength(4);
      const childLabels = item.children.map((c) => c.label);
      expect(childLabels).toContain('매칭 관리(환불·취소)');
      expect(childLabels).toContain('결제/구독 관리');
      expect(childLabels).toContain('결제 수단');
      expect(childLabels).toContain('디러티 매칭 정리');
      expect(childLabels).not.toContain('PG 승인(운영)');
      const cleanup = item.children.find((c) => c.label === '디러티 매칭 정리');
      expect(cleanup.to).toBe(ADMIN_ROUTES.MAPPINGS_PENDING_PAYMENT_CLEANUP);
    });
  });

  describe('운영·재무 ERP — /erp/financial LNB label', () => {
    it('DEFAULT_MENU_ITEMS 운영·재무 child label is 이번 달 돈 (matches page title)', () => {
      const erpGroup = DEFAULT_MENU_ITEMS.find((m) => m.label === '운영·재무');
      expect(erpGroup).toBeDefined();
      const financial = erpGroup.children.find((c) => c.to === '/erp/financial');
      expect(financial).toBeDefined();
      expect(financial.label).toBe('이번 달 돈');
    });

    it('ERP_MENU_ITEMS financial entry label is 이번 달 돈', () => {
      const financial = ERP_MENU_ITEMS.find((m) => m.to === '/erp/financial');
      expect(financial).toBeDefined();
      expect(financial.label).toBe('이번 달 돈');
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

    it('사용자 관리 숏컷과 계정·권한 그룹의 GNB id 가 구분된다', () => {
      const specs = buildAdminLnbFallbackQuickNavigateSpecs();
      const shortcut = specs.find((s) => s.label === '사용자 관리');
      const group = specs.find((s) => s.label === '계정·권한');
      expect(shortcut?.id).toBe('user-management');
      expect(group?.id).toBe('users-permissions');
      expect(shortcut?.to).toBe(group?.to);
    });

    it('상담·기록 GNB id 는 consultation-records 이다', () => {
      const specs = buildAdminLnbFallbackQuickNavigateSpecs();
      const records = specs.find((s) => s.label === '상담·기록');
      expect(records?.id).toBe('consultation-records');
    });
  });
});
