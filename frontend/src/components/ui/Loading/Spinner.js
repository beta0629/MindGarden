/**
 * MindGarden 디자인 시스템 v2.0 - Spinner Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 * @reference /design-system (LoadingShowcase)
 */

import React from 'react';

/**
 * 회전 로딩 스피너 컴포넌트
 * 
 * @param {Object} props
 * @param {string} [props.size='medium'] - 크기 ('small'|'medium'|'large')
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <Spinner size="large" />
 */
const Spinner = ({ size = 'medium', className = '' }) => {
  const sizeClass = size !== 'medium' ? `mg-spinner-${size}` : '';
  
  return (
    <div className={`mg-spinner ${sizeClass} ${className}`.trim()} />
  );
};

export default Spinner;

