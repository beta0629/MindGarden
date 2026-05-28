/**
 * Dashboard V2 - 기본 LNB 메뉴 아이템 및 권한별 메뉴
 * @author CoreSolution
 * @since 2025-02-22
 */

import { ADMIN_ROUTES } from '../../../constants/adminRoutes';

const BREAKPOINT_DESKTOP = 768;

/**
 * 어드민 LNB 폴백: API(/api/v1/menus/lnb) 실패 시에만 사용 (평상시는 DB 메뉴 사용)
 *
 * IA SSOT: docs/project-management/2026-05-28/ADMIN_LNB_IA_RESTRUCTURE_PLAN.md
 *          docs/project-management/2026-05-28/ADMIN_LNB_IA_DESIGN_HANDOFF.md (53f2d5a6e)
 *
 * 1차 8개 (단독 3 + 그룹 5 — Q10 가드라인 ≤8):
 *   1. 대시보드          (단독, sort=10)
 *   2. 통합 스케줄        (단독, sort=15) — DUP-1 fix
 *   3. 알림·메시지        (단독, sort=20) — DUP-2 fix (path=/admin/notifications)
 *   4. 매칭·결제·환불     (그룹, sort=25) — Q9 권고 (매칭/결제 강등)
 *   5. 사용자 관리        (그룹, sort=30)
 *   6. 콘텐츠·커뮤니티     (그룹, sort=35) — DUP-3 신설
 *   7. 쇼핑·리워드        (그룹, sort=40)
 *   8. 운영·재무 (ERP)    (그룹, sort=45)
 *   9. 시스템·설정        (그룹, sort=50)
 *
 * Flyway 마이그 V20260606_008__lnb_ia_restructure.sql 와 1:1 정합 (DB 시드 SSOT 우선).
 */
