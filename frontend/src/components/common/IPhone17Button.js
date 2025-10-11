import React from 'react';
import './iPhone17Button.css';

/**
 * iPhone 17 디자인 언어를 적용한 버튼 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.variant - 버튼 변형 (primary, secondary, ghost, glass)
 * @param {string} props.size - 버튼 크기 (sm, md, lg, xl, icon)
 * @param {React.ReactNode} props.children - 버튼 내용
 * @param {string} props.className - 추가 CSS 클래스
 * @param {function} props.onClick - 클릭 핸들러
 * @param {boolean} props.disabled - 비활성화 상태
 * @param {string} props.type - HTML 버튼 타입 (button, submit, reset)
 * @param {Object} props.style - 인라인 스타일
 * @param {string} props.icon - 아이콘 (icon 버튼용)
 * @param {boolean} props.loading - 로딩 상태
 */
const IPhone17Button = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  style,
  icon,
  loading = false,
  ...props
}) => {
  const baseClass = 'iphone17-btn';
  const variantClass = `iphone17-btn-${variant}`;
  const sizeClass = size === 'md' ? '' : `iphone17-btn-${size}`;
  const loadingClass = loading ? 'loading' : '';
  
  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    if (loading) {
      return (
        <div className="iphone17-btn-loading">
          <div className="iphone17-btn-spinner"></div>
          {children && <span className="iphone17-btn-text">{children}</span>}
        </div>
      );
    }

    if (icon && size === 'icon') {
      return icon;
    }

    return (
      <>
        {icon && <span className="iphone17-btn-icon">{icon}</span>}
        {children && <span className="iphone17-btn-text">{children}</span>}
      </>
    );
  };

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      style={style}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default IPhone17Button;