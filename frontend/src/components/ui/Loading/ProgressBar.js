/**
 * MindGarden 디자인 시스템 v2.0 - Progress Bar Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 */

import React from 'react';

/**
 * 프로그레스 바 컴포넌트
 * 
 * @param {Object} props
 * @param {number} props.value - 진행률 (0-100)
 * @param {string} [props.size='medium'] - 크기 ('small'|'medium'|'large')
 * @param {boolean} [props.showLabel=false] - 진행률 라벨 표시
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <ProgressBar value={75} showLabel />
 */
const ProgressBar = ({ 
  value, 
  size = 'medium', 
  showLabel = false,
  className = '' 
}) => {
  const percentage = Math.min(100, Math.max(0, value));
  const sizeClass = size !== 'medium' ? size : '';

  return (
    <div>
      {showLabel && (
        <div className="mg-flex-between mg-mb-sm">
          <span className="mg-body-small">진행률</span>
          <span className="mg-body-small">{percentage}%</span>
        </div>
      )}
      <div className={`mg-progress-bar ${sizeClass} ${className}`.trim()}>
        <div 
          className="mg-progress-fill" 
          style={{ '--progress-percentage': `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

