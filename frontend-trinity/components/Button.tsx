/**
 * Trinity 공통 버튼 컴포넌트 (MGButton 패턴 적용)
 * - 중복 클릭 방지
 * - 로딩 상태 표시
 * - 다양한 스타일 지원
 * - 접근성 고려
 * 
 * @reference frontend/src/components/common/MGButton.js
 */

"use client";

import React, { useState, useCallback } from 'react';
import './Button.css';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  preventDoubleClick?: boolean;
  clickDelay?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  style?: React.CSSProperties;
  title?: string;
  fullWidth?: boolean;
}

/**
 * 공통 버튼 컴포넌트
 */
const Button: React.FC<ButtonProps> = ({
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

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
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
      title={title}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="mg-button__spinner" aria-hidden="true"></span>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;

