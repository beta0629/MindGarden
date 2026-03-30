/**
 * Core Solution 디자인 시스템 v2.0 - Stat Card Component
/**
 * 
/**
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
/**
 * @reference /docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md (Stat Cards 섹션)
/**
 * @reference /design-system (StatsDashboard)
 */

import React from 'react';
import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * 통계 카드 컴포넌트
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - 아이콘 컴포넌트
 * @param {string|number} props.value - 통계 값
 * @param {string} props.label - 통계 라벨
 * @param {string} [props.change] - 변화율 (예: "+12.5%")
 * @param {string} [props.changeType] - 변화 타입 ('positive'|'negative')
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * @param {Function} [props.onClick] - 클릭 핸들러 (표준화 원칙: 모든 카드에 링크 필수)
 * 
/**
 * @example
/**
 * <StatCard
/**
 *   icon={<Users />}
/**
 *   value={2543}
/**
 *   label="총 사용자"
/**
 *   change="+12.5%"
/**
 *   changeType="positive"
/**
 *   onClick={() => navigate('/admin/users')}
/**
 * />
 */
const StatCard = ({
  icon,
  value,
  label,
  change,
  changeType,
  className = '',
  loading = false,
  onClick,
  ...props
}) => {
  // loading 속성을 DOM에 전달하지 않도록 제거
  const { loading: _, ...domProps } = props;
  
  // 표준화 원칙: onClick이 있으면 클릭 가능한 카드로 표시
  const cardClasses = [
    'mg-dashboard-stat-card',
    onClick ? 'mg-dashboard-stat-card--clickable' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={cardClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      title={onClick ? `${toDisplayString(label, '')} 상세 보기` : undefined}
      {...domProps}
    >
      {icon && (
        <div className="mg-dashboard-stat-icon">
          {icon}
        </div>
      )}
      <div className="mg-dashboard-stat-content">
        <div className="mg-dashboard-stat-value">{toDisplayString(value, '—')}</div>
        <div className="mg-dashboard-stat-label">{toDisplayString(label, '')}</div>
        {change != null && change !== '' && (
          <div className={`mg-dashboard-stat-change ${changeType || ''}`.trim()}>
            {toDisplayString(change, '')}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

