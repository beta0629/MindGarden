import React, { useState, useCallback } from 'react';
import { Loader } from 'lucide-react';
import './MGButton.css';

/**
 * Core Solution 공통 버튼 컴포넌트
 * - 중복 클릭 방지
 * - 로딩 상태 표시
 * - 다양한 스타일 지원
 * - 접근성 고려
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.variant - 버튼 스타일 (primary, secondary, success, danger, warning, info, outline, progress)
 * @param {string} props.size - 버튼 크기 (small, medium, large)
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {boolean} props.loading - 로딩 상태
 * @param {string} props.loadingText - 로딩 중 표시 텍스트
 * @param {boolean} props.preventDoubleClick - 중복 클릭 방지 여부 (type=submit 이고 onClick 없음·또는 form 으로 외부 폼만 제출할 때는 무시되고 끔)
 * @param {number} props.clickDelay - 클릭 후 대기 시간 (ms)
 * @param {Function} props.onClick - 클릭 핸들러
 * @param {string} props.className - 추가 CSS 클래스
 * @param {string} props.type - 버튼 타입 (button, submit, reset)
 * @param {string} [props.form] - 연결할 폼 id (해당 폼 submit 버튼이 폼 밖에 있을 때)
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {Object} props.style - 인라인 스타일
 * @param {string} props.title - 툴팁 텍스트
 * @param {boolean} props.fullWidth - 전체 너비 사용 여부
 * @param {number} props.progress - 진행률 (0-100), variant="progress"일 때 사용
 * 
 * @author Core Solution
 * @version 1.1.0
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
  form,
  children,
  style = {},
  title = '',
  fullWidth = false,
  progress = 0,
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // 네이티브 폼 제출만 쓰는 경우(onClick 없음): 클릭 직후 isProcessing 으로 disabled 되면
  // 브라우저가 submit 을 수행하지 못할 수 있음. type=submit 이거나 form 으로 외부 폼에 연결된 submit 도 동일.
  // 이 조합에서는 props.preventDoubleClick 이 true 여도 적용하지 않음.
  const hasFormAttr = form != null && String(form).trim() !== '';
  const isNativeFormSubmitOnly = !onClick && (type === 'submit' || hasFormAttr);
  const effectivePreventDoubleClick = isNativeFormSubmitOnly ? false : preventDoubleClick;

  const handleClick = useCallback(async (e) => {
    // 이미 처리 중이거나 비활성화된 경우 무시
    if (isProcessing || disabled || loading) {
      e.preventDefault();
      return;
    }

    // 중복 클릭 방지 활성화
    if (effectivePreventDoubleClick) {
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
      if (effectivePreventDoubleClick) {
        setTimeout(() => {
          setIsProcessing(false);
        }, clickDelay);
      }
    }
  }, [isProcessing, disabled, loading, effectivePreventDoubleClick, clickDelay, onClick]);

  const isLoadingState = loading || isProcessing;
  const isDisabledState = disabled;

  // 버튼 클래스 구성
  const buttonClasses = [
    'mg-button',
    `mg-button--${variant}`,
    `mg-button--${size}`,
    isDisabledState ? 'mg-button--disabled' : '',
    isLoadingState ? 'mg-button--loading' : '',
    fullWidth ? 'mg-button--full-width' : '',
    className
  ].filter(Boolean).join(' ');

  // 버튼 상태 확인
  const isButtonDisabled = isDisabledState || isLoadingState;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={isButtonDisabled}
      onClick={handleClick}
      style={style}
      title={title || (isLoadingState ? '처리 중입니다...' : '')}
      aria-disabled={isButtonDisabled}
      {...props}
      form={form}
    >
      {variant === 'progress' && (
        <div 
          className="mg-button__progress-bar" 
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
        />
      )}

      <span className="mg-button__content">
        {/* 로딩 상태 표시 */}
        {isLoadingState && (
          <span className="mg-button__loading">
            <Loader className="mg-button__spinner" size={size === 'small' ? 14 : 16} />
          </span>
        )}
        
        {/* 버튼 텍스트/내용 */}
        <span className={`mg-button__text ${isLoadingState ? 'mg-button__text--loading' : ''}`}>
          {isLoadingState ? loadingText : children}
        </span>
      </span>
    </button>
  );
};

export default MGButton;