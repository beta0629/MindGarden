import React, { useEffect } from 'react';
import '../../../styles/main.css'; // Ensure main.css is imported for mg-modal styles

/**
 * 통합 모달 컴포넌트
 * 모든 모달의 표준이 되는 공통 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림/닫힘 상태
 * @param {function} props.onClose - 모달 닫기 핸들러
 * @param {string} props.title - 모달 제목
 * @param {string} props.subtitle - 모달 부제목
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {string} props.size - 모달 크기 (small, medium, large, fullscreen)
 * @param {string} props.variant - 모달 타입 (default, confirm, form, detail, alert)
 * @param {boolean} props.backdropClick - 배경 클릭으로 닫기 여부
 * @param {boolean} props.showCloseButton - 닫기 버튼 표시 여부
 * @param {number} props.zIndex - z-index 값 (중첩 모달용)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.actions - 액션 버튼들
 * @param {boolean} props.loading - 로딩 상태
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-31
 */
const UnifiedModal = ({ 
  isOpen = false,
  onClose,
  title = '',
  subtitle = '',
  children,
  size = 'medium',
  variant = 'default',
  backdropClick = true,
  showCloseButton = true,
  zIndex = null,
  className = '',
  actions = null,
  loading = false,
  ...props 
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (backdropClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  // 오버레이 클래스 구성
  const overlayClasses = [
    'mg-modal-overlay',
    isOpen ? 'mg-modal-overlay--visible' : '',
    variant !== 'default' ? `mg-modal-overlay--${variant}` : '',
    className
  ].filter(Boolean).join(' ');

  // 모달 클래스 구성
  const modalClasses = [
    'mg-modal',
    `mg-modal--${size}`,
    variant !== 'default' ? `mg-modal--${variant}` : '',
    loading ? 'mg-modal--loading' : '',
    className
  ].filter(Boolean).join(' ');

  // z-index 스타일 적용
  const overlayStyle = zIndex ? { zIndex } : {};

  return (
    <div 
      className={overlayClasses}
      onClick={handleBackdropClick}
      style={overlayStyle}
      data-backdrop-click={backdropClick}
      {...props}
    >
      <div className={modalClasses}>
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="mg-modal__header">
            <div className="mg-modal__header-content">
              {title && (
                <h2 className="mg-modal__title">{title}</h2>
              )}
              {subtitle && (
                <p className="mg-modal__subtitle">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button 
                className="mg-modal__close"
                onClick={onClose}
                aria-label="닫기"
                disabled={loading}
              >
                ×
              </button>
            )}
          </div>
        )}
        
        {/* 바디 */}
        <div className="mg-modal__body">
          {children}
        </div>
        
        {/* 액션 버튼들 */}
        {actions && (
          <div className="mg-modal__actions">
            {actions}
          </div>
        )}
        
        {/* 로딩 오버레이 */}
        {loading && (
          <div className="mg-modal__loading-overlay">
            <div className="mg-modal__loading-spinner">
              <div className="mg-loading-spinner-icon mg-loading-spinner-small"></div>
              <div style={{ 
                marginLeft: '12px', 
                color: 'var(--color-text-primary)', 
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                처리 중...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedModal;
