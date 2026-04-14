/**
 * GNB 빠른 액션 상수 - 역할별 빠른 액션 목록
 *
 * ADMIN/STAFF 내비게이션 퀵은 {@link buildAdminLnbFallbackQuickNavigateSpecs}와 동일 소스(LNB 폴백).
 *
 * @author CoreSolution
 * @since 2026-03-09
 */

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
      icon: 'FILE_EDIT',
      label: '상담일지 작성',
      action: 'openRecordModal',
      type: 'modal'
    },
    {
      id: 'schedule',
      icon: 'CALENDAR',
      label: '일정 관리',
      action: '/consultant/schedule',
      type: 'navigate'
    },
    {
      id: 'clients',
      icon: 'USERS',
      label: '내담자 조회',
      action: '/consultant/clients',
      type: 'navigate'
    },
    {
      id: 'message',
      icon: 'MESSAGE_SQUARE',
      label: '메시지 발송',
      action: 'openMessageModal',
      type: 'modal'
    },
    {
      id: 'vacation',
      icon: 'CLOCK',
      label: '휴가 신청',
      action: 'openVacationModal',
      type: 'modal'
    }
  ],
  CLIENT: [
    {
      id: 'booking',
      icon: 'CALENDAR_PLUS',
      label: '상담 예약',
      action: '/client/booking',
      type: 'navigate'
    },
    {
      id: 'schedule',
      icon: 'CALENDAR',
      label: '스케줄',
      action: '/client/schedule',
      type: 'navigate'
    },
    {
      id: 'session-management',
      icon: 'FILE_TEXT',
      label: '회기 관리',
      action: '/client/session-management',
      type: 'navigate'
    },
    {
      id: 'rating',
      icon: 'STAR',
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
