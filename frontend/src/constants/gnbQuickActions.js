/**
 * GNB 빠른 액션 상수 - 역할별 빠른 액션 목록
 *
 * ADMIN/STAFF 내비게이션 퀵은 {@link buildAdminLnbFallbackQuickNavigateSpecs}와 동일 소스(LNB 폴백).
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

import {
  FileEdit,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Clock,
  CalendarPlus,
  Star
} from 'lucide-react';
import { buildAdminLnbFallbackQuickNavigateSpecs } from '../components/dashboard-v2/constants/menuItems';

const adminStaffNavigateQuickActions = buildAdminLnbFallbackQuickNavigateSpecs().map(
  ({ id, icon, label, to }) => ({
    id,
    icon,
    label,
    action: to,
    type: 'navigate'
  })
);

export const QUICK_ACTIONS = {
  ADMIN: adminStaffNavigateQuickActions,
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
      label: '일정 관리',
      action: '/consultant/schedule',
      type: 'navigate'
    },
    {
      id: 'clients',
      icon: Users,
      label: '내담자 조회',
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
      id: 'booking',
      icon: CalendarPlus,
      label: '상담 예약',
      action: '/client/booking',
      type: 'navigate'
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: '스케줄',
      action: '/client/schedule',
      type: 'navigate'
    },
    {
      id: 'session-management',
      icon: FileText,
      label: '회기 관리',
      action: '/client/session-management',
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
  STAFF: adminStaffNavigateQuickActions
};

export const getQuickActionsForRole = (role) => {
  if (!role) {
    return [];
  }

  const normalizedRole = role.toUpperCase();
  return QUICK_ACTIONS[normalizedRole] || [];
};
