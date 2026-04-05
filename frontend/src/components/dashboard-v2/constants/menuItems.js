/**
 * Dashboard V2 - 기본 LNB 메뉴 아이템 및 권한별 메뉴
 * @author CoreSolution
 * @since 2025-02-22
 */

import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Calendar,
  CalendarDays,
  MessageCircle,
  CreditCard,
  ShoppingCart,
  DollarSign,
  PieChart,
  Receipt,
  Package
} from 'lucide-react';
import { ADMIN_ROUTES } from '../../../constants/adminRoutes';

const BREAKPOINT_DESKTOP = 768;

/** 어드민 LNB 폴백: API(/api/v1/menus/lnb) 실패 시에만 사용 (평상시는 DB 메뉴 사용) */
const DEFAULT_MENU_ITEMS = [
  { to: ADMIN_ROUTES.DASHBOARD, icon: LayoutDashboard, label: '대시보드', end: true },
  { to: ADMIN_ROUTES.INTEGRATED_SCHEDULE, icon: Calendar, label: '통합 스케줄 센터', end: true },
  { to: ADMIN_ROUTES.CONSULTATION_LOGS, icon: CalendarDays, label: '상담일지 조회', end: true },
  { to: ADMIN_ROUTES.NOTIFICATIONS, icon: MessageCircle, label: '알림·메시지 관리', end: true },
  {
    to: '/admin/user-management',
    icon: Users,
    label: '사용자/권한',
    end: false,
    children: [
      { to: '/admin/user-management', icon: Users, label: '사용자 관리', end: true },
      { to: '/admin/accounts', icon: CreditCard, label: '계좌 관리', end: true }
    ]
  },
  {
    to: '/erp/dashboard',
    icon: LayoutDashboard,
    label: '운영·재무',
    end: false,
    children: [
      { to: '/erp/dashboard', icon: LayoutDashboard, label: '운영 현황', end: true },
      { to: '/erp/purchase', icon: ShoppingCart, label: '구매 관리', end: true },
      { to: '/erp/financial', icon: DollarSign, label: '수입·지출', end: true },
      { to: '/erp/budget', icon: PieChart, label: '예산 관리', end: true },
      { to: '/erp/salary', icon: DollarSign, label: '급여 관리', end: true },
      { to: '/erp/tax', icon: Receipt, label: '세무 관리', end: true }
    ]
  },
  {
    to: '/tenant/profile',
    icon: Settings,
    label: '설정',
    end: false,
    children: [
      { to: '/tenant/profile', icon: Settings, label: '테넌트 프로필', end: true },
      { to: '/admin/system-config', icon: Settings, label: '시스템 설정', end: true },
      { to: '/admin/common-codes', icon: FileText, label: '공통코드', end: true },
      { to: ADMIN_ROUTES.PACKAGE_PRICING, icon: Package, label: '패키지 요금 관리', end: true },
      { to: '/tenant/pg-configurations', icon: CreditCard, label: 'PG 설정', end: true },
      { to: '/admin/compliance', icon: FileText, label: '컴플라이언스', end: true }
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
 * @returns {Array<{ id: string, to: string, icon: import('lucide-react').LucideIcon, label: string }>}
 * @author CoreSolution
 * @since 2026-04-05
 */
export function buildAdminLnbFallbackQuickNavigateSpecs() {
  return DEFAULT_MENU_ITEMS.map((item) => {
    if (item.label === '설정' && item.to === '/tenant/profile') {
      return {
        id: 'system-config',
        to: ADMIN_ROUTES.SYSTEM_CONFIG,
        icon: Settings,
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
  { to: '/client/dashboard', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/client/schedule', icon: Calendar, label: '스케줄', end: true },
  { to: '/client/session-management', icon: FileText, label: '회기 관리', end: true },
  { to: '/client/payment-history', icon: CreditCard, label: '결제 내역', end: true },
  { to: '/client/settings', icon: Settings, label: '설정', end: true }
];

const CONSULTANT_MENU_ITEMS = [
  { to: '/consultant/dashboard', icon: LayoutDashboard, label: '대시보드', end: true },
  {
    to: '/consultant/schedule',
    icon: Calendar,
    label: '일정 관리',
    end: false,
    children: [
      { to: '/consultant/schedule', icon: Calendar, label: '전체 스케줄', end: true },
      { to: '/consultant/availability', icon: CalendarDays, label: '가능 시간 설정', end: true }
    ]
  },
  {
    to: '/consultant/clients',
    icon: Users,
    label: '내담자 조회',
    end: false,
    children: [
      { to: '/consultant/clients', icon: Users, label: '내 내담자 목록', end: true },
      { to: '/consultant/messages', icon: MessageCircle, label: '상담사 메시지', end: true }
    ]
  },
  {
    to: '/consultant/consultation-records',
    icon: FileText,
    label: '상담 기록',
    end: false,
    children: [
      { to: '/consultant/consultation-records', icon: FileText, label: '상담 일지 관리', end: true },
      { to: '/consultant/consultation-logs', icon: FileText, label: '상담 리포트/로그', end: true }
    ]
  }
];

const ERP_MENU_ITEMS = [
  { to: '/erp/dashboard', icon: LayoutDashboard, label: '운영 현황', end: true },
  { to: '/erp/purchase', icon: ShoppingCart, label: '구매 관리', end: true },
  { to: '/erp/financial', icon: DollarSign, label: '수입·지출', end: true },
  { to: '/erp/budget', icon: PieChart, label: '예산 관리', end: true },
  { to: '/erp/salary', icon: DollarSign, label: '급여 관리', end: true },
  { to: '/erp/tax', icon: Receipt, label: '세무 관리', end: true }
];

export {
  BREAKPOINT_DESKTOP,
  DEFAULT_MENU_ITEMS,
  CLIENT_MENU_ITEMS,
  CONSULTANT_MENU_ITEMS,
  ERP_MENU_ITEMS
};
