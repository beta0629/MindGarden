/**
 * GNB 빠른 액션 상수 - 역할별 빠른 액션 목록
 *
 * 경로는 LNB 폴백(`menuItems.js`)·`ADMIN_ROUTES`와 동기화.
 * @see docs/project-management/GNB_LNB_MENU_SYNCHRONIZATION_DIRECTIVE.md
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  FileEdit,
  Calendar,
  MessageSquare,
  MessageCircle,
  Clock,
  CalendarPlus,
  Star,
  CreditCard
} from 'lucide-react';
import { ADMIN_ROUTES } from './adminRoutes';

export const QUICK_ACTIONS = {
  ADMIN: [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: '대시보드 보기',
      action: ADMIN_ROUTES.DASHBOARD,
      type: 'navigate'
    },
    {
      id: 'users',
      icon: Users,
      label: '사용자 관리',
      action: ADMIN_ROUTES.USER_MANAGEMENT,
      type: 'navigate'
    },
    {
      id: 'settings',
      icon: Settings,
      label: '시스템 설정',
      action: ADMIN_ROUTES.SYSTEM_CONFIG,
      type: 'navigate'
    },
    {
      id: 'reports',
      icon: FileText,
      label: '통계',
      action: ADMIN_ROUTES.STATISTICS,
      type: 'navigate'
    },
    {
      id: 'notifications',
      icon: MessageCircle,
      label: '알림·메시지 관리',
      action: ADMIN_ROUTES.NOTIFICATIONS,
      type: 'navigate'
    }
  ],
  CONSULTANT: [
    {
      id: 'record',
      icon: FileEdit,
      label: '상담일지 작성',
      action: 'openRecordModal',
      type: 'modal'
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: '일정 확인',
      action: '/consultant/schedule',
      type: 'navigate'
    },
    {
      id: 'clients',
      icon: Users,
      label: '내담자 관리',
      action: '/consultant/clients',
      type: 'navigate'
    },
    {
      id: 'message',
      icon: MessageSquare,
      label: '메시지 발송',
      action: 'openMessageModal',
      type: 'modal'
    },
    {
      id: 'vacation',
      icon: Clock,
      label: '휴가 신청',
      action: 'openVacationModal',
      type: 'modal'
    }
  ],
  CLIENT: [
    {
      id: 'schedule',
      icon: CalendarPlus,
      label: '내 일정',
      action: '/client/schedule',
      type: 'navigate'
    },
    {
      id: 'sessions',
      icon: FileText,
      label: '회기 관리',
      action: '/client/session-management',
      type: 'navigate'
    },
    {
      id: 'payment',
      icon: CreditCard,
      label: '결제 내역',
      action: '/client/payment-history',
      type: 'navigate'
    },
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: '대시보드',
      action: '/client/dashboard',
      type: 'navigate'
    },
    {
      id: 'rating',
      icon: Star,
      label: '상담사 평가',
      action: 'openRatingModal',
      type: 'modal'
    }
  ],
  STAFF: [
    {
      id: 'schedule',
      icon: Calendar,
      label: '통합 스케줄',
      action: ADMIN_ROUTES.INTEGRATED_SCHEDULE,
      type: 'navigate'
    },
    {
      id: 'users',
      icon: Users,
      label: '사용자 관리',
      action: ADMIN_ROUTES.USER_MANAGEMENT,
      type: 'navigate'
    },
    {
      id: 'consultation-logs',
      icon: FileText,
      label: '상담일지 조회',
      action: ADMIN_ROUTES.CONSULTATION_LOGS,
      type: 'navigate'
    },
    {
      id: 'notification',
      icon: MessageSquare,
      label: '알림 발송',
      action: 'openNotificationModal',
      type: 'modal'
    }
  ]
};

/** Spring Security 등 `ROLE_ADMIN` 형태·레거시 관리자 역할 → QUICK_ACTIONS 키(4역할)로 정규화 */
export const normalizeRoleForQuickActions = (role) => {
  if (role == null || role === '') {
    return '';
  }
  let r = String(role).toUpperCase().trim();
  if (r.startsWith('ROLE_')) {
    r = r.slice(5);
  }
  if (Object.hasOwn(QUICK_ACTIONS, r)) {
    return r;
  }
  const adminAliases = new Set([
    'TENANT_ADMIN',
    'SUPER_ADMIN',
    'PRINCIPAL',
    'OWNER',
    'BRANCH_SUPER_ADMIN',
    'BRANCH_MANAGER',
    'HQ_ADMIN'
  ]);
  if (adminAliases.has(r) || (r.includes('ADMIN') && r !== 'CONSULTANT')) {
    return 'ADMIN';
  }
  return r;
};

export const getQuickActionsForRole = (role) => {
  const key = normalizeRoleForQuickActions(role);
  if (!key) {
    return [];
  }
  return QUICK_ACTIONS[key] || [];
};
