import React from 'react';

/**
 * ERP 공통 버튼 컴포넌트 - MindGarden 디자인 시스템 mg-v2-button 활용
 * 
 * @param {string} variant - 버튼 스타일 (primary, secondary, success, danger, warning, info, outline, ghost)
 * @param {string} size - 버튼 크기 (sm, md, lg)
 * @param {boolean} disabled - 비활성화 여부
 * @param {boolean} loading - 로딩 상태
 * @param {string} className - 추가 CSS 클래스
 * @param {string} type - 버튼 타입 (button, submit, reset)
 */
const ErpButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  className = '',
  type = 'button'
}) => {
  // MindGarden 디자인 시스템의 mg-v2-button 클래스 활용
  const buttonClasses = [
    'mg-v2-button',
    `mg-v2-button-${variant}`,
    size !== 'md' && `mg-v2-button-${size}`,
    loading && 'mg-v2-button-loading',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? '처리중...' : children}
    </button>
  );
};

export default ErpButton;
