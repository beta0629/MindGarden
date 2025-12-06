/**
 * MindGarden 공통 카드 컴포넌트
/**
 * v0.dev 디자인 시스템 기반의 새로운 카드 디자인
 */

/**
 * MindGarden 공통 카드 컴포넌트
/**
 * 표준화 원칙 준수: CSS 클래스 사용, 인라인 스타일 금지
 */
import React from 'react';
import './MGCard.css';

const MGCard = ({
  children,
  variant = 'default',
  padding = 'medium',
  shadow = 'medium',
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = ['mg-card'];
  
  // Variant 클래스
  if (variant !== 'default') {
    baseClasses.push(`mg-card--${variant}`);
  }
  
  // Padding 클래스
  if (padding !== 'medium') {
    baseClasses.push(`mg-card--padding-${padding}`);
  }
  
  // Shadow 클래스
  if (shadow !== 'medium') {
    baseClasses.push(`mg-card--shadow-${shadow}`);
  }
  
  // 클릭 가능한 카드
  if (onClick) {
    baseClasses.push('mg-card--clickable');
  }
  
  // 추가 클래스
  if (className) {
    baseClasses.push(className);
  }
  
  const allClasses = baseClasses.filter(Boolean).join(' ');

  return (
    <div
      className={allClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default MGCard;