const DEFAULT_MENU_ITEMS = [
  { to: ADMIN_ROUTES.DASHBOARD, icon: 'LAYOUT_DASHBOARD', label: '대시보드', end: true },
  { to: ADMIN_ROUTES.INTEGRATED_SCHEDULE, icon: 'CALENDAR_DAYS', label: '통합 스케줄', end: true },
  {
    to: ADMIN_ROUTES.NOTIFICATIONS,
    icon: 'BELL',
    label: '알림·메시지',
    end: false,
    children: [
      { to: ADMIN_ROUTES.CONSULTATION_LOGS, icon: 'FILE_TEXT', label: '상담일지', end: true }
    ]
  },
  {
    to: ADMIN_ROUTES.MAPPING_MANAGEMENT,
    icon: 'CREDIT_CARD',
    label: '매칭·결제·환불',
    end: false,
    children: [
      { to: ADMIN_ROUTES.MAPPING_MANAGEMENT, icon: 'LINK', label: '매칭 관리(환불·취소)', end: true },
      { to: ADMIN_ROUTES.BILLING_SUBSCRIPTIONS, icon: 'RECEIPT', label: '결제/구독 관리', end: true },
      { to: ADMIN_ROUTES.BILLING_PAYMENT_METHODS, icon: 'CREDIT_CARD', label: '결제 수단', end: true },
      { to: ADMIN_ROUTES.PG_OPS_APPROVAL, icon: 'SHIELD_CHECK', label: 'PG 승인(운영)', end: true }
    ]
  },
  {
    to: ADMIN_ROUTES.USER_MANAGEMENT,
    icon: 'USERS',
    label: '사용자 관리',
    end: false,
    children: [
      { to: ADMIN_ROUTES.USER_MANAGEMENT, icon: 'USER', label: '사용자 목록', end: true },
      { to: '/admin/accounts', icon: 'BOOK_USER', label: '계좌 관리', end: true }
    ]
  },
  {
    to: ADMIN_ROUTES.COMMUNITY_MODERATION,
    icon: 'LAYERS',
    label: '콘텐츠·커뮤니티',
    end: false,
    children: [
      { to: ADMIN_ROUTES.COMMUNITY_MODERATION, icon: 'INBOX', label: '커뮤니티 검수큐', end: true },
      { to: ADMIN_ROUTES.CONTENT_MASTER, icon: 'BOOK_OPEN', label: '심리교육·힐링 마스터', end: true },
      { to: ADMIN_ROUTES.MIND_WEATHER_OBSERVABILITY, icon: 'CLOUD_SUN', label: '마음 날씨 관측', end: true },
      { to: ADMIN_ROUTES.MIND_GARDEN_OBSERVABILITY, icon: 'FLOWER_2', label: '마음 정원 관측', end: true },
      { to: ADMIN_ROUTES.PUSH_MONITORING, icon: 'SEND', label: '푸시 설정 모니터링', end: true }
    ]
  },
  {
    to: ADMIN_ROUTES.SHOP_CATALOG_SKUS,
    icon: 'SHOPPING_BAG',
    label: '쇼핑·리워드',
    end: false,
    children: [
      { to: ADMIN_ROUTES.SHOP_CATALOG_SKUS, icon: 'PACKAGE', label: '상품(SKU) 관리', end: true },
      { to: ADMIN_ROUTES.SHOP_POINT_POLICIES, icon: 'GIFT', label: '리워드 정책', end: true },
      { to: ADMIN_ROUTES.SHOP_ORDERS, icon: 'RECEIPT', label: '온라인 주문', end: true }
    ]
  },
  {
    to: '/erp/dashboard',
    icon: 'BRIEFCASE',
    label: '운영·재무',
    end: false,
    children: [
      { to: '/erp/dashboard', icon: 'LINE_CHART', label: '운영 현황', end: true },
      { to: '/erp/purchase', icon: 'SHOPPING_CART', label: '조달·품목', end: true },
      { to: '/erp/financial', icon: 'CALCULATOR', label: '거래·정산', end: true },
      { to: '/erp/budget', icon: 'PIE_CHART', label: '예산 관리', end: true },
      { to: '/erp/salary', icon: 'BANKNOTE', label: '급여 관리', end: true },
      { to: '/erp/approvals', icon: 'CHECK_SQUARE', label: '승인 센터', end: true }
    ]
  },
  {
    to: '/tenant/profile',
    icon: 'SETTINGS',
    label: '시스템·설정',
    end: false,
    children: [
      { to: '/tenant/profile', icon: 'BUILDING', label: '테넌트 프로필', end: true },
      { to: ADMIN_ROUTES.BRANDING, icon: 'PALETTE', label: '브랜딩', end: true },
      { to: '/admin/system-config', icon: 'SLIDERS', label: '시스템 설정', end: true },
      { to: ADMIN_ROUTES.COMMON_CODES, icon: 'CODE', label: '공통코드', end: true },
      { to: ADMIN_ROUTES.TENANT_COMMON_CODES, icon: 'TAG', label: '테넌트 공통코드', end: true },
      { to: '/tenant/pg-configurations', icon: 'CREDIT_CARD', label: 'PG 설정', end: true },
      { to: ADMIN_ROUTES.AI_PROVIDERS, icon: 'BOT', label: 'AI 프로바이더', end: true },
      { to: ADMIN_ROUTES.PACKAGE_PRICING, icon: 'TAGS', label: '패키지 요금 관리', end: true },
      { to: ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS, icon: 'MESSAGE_SQUARE', label: '카카오 알림톡', end: true },
      { to: ADMIN_ROUTES.TENANT_SMS_SETTINGS, icon: 'MESSAGE_SQUARE', label: '문자 메시지(SMS)', end: true },
      { to: ADMIN_ROUTES.TEST_NOTIFICATION, icon: 'BELL', label: '알림 테스트 발송', end: true },
      { to: ADMIN_ROUTES.MANUAL_NOTIFICATION, icon: 'MEGAPHONE', label: '수동 알림 발송', end: true },
      { to: ADMIN_ROUTES.SMS_TEMPLATES, icon: 'FILE_TEXT', label: 'SMS 템플릿 관리', end: true },
      { to: '/admin/compliance', icon: 'FILE_WARNING', label: '컴플라이언스', end: true }
    ]
  }
];

const ADMIN_LNB_QUICK_NAV_ID_BY_TO = new Map([
  [ADMIN_ROUTES.DASHBOARD, 'dashboard'],
  [ADMIN_ROUTES.INTEGRATED_SCHEDULE, 'integrated-schedule'],
  [ADMIN_ROUTES.CONSULTATION_LOGS, 'consultation-logs'],
  [ADMIN_ROUTES.NOTIFICATIONS, 'notifications'],
  [ADMIN_ROUTES.MAPPING_MANAGEMENT, 'matching-payment-refund'],
  [ADMIN_ROUTES.USER_MANAGEMENT, 'user-management'],
  [ADMIN_ROUTES.COMMUNITY_MODERATION, 'content-community'],
  [ADMIN_ROUTES.SHOP_CATALOG_SKUS, 'shop-reward'],
  ['/erp/dashboard', 'erp-dashboard']
]);

