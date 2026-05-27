/**
 * Dashboard V2 - 기본 LNB 메뉴 아이템 및 권한별 메뉴
 * @author CoreSolution
 * @since 2025-02-22
 */

import { ADMIN_ROUTES } from '../../../constants/adminRoutes';

const BREAKPOINT_DESKTOP = 768;

/** 어드민 LNB 폴백: API(/api/v1/menus/lnb) 실패 시에만 사용 (평상시는 DB 메뉴 사용) */
const DEFAULT_MENU_ITEMS = [
  { to: ADMIN_ROUTES.DASHBOARD, icon: 'LAYOUT_DASHBOARD', label: '대시보드', end: true },
  { to: ADMIN_ROUTES.INTEGRATED_SCHEDULE, icon: 'CALENDAR', label: '통합 스케줄 센터', end: true },
  { to: ADMIN_ROUTES.CONSULTATION_LOGS, icon: 'CALENDAR_DAYS', label: '상담일지 조회', end: true },
  {
    to: ADMIN_ROUTES.COMMUNITY_MODERATION,
    icon: 'FLAG',
    label: '콘텐츠·커뮤니티',
    end: false,
    children: [
      { to: ADMIN_ROUTES.COMMUNITY_MODERATION, icon: 'FLAG', label: '커뮤니티 검수 큐', end: true },
      { to: ADMIN_ROUTES.CONTENT_MASTER, icon: 'FILE_TEXT', label: '심리교육·힐링 마스터', end: true },
      { to: ADMIN_ROUTES.MIND_WEATHER_OBSERVABILITY, icon: 'CLOUD_SUN', label: '마음 날씨 관측', end: true },
      { to: ADMIN_ROUTES.MIND_GARDEN_OBSERVABILITY, icon: 'HEART', label: '마음 정원 관측', end: true },
      { to: ADMIN_ROUTES.PUSH_MONITORING, icon: 'BELL', label: '푸시 설정 모니터링', end: true }
    ]
  },
  { to: ADMIN_ROUTES.NOTIFICATIONS, icon: 'MESSAGE_CIRCLE', label: '알림·메시지 관리', end: true },
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
    to: '/admin/user-management',
    icon: 'USERS',
    label: '사용자/권한',
    end: false,
    children: [
      { to: '/admin/user-management', icon: 'USERS', label: '사용자 관리', end: true },
      { to: '/admin/accounts', icon: 'CREDIT_CARD', label: '계좌 관리', end: true }
    ]
  },
  {
    to: ADMIN_ROUTES.BILLING_SUBSCRIPTIONS,
    icon: 'CREDIT_CARD',
    label: '결제/구독',
    end: false,
    children: [
      { to: ADMIN_ROUTES.BILLING_SUBSCRIPTIONS, icon: 'RECEIPT', label: '구독 관리', end: true },
      { to: ADMIN_ROUTES.BILLING_PAYMENT_METHODS, icon: 'CREDIT_CARD', label: '결제 수단', end: true }
    ]
  },
  {
    to: '/erp/dashboard',
    icon: 'LAYOUT_DASHBOARD',
    label: '운영·재무',
    end: false,
    children: [
      { to: '/erp/dashboard', icon: 'LAYOUT_DASHBOARD', label: '운영 현황', end: true },
      { to: '/erp/purchase', icon: 'SHOPPING_CART', label: '조달·품목', end: true },
      { to: '/erp/financial', icon: 'DOLLAR_SIGN', label: '거래·정산', end: true },
      { to: '/erp/budget', icon: 'PIE_CHART', label: '예산 관리', end: true },
      { to: '/erp/salary', icon: 'DOLLAR_SIGN', label: '급여 관리', end: true },
      { to: '/erp/approvals', icon: 'CLIPBOARD_LIST', label: '승인 센터', end: true }
    ]
  },
  {
    to: '/tenant/profile',
    icon: 'SETTINGS',
    label: '설정',
    end: false,
    children: [
      { to: '/tenant/profile', icon: 'SETTINGS', label: '테넌트 프로필', end: true },
      { to: ADMIN_ROUTES.BRANDING, icon: 'IMAGE', label: '브랜딩', end: true },
      { to: '/admin/system-config', icon: 'SETTINGS', label: '시스템 설정', end: true },
      { to: ADMIN_ROUTES.AI_PROVIDERS, icon: 'CPU', label: 'AI 프로바이더 관리', end: true },
      { to: ADMIN_ROUTES.COMMON_CODES, icon: 'FILE_TEXT', label: '공통코드', end: true },
      { to: ADMIN_ROUTES.TENANT_COMMON_CODES, icon: 'TAG', label: '테넌트 공통코드', end: true },
      { to: ADMIN_ROUTES.PACKAGE_PRICING, icon: 'PACKAGE', label: '패키지 요금 관리', end: true },
      { to: '/tenant/pg-configurations', icon: 'CREDIT_CARD', label: 'PG 설정', end: true },
      { to: ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS, icon: 'MESSAGE_CIRCLE', label: '카카오 알림톡', end: true },
      { to: ADMIN_ROUTES.TENANT_SMS_SETTINGS, icon: 'MESSAGE_SQUARE', label: '문자 메시지(SMS)', end: true },
      { to: ADMIN_ROUTES.TEST_NOTIFICATION, icon: 'BELL', label: '알림 테스트 발송', end: true },
      { to: ADMIN_ROUTES.MANUAL_NOTIFICATION, icon: 'MEGAPHONE', label: '수동 알림 발송', end: true },
      { to: ADMIN_ROUTES.SMS_TEMPLATES, icon: 'FILE_TEXT', label: 'SMS 템플릿 관리', end: true },
      { to: ADMIN_ROUTES.PG_OPS_APPROVAL, icon: 'SHIELD_CHECK', label: 'PG 승인(운영)', end: true },
      { to: '/admin/compliance', icon: 'FILE_TEXT', label: '컴플라이언스', end: true }
    ]
  }
];

const ADMIN_LNB_QUICK_NAV_ID_BY_TO = new Map([
  [ADMIN_ROUTES.DASHBOARD, 'dashboard'],
  [ADMIN_ROUTES.INTEGRATED_SCHEDULE, 'integrated-schedule'],
  [ADMIN_ROUTES.CONSULTATION_LOGS, 'consultation-logs'],
  [ADMIN_ROUTES.NOTIFICATIONS, 'notifications'],
  [ADMIN_ROUTES.USER_MANAGEMENT, 'user-management'],
  ['/erp/dashboard', 'erp-dashboard']
]);

/**
 * GNB 퀵 액션용: {@link DEFAULT_MENU_ITEMS} 1차 메뉴와 동일한 순서·라벨·경로.
 * 설정 그룹은 LNB와 동일하게 시스템 설정( {@link ADMIN_ROUTES.SYSTEM_CONFIG} ) 1건으로 대체.
 *
 * @returns {Array<{ id: string, to: string, icon: string, label: string }>}
 * @author CoreSolution
 * @since 2026-04-05
 */
export function buildAdminLnbFallbackQuickNavigateSpecs() {
  return DEFAULT_MENU_ITEMS.map((item) => {
    if (item.label === '설정' && item.to === '/tenant/profile') {
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
