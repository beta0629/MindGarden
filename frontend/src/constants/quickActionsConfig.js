/**
 * Quick Actions 위젯 설정
/**
 * 역할별 빠른 액션 버튼 정의
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (위젯 표준화)
/**
 * @since 2025-11-29
 */

import React from 'react';
import { 
  User, Calendar, MessageCircle, UserPlus, History, 
  FileText, Link2, Code, BarChart3, HelpCircle, Settings 
} from 'lucide-react';
import { RoleUtils } from './roles';

/**
 * 기본 공통 액션들 (모든 사용자)
 */
const COMMON_ACTIONS = [
  {
    id: 'profile',
    label: '프로필',
    icon: <User size={24} />,
    url: (user) => `/${user?.role?.toLowerCase()}/mypage`,
    tooltip: '내 프로필 보기'
  },
  {
    id: 'schedule',
    label: '스케줄',
    icon: <Calendar size={24} />,
    url: (user) => {
      if (RoleUtils.isConsultant(user)) {
        return '/consultant/schedule';
      }
      return `/${user?.role?.toLowerCase()}/schedule`;
    },
    tooltip: '일정 관리'
  },
  {
    id: 'consultation-history',
    label: '상담 내역',
    icon: <History size={24} />,
    url: '/consultation-history',
    tooltip: '과거 상담 내역 보기'
  },
  {
    id: 'consultation-report',
    label: '상담 리포트',
    icon: <FileText size={24} />,
    url: '/consultation-report',
    tooltip: '상담 리포트 확인'
  },
  {
    id: 'help',
    label: '도움말',
    icon: <HelpCircle size={24} />,
    url: '/help',
    tooltip: '도움말 및 FAQ'
  },
  {
    id: 'settings',
    label: '설정',
    icon: <Settings size={24} />,
    url: (user) => `/${user?.role?.toLowerCase()}/settings`,
    tooltip: '계정 설정'
  }
];

/**
 * 내담자/상담사 전용 액션들
 */
const CLIENT_CONSULTANT_ACTIONS = [
  {
    id: 'messages',
    label: (user) => RoleUtils.isClient(user) ? '상담사 메시지' : '메시지 관리',
    icon: <MessageCircle size={24} />,
    url: (user) => {
      if (RoleUtils.isClient(user)) {
        return '/client/messages';
      } else if (RoleUtils.isConsultant(user)) {
        return '/consultant/messages';
      }
      return '/messages';
    },
    roles: ['CLIENT', 'CONSULTANT'],
    tooltip: '메시지 관리'
  }
];

/**
 * 내담자 전용 액션들 (현재 비활성화된 것들 포함)
 */
const CLIENT_ACTIONS = [
  {
    id: 'consultant-application',
    label: '상담사 신청',
    icon: <UserPlus size={24} />,
    onClick: 'MODAL:consultant-application', // 모달 트리거
    roles: ['CLIENT'],
    enabled: false, // 현재 임시 비활성화
    tooltip: '상담사로 신청하기'
  }
];

/**
 * 관리자 전용 액션들
 */
const ADMIN_ACTIONS = [
  {
    id: 'mapping-management',
    label: '매칭 시스템',
    icon: <Link2 size={24} />,
    url: '/admin/mapping-management',
    roles: ['ADMIN', 'HQ_MASTER', 'BRANCH_SUPER_ADMIN'],
    tooltip: '상담사-내담자 매칭 관리'
  },
  {
    id: 'common-codes',
    label: '공통코드',
    icon: <Code size={24} />,
    url: '/admin/common-codes',
    roles: ['ADMIN', 'HQ_MASTER'],
    tooltip: '시스템 공통코드 관리'
  },
  {
    id: 'statistics',
    label: '통계',
    icon: <BarChart3 size={24} />,
    url: '/admin/statistics',
    roles: ['ADMIN', 'HQ_MASTER'],
    tooltip: '시스템 통계 보기'
  }
];

/**
 * 역할별 QuickActions 설정 생성
/**
 * @param {Object} user - 사용자 정보
/**
 * @returns {Array} 액션 설정 배열
 */
export const generateQuickActionsConfig = (user) => {
  if (!user?.role) {
    return COMMON_ACTIONS;
  }

  let actions = [...COMMON_ACTIONS];
  
  // 내담자/상담사 공통 액션 추가
  if (['CLIENT', 'CONSULTANT'].includes(user.role)) {
    actions = [...actions, ...CLIENT_CONSULTANT_ACTIONS];
  }
  
  // 내담자 전용 액션 추가
  if (user.role === 'CLIENT') {
    actions = [...actions, ...CLIENT_ACTIONS.filter(action => action.enabled !== false)];
  }
  
  // 관리자 전용 액션 추가
  if (['ADMIN', 'BRANCH_SUPER_ADMIN', 'HQ_MASTER'].includes(user.role)) {
    actions = [...actions, ...ADMIN_ACTIONS];
  }

  // URL이 함수인 경우 실행해서 실제 URL로 변환
  return actions.map(action => ({
    ...action,
    url: typeof action.url === 'function' ? action.url(user) : action.url,
    label: typeof action.label === 'function' ? action.label(user) : action.label
  }));
};

/**
 * 기본 QuickActions 위젯 설정
/**
 * @param {Object} user - 사용자 정보
/**
 * @returns {Object} 위젯 설정 객체
 */
export const createQuickActionsWidget = (user) => ({
  id: 'quick-actions-widget',
  type: 'quick-actions',
  title: '빠른 액션',
  config: {
    title: '빠른 액션',
    actions: generateQuickActionsConfig(user),
    showTooltips: true,
    gridLayout: 'responsive' // 반응형 그리드
  }
});

export default {
  generateQuickActionsConfig,
  createQuickActionsWidget,
  COMMON_ACTIONS,
  CLIENT_CONSULTANT_ACTIONS,
  CLIENT_ACTIONS,
  ADMIN_ACTIONS
};
