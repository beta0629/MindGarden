/**
 * Dashboard V2 - 기본 LNB 메뉴 아이템 및 권한별 메뉴
 * @author CoreSolution
 * @since 2025-02-22
 */

import {
  LayoutDashboard,
  Link,
  Settings,
  Users,
  FileText,
  Calendar,
  MessageCircle,
  CreditCard,
  ShoppingCart,
  DollarSign,
  PieChart,
  Receipt,
  Building2,
  BarChart3
} from 'lucide-react';

const BREAKPOINT_DESKTOP = 768;

const DEFAULT_MENU_ITEMS = [
  { to: '/admin/dashboard-v2', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/admin/mapping-management', icon: Link, label: '매칭 관리', end: true },
  { to: '/admin/dashboard-v2/settings', icon: Settings, label: '설정', end: false },
  { to: '/admin/dashboard-v2/users', icon: Users, label: '사용자', end: false },
  { to: '/admin/dashboard-v2/reports', icon: FileText, label: '보고서', end: false }
];

const CLIENT_MENU_ITEMS = [
  { to: '/client/dashboard', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/client/schedule', icon: Calendar, label: '스케줄', end: true },
  { to: '/client/session-management', icon: FileText, label: '회기 관리', end: true },
  { to: '/client/payment-history', icon: CreditCard, label: '결제 내역', end: true },
  { to: '/client/settings', icon: Settings, label: '설정', end: true }
];

const CONSULTANT_MENU_ITEMS = [
  { to: '/consultant/dashboard', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/consultant/schedule', icon: Calendar, label: '스케줄', end: true },
  { to: '/consultant/consultation-records', icon: FileText, label: '상담 기록', end: true },
  { to: '/consultant/availability', icon: Users, label: '가능 시간', end: true },
  { to: '/consultant/messages', icon: MessageCircle, label: '메시지', end: true }
];

const ERP_MENU_ITEMS = [
  { to: '/erp/dashboard', icon: LayoutDashboard, label: 'ERP 대시보드', end: true },
  { to: '/erp/purchase', icon: ShoppingCart, label: '구매 관리', end: true },
  { to: '/erp/financial', icon: DollarSign, label: '재무 관리', end: true },
  { to: '/erp/budget', icon: PieChart, label: '예산 관리', end: true },
  { to: '/erp/tax', icon: Receipt, label: '세무 관리', end: true }
];

const HQ_MENU_ITEMS = [
  { to: '/hq/dashboard', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/hq/branch-management', icon: Building2, label: '지점 관리', end: true },
  { to: '/hq/erp/branch-financial', icon: DollarSign, label: '지점별 재무', end: true },
  { to: '/hq/erp/consolidated', icon: BarChart3, label: '통합 재무', end: true },
  { to: '/hq/erp/reports', icon: FileText, label: '재무 보고서', end: true }
];

export {
  BREAKPOINT_DESKTOP,
  DEFAULT_MENU_ITEMS,
  CLIENT_MENU_ITEMS,
  CONSULTANT_MENU_ITEMS,
  ERP_MENU_ITEMS,
  HQ_MENU_ITEMS
};
