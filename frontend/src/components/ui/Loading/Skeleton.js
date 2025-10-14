/**
 * MindGarden 디자인 시스템 v2.0 - Skeleton Component
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.2)
 */

import React from 'react';

/**
 * 스켈레톤 로딩 컴포넌트
 * 
 * @param {Object} props
 * @param {string} [props.variant='text'] - 스켈레톤 타입 ('text'|'title'|'avatar'|'card')
 * @param {string} [props.width] - 너비 (CSS 값)
 * @param {string} [props.height] - 높이 (CSS 값)
 * @param {string} [props.className=''] - 추가 CSS 클래스
 * 
 * @example
 * <Skeleton variant="title" />
 * <Skeleton variant="text" width="80%" />
 * <Skeleton variant="avatar" />
 */
const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}) => {
  const variantClass = `mg-skeleton-${variant}`;
  
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`mg-skeleton-box ${variantClass} ${className}`.trim()}
      style={style}
    />
  );
};

export default Skeleton;

