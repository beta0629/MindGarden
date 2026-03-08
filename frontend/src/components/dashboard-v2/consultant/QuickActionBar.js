import React from 'react';
import PropTypes from 'prop-types';
import { Zap, FileText, Calendar, Users, MessageSquare } from 'lucide-react';

/**
 * 빠른 액션 바 컴포넌트
 * 
 * @description 상담사가 자주 사용하는 동작을 1클릭으로 접근할 수 있는 바
 * @param {Function} onNavigate - 네비게이션 함수
 * @param {string} className - 추가 CSS 클래스
 */
const QuickActionBar = ({ onNavigate, className = '' }) => {
  const actions = [
    {
      id: 'create-record',
      label: '상담일지 작성',
      icon: FileText,
      path: '/consultant/consultation-records?action=create',
      variant: 'primary'
    },
    {
      id: 'view-schedule',
      label: '일정 조회',
      icon: Calendar,
      path: '/consultant/schedule',
      variant: 'outline'
    },
    {
      id: 'manage-clients',
      label: '내담자 관리',
      icon: Users,
      path: '/consultant/clients',
      variant: 'outline'
    },
    {
      id: 'check-messages',
      label: '메시지 확인',
      icon: MessageSquare,
      path: '/consultant/messages',
      variant: 'outline'
    }
  ];

  return (
    <div className={`mg-v2-quick-action-bar ${className}`}>
      <div className="mg-v2-quick-action-bar__title">
        <Zap size={18} />
        빠른 액션
      </div>
      <div className="mg-v2-quick-action-bar__actions">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={`mg-v2-btn mg-v2-btn-${action.variant} mg-v2-btn-md`}
              onClick={() => onNavigate(action.path)}
              type="button"
              aria-label={action.label}
            >
              <Icon size={16} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

QuickActionBar.propTypes = {
  onNavigate: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default QuickActionBar;
