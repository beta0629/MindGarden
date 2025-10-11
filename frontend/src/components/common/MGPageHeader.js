/**
 * MindGarden 공통 페이지 헤더 컴포넌트
 * 기존 CSS 변수를 활용한 일관성 있는 페이지 헤더 디자인
 */

import React from 'react';
import './MGPageHeader.css';

const MGPageHeader = ({
  title,
  subtitle = null,
  description = null,
  icon = null,
  actions = null,
  showBackButton = false,
  onBackClick = null,
  className = '',
  ...props
}) => {
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.history.back();
    }
  };

  return (
    <div className={`mg-page-header ${className}`} {...props}>
      <div className="mg-page-header__content">
        {showBackButton && (
          <button 
            className="mg-page-header__back-button"
            onClick={handleBackClick}
            aria-label="뒤로 가기"
          >
            ←
          </button>
        )}
        
        <div className="mg-page-header__main">
          {icon && (
            <div className="mg-page-header__icon">
              {icon}
            </div>
          )}
          
          <div className="mg-page-header__text">
            <h1 className="mg-page-header__title">
              {title}
            </h1>
            
            {subtitle && (
              <h2 className="mg-page-header__subtitle">
                {subtitle}
              </h2>
            )}
            
            {description && (
              <p className="mg-page-header__description">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="mg-page-header__actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default MGPageHeader;



