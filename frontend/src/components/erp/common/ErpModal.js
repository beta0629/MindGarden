import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * ERP 공통 모달 컴포넌트 - MindGarden 디자인 시스템 mg-modal 활용
 * ReactDOM.createPortal을 사용하여 document.body에 직접 렌더링
 * 
 * @param {boolean} isOpen - 모달 열림 상태
 * @param {function} onClose - 모달 닫기 핸들러
 * @param {string} title - 모달 제목
 * @param {React.ReactNode} children - 모달 내용
 * @param {string} size - 모달 크기 (sm, md, lg, xl)
 * @param {boolean} showCloseButton - 닫기 버튼 표시 여부
 * @param {string} className - 추가 CSS 클래스
 */
const ErpModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  className = ''
}) => {
  // ESC 키로 모달 닫기 & body 스크롤 방지
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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

  if (!isOpen) return null;

  // 오버레이 클릭 시 모달 닫기
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // MindGarden 디자인 시스템의 mg-modal 클래스 활용
  const modalClasses = [
    'mg-modal-content',
    size !== 'md' && `mg-modal-${size}`,
    className
  ].filter(Boolean).join(' ');

  // ReactDOM.createPortal을 사용하여 document.body에 렌더링
  return ReactDOM.createPortal(
    <div className="mg-modal-overlay" onClick={handleOverlayClick}>
      <div className={modalClasses}>
        <div className="mg-modal-header">
          <h3 className="mg-h4">{title}</h3>
          {showCloseButton && (
            <button
              className="mg-modal-close"
              onClick={onClose}
              aria-label="모달 닫기"
            >
              ×
            </button>
          )}
        </div>
        <div className="mg-modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ErpModal;
