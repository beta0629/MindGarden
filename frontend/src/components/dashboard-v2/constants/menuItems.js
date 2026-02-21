/**
 * Dashboard V2 - 기본 LNB 메뉴 아이템
 * @author CoreSolution
 * @since 2025-02-22
 */

import {
  LayoutDashboard,
  Settings,
  Users,
  FileText
} from 'lucide-react';

const BREAKPOINT_DESKTOP = 768;

const DEFAULT_MENU_ITEMS = [
  { to: '/admin/dashboard-v2', icon: LayoutDashboard, label: '대시보드', end: true },
  { to: '/admin/dashboard-v2/settings', icon: Settings, label: '설정', end: false },
  { to: '/admin/dashboard-v2/users', icon: Users, label: '사용자', end: false },
  { to: '/admin/dashboard-v2/reports', icon: FileText, label: '보고서', end: false }
];

export { BREAKPOINT_DESKTOP, DEFAULT_MENU_ITEMS };
