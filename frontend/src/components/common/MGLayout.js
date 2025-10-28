/**
 * MindGarden 고급 레이아웃 컴포넌트
 * 반응형 그리드와 섹션 관리를 위한 레이아웃 시스템
 */

import React from 'react';
import './MGLayout.css';

const MGLayout = ({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) => {
  return (
    <div className={`mg-layout mg-layout--${variant} ${className}`} {...props}>
      {children}
    </div>
  );
};

// 섹션 컴포넌트
export const MGSection = ({ 
  children, 
  variant = 'default',
  padding = 'large',
  background = 'transparent',
  className = '',
  ...props 
}) => {
  return (
    <section 
      className={`mg-v2-section mg-v2-section--${variant} mg-v2-section--padding-${padding} mg-v2-section--bg-${background} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
};

// 컨테이너 컴포넌트
export const MGContainer = ({ 
  children, 
  size = 'xl',
  className = '',
  ...props 
}) => {
  return (
    <div className={`mg-v2-container mg-v2-container--${size} ${className}`} {...props}>
      {children}
    </div>
  );
};

// 그리드 컴포넌트
export const MGGrid = ({ 
  children, 
  cols = 'auto',
  gap = 'medium',
  className = '',
  ...props 
}) => {
  const gridCols = typeof cols === 'number' ? cols : `repeat(auto-fit, minmax(${cols === 'auto' ? '300px' : cols}, 1fr))`;
  
  return (
    <div 
      className={`mg-grid mg-grid--gap-${gap} ${className}`}
      style={{ '--grid-cols': gridCols }}
      {...props}
    >
      {children}
    </div>
  );
};

// 플렉스 컴포넌트
export const MGFlex = ({ 
  children, 
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 'medium',
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`mg-flex mg-flex--${direction} mg-flex--justify-${justify} mg-flex--align-${align} ${wrap ? 'mg-flex--wrap' : ''} mg-flex--gap-${gap} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// 스페이서 컴포넌트
export const MGSpace = ({ 
  size = 'medium',
  className = '',
  ...props 
}) => {
  return (
    <div className={`mg-space mg-space--${size} ${className}`} {...props} />
  );
};

// 디바이더 컴포넌트
export const MGDivider = ({ 
  variant = 'line',
  className = '',
  ...props 
}) => {
  return (
    <div className={`mg-divider mg-divider--${variant} ${className}`} {...props} />
  );
};

export default MGLayout;