/**
 * GNB 퀵 액션용: {@link DEFAULT_MENU_ITEMS} 1차 메뉴와 동일한 순서·라벨·경로.
 * 시스템·설정 그룹은 LNB와 동일하게 시스템 설정( {@link ADMIN_ROUTES.SYSTEM_CONFIG} ) 1건으로 대체.
 *
 * @returns {Array<{ id: string, to: string, icon: string, label: string }>}
 * @author CoreSolution
 * @since 2026-04-05 (IA 재배치: 2026-05-28)
 */
export function buildAdminLnbFallbackQuickNavigateSpecs() {
  return DEFAULT_MENU_ITEMS.map((item) => {
    if (item.label === '시스템·설정' && item.to === '/tenant/profile') {
      return {
        id: 'system-config',
        to: ADMIN_ROUTES.SYSTEM_CONFIG,
        icon: 'SETTINGS',
        label: '시스템 설정'
      };
    }
    const fallbackId = `nav-${item.to.split('/').filter(Boolean).join('-')}`;
    const id = ADMIN_LNB_QUICK_NAV_ID_BY_TO.get(item.to) ?? fallbackId;
    return {
      id,
      to: item.to,
      icon: item.icon,
      label: item.label
    };
  });
}

const CLIENT_MENU_ITEMS = [
  { to: '/client/dashboard', icon: 'LAYOUT_DASHBOARD', label: '대시보드', end: true },
  { to: '/client/schedule', icon: 'CALENDAR', label: '스케줄', end: true },
  { to: '/client/session-management', icon: 'FILE_TEXT', label: '회기 관리', end: true },
  { to: '/client/payment-history', icon: 'CREDIT_CARD', label: '결제 내역', end: true },
  { to: '/client/settings', icon: 'SETTINGS', label: '설정', end: true }
];

const CONSULTANT_MENU_ITEMS = [
  { to: '/consultant/dashboard', icon: 'LAYOUT_DASHBOARD', label: '대시보드', end: true },
  {
    to: '/consultant/schedule',
    icon: 'CALENDAR',
    label: '일정 관리',
    end: false,
    children: [
      { to: '/consultant/schedule', icon: 'CALENDAR', label: '전체 스케줄', end: true },
      { to: '/consultant/availability', icon: 'CALENDAR_DAYS', label: '가능 시간 설정', end: true }
    ]
  },
  {
    to: '/consultant/clients',
    icon: 'USERS',
    label: '내담자 조회',
    end: false,
    children: [
      { to: '/consultant/clients', icon: 'USERS', label: '내 내담자 목록', end: true },
      { to: '/consultant/messages', icon: 'MESSAGE_CIRCLE', label: '상담사 메시지', end: true }
    ]
  },
  {
    to: '/consultant/consultation-records',
    icon: 'FILE_TEXT',
    label: '상담 기록',
    end: false,
    children: [
      { to: '/consultant/consultation-records', icon: 'FILE_TEXT', label: '상담 일지 관리', end: true },
      { to: '/consultant/consultation-logs', icon: 'FILE_TEXT', label: '상담 리포트/로그', end: true }
    ]
  },
  {
    to: '/consultant/salary-settlement',
    icon: 'DOLLAR_SIGN',
    label: '급여 정산',
    end: true
  }
];

const ERP_MENU_ITEMS = [
  { to: '/erp/dashboard', icon: 'LAYOUT_DASHBOARD', label: '운영 현황', end: true },
  { to: '/erp/purchase', icon: 'SHOPPING_CART', label: '조달·품목', end: true },
  { to: '/erp/financial', icon: 'DOLLAR_SIGN', label: '거래·정산', end: true },
  { to: '/erp/budget', icon: 'PIE_CHART', label: '예산 관리', end: true },
  { to: '/erp/salary', icon: 'DOLLAR_SIGN', label: '급여 관리', end: true },
  { to: '/erp/approvals', icon: 'CLIPBOARD_LIST', label: '승인 센터', end: true }
];

export {
  BREAKPOINT_DESKTOP,
  DEFAULT_MENU_ITEMS,
  CLIENT_MENU_ITEMS,
  CONSULTANT_MENU_ITEMS,
  ERP_MENU_ITEMS
};
