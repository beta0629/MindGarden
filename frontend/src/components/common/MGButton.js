import React, { useState, useCallback } from 'react';
import UnifiedLoading from './UnifiedLoading';
import './MGButton.css';

/**
 * MindGarden 공통 버튼 컴포넌트
 * - 중복 클릭 방지
 * - 로딩 상태 표시
 * - 다양한 스타일 지원
 * - 접근성 고려
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.variant - 버튼 스타일 (primary, secondary, success, danger, warning, info, outline)
 * @param {string} props.size - 버튼 크기 (small, medium, large)
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.loadingText - 로딩 중 표시 텍스트
 * @param {boolean} props.preventDoubleClick - 중복 클릭 방지 여부
 * @param {number} props.clickDelay - 클릭 후 대기 시간 (ms)
 * @param {Function} props.onClick - 클릭 핸들러
 * @param {string} props.className - 추가 CSS 클래스
 * @param {string} props.type - 버튼 타입 (button, submit, reset)
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {Object} props.style - 인라인 스타일
 * @param {string} props.title - 툴팁 텍스트
 * @param {boolean} props.fullWidth - 전체 너비 사용 여부
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-22
 */
const MGButton = ({
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
            <UnifiedLoading 
              variant="spinner" 
              size="small" 
              showText={false}
              type="inline"
            />
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
          <UnifiedLoading 
            variant="pulse" 
            size="small" 
            showText={false}
            type="inline"
          />
        </span>
      )}
    </button>
  );
};

export default MGButton;