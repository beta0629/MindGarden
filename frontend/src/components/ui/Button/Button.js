/**
 * Buttons Component
 * 
 * MindGarden 디자인 시스템 표준 컴포넌트
 * 
 * @author MindGarden Team
 * @version 2.0.0
 * @since 2025-11-28
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  loadingText = '처리 중...',
  preventDoubleClick = true,
  clickDelay = 1000, // 1초 대기
  onClick,
  className = '',
  type = 'button',
  children,
  style = {},
  title = '',
  fullWidth = false,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = useCallback(async (e) => {
    // 이미 처리 중이거나 비활성화된 경우 무시
    if (isProcessing || disabled || loading) {
      e.preventDefault();
      return;
    }

    // 중복 클릭 방지 활성화
    if (preventDoubleClick) {
      setIsProcessing(true);
    }

    try {
      // onClick 핸들러 실행
      if (onClick) {
        await onClick(e);
      }
    } catch (error) {
      console.error('Button click handler error:', error);
    } finally {
      // 클릭 후 대기 시간 적용
      if (preventDoubleClick) {
        setTimeout(() => {
          setIsProcessing(false);
        }, clickDelay);
      }
    }
  }, [isProcessing, disabled, loading, preventDoubleClick, clickDelay, onClick]);

  // 버튼 클래스 구성
  const buttonClasses = [
    'mg-button',
    `mg-button--${variant}`,
    `mg-button--${size}`,
    disabled || loading || isProcessing ? 'mg-button--disabled' : '',
    fullWidth ? 'mg-button--full-width' : '',
    className
  ].filter(Boolean).join(' ');

  // 버튼 상태 확인
  const isDisabled = disabled || loading || isProcessing;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={handleClick}
      style={style}
      title={title || (isProcessing ? '처리 중입니다...' : '')}
      aria-disabled={isDisabled}
      {...props}
    >
      <span className="mg-button__content">
        {/* 로딩 상태 표시 */}
        {loading && (
          <span className="mg-button__loading">
            <span className="mg-button__spinner">⏳</span>
          </span>
        )}
        
        {/* 버튼 텍스트/내용 */}
        <span className={`mg-button__text ${loading ? 'mg-button__text--loading' : ''}`}>
          {loading ? loadingText : children}
        </span>
      </span>
      
      {/* 처리 중 오버레이 */}
      {isProcessing && !loading && (
        <span className="mg-button__processing-overlay">
          <span className="mg-button__spinner">⏳</span>
        </span>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.string
};

Button.defaultProps = {
  className: '',
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  type: 'button'
};

export default Button;
