/**
 * GNB 빠른 액션 상수 - 역할별 빠른 액션 목록
 * 
 * @author CoreSolution
 * @since 2026-03-09
 */

import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Database,
  FileEdit,
  Calendar,
  MessageSquare,
  Clock,
  CalendarPlus,
  Star
} from 'lucide-react';

export const QUICK_ACTIONS = {
  ADMIN: [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: '대시보드 보기',
      action: '/admin/dashboard',
      type: 'navigate'
    },
    {
      id: 'users',
      icon: Users,
      label: '사용자 관리',
      action: '/admin/users',
      type: 'navigate'
    },
    {
      id: 'settings',
      icon: Settings,
      label: '시스템 설정',
      action: '/admin/settings',
      type: 'navigate'
    },
    {
      id: 'reports',
      icon: FileText,
      label: '통계 리포트',
      action: '/admin/reports',
      type: 'navigate'
    },
    {
      id: 'backup',
      icon: Database,
      label: '백업 관리',
      action: '/admin/backup',
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
      id: 'booking',
      icon: CalendarPlus,
      label: '상담 예약',
      action: '/client/booking',
      type: 'navigate'
    },
    {
      id: 'schedule',
      icon: Calendar,
      label: '내 일정',
      action: '/client/schedule',
      type: 'navigate'
    },
    {
      id: 'records',
      icon: FileText,
      label: '상담 기록',
      action: '/client/records',
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
      label: '일정 관리',
      action: '/staff/schedule',
      type: 'navigate'
    },
    {
      id: 'clients',
      icon: Users,
      label: '내담자 관리',
      action: '/staff/clients',
      type: 'navigate'
    },
    {
      id: 'records',
      icon: FileText,
      label: '기록 조회',
      action: '/staff/records',
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

export const getQuickActionsForRole = (role) => {
  if (!role) {
    return [];
  }
  
  const normalizedRole = role.toUpperCase();
  return QUICK_ACTIONS[normalizedRole] || [];
};
