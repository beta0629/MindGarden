import React, { useEffect, useRef } from 'react';
import './IPhone17Modal.css';


/**
 * iPhone 17 디자인 언어를 적용한 모달 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {function} props.onClose - 모달 닫기 핸들러
 * @param {string} props.title - 모달 제목
 * @param {React.ReactNode} props.children - 모달 내용
 * @param {string} props.variant - 모달 변형 (default, content, fullscreen, side-sheet, alert)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.style - 인라인 스타일
 * @param {boolean} props.closeOnOverlayClick - 오버레이 클릭 시 닫기 여부 (기본값: true)
 * @param {boolean} props.showCloseButton - 닫기 버튼 표시 여부 (기본값: true)
 * @param {React.ReactNode} props.footer - 푸터 내용
 */
const IPhone17Modal = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'default',
  className = '',
  style,
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // 모달이 열릴 때 포커스 관리
  useEffect(() => {
    if (isOpen) {
      // 현재 활성 요소 저장
      previousActiveElement.current = document.activeElement;
      
      // 모달에 포커스
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // ESC 키 리스너 추가
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      // 스크롤 방지
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
        
        // 이전 활성 요소로 포커스 복원
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalClasses = [
    'iphone17-modal',
    variant !== 'default' ? variant : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className="iphone17-modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        ref={modalRef}
        className={modalClasses}
        style={style}
        tabIndex={-1}
        {...props}
      >
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="iphone17-modal-header">
            {title && (
              <h2 
                id="modal-title"
                className="iphone17-modal-title"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button 
                className="iphone17-modal-close"
                onClick={onClose}
                aria-label="모달 닫기"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="iphone17-modal-content">
          {children}
        </div>

        {/* 푸터 */}
        {footer && (
          <div className="iphone17-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default IPhone17Modal;
