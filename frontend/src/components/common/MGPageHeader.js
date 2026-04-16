/**
 * Core Solution 공통 페이지 헤더 컴포넌트
/**
 * 기존 CSS 변수를 활용한 일관성 있는 페이지 헤더 디자인
 */

import React from 'react';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from './MGButton';
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

  // 표준화 원칙: 의미 있는 HTML 태그 사용 (header)
  return (
    <header className={`mg-page-header ${className}`} {...props}>
      <div className="mg-page-header__content">
        {showBackButton && (
          <MGButton
            type="button"
            className={buildErpMgButtonClassName({
              variant: 'outline',
              size: 'md',
              loading: false,
              className: 'mg-page-header__back-button'
            })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleBackClick}
            aria-label="뒤로 가기"
            variant="outline"
            preventDoubleClick={false}
          >
            ←
          </MGButton>
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
    </header>
  );
};

export default MGPageHeader;



