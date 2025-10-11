/**
 * MindGarden 모달 컴포넌트
 * 다양한 스타일과 크기의 모달 다이얼로그
 */

import React, { useEffect } from 'react';
import './MGModal.css';

const MGModal = ({
  isOpen = false,
  onClose = null,
  title = '',
  children,
  size = 'medium', // 'small', 'medium', 'large', 'full'
  variant = 'default', // 'default', 'centered', 'sidebar'
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (!closeOnEscape) return;

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
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const modalClasses = [
    'mg-modal',
    `mg-modal--${variant}`,
    `mg-modal--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="mg-modal__overlay" onClick={handleOverlayClick}>
      <div className={modalClasses} {...props}>
        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="mg-modal__header">
            {title && (
              <h2 className="mg-modal__title">{title}</h2>
            )}
            {showCloseButton && (
              <button 
                className="mg-modal__close"
                onClick={onClose}
                aria-label="닫기"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* 본문 */}
        <div className="mg-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
};

// 모달 헤더 컴포넌트
export const MGModalHeader = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <div className={`mg-modal__header ${className}`} {...props}>
    {children}
  </div>
);

// 모달 본문 컴포넌트
export const MGModalBody = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <div className={`mg-modal__body ${className}`} {...props}>
    {children}
  </div>
);

// 모달 푸터 컴포넌트
export const MGModalFooter = ({ 
  children, 
  className = '',
  ...props 
}) => (
  <div className={`mg-modal__footer ${className}`} {...props}>
    {children}
  </div>
);

// 확인/취소 모달
export const MGConfirmModal = ({
  isOpen = false,
  onClose = null,
  onConfirm = null,
  title = '확인',
  message = '정말로 진행하시겠습니까?',
  confirmText = '확인',
  cancelText = '취소',
  confirmVariant = 'primary',
  ...props
}) => (
  <MGModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="small"
    {...props}
  >
    <MGModalBody>
      <p className="mg-modal__message">{message}</p>
    </MGModalBody>
    <MGModalFooter>
      <div className="mg-modal__actions">
        <button 
          className="mg-modal__button mg-modal__button--secondary"
          onClick={onClose}
        >
          {cancelText}
        </button>
        <button 
          className={`mg-modal__button mg-modal__button--${confirmVariant}`}
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
        >
          {confirmText}
        </button>
      </div>
    </MGModalFooter>
  </MGModal>
);

// 로딩 모달
export const MGLoadingModal = ({
  isOpen = false,
  title = '처리 중...',
  message = '잠시만 기다려주세요',
  ...props
}) => (
  <MGModal
    isOpen={isOpen}
    title={title}
    size="small"
    showCloseButton={false}
    closeOnOverlayClick={false}
    closeOnEscape={false}
    {...props}
  >
    <MGModalBody>
      <div className="mg-modal__loading">
        <div className="mg-modal__loading-spinner"></div>
        <p className="mg-modal__loading-text">{message}</p>
      </div>
    </MGModalBody>
  </MGModal>
);

export default MGModal;



