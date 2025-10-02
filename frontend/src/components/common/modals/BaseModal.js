import React, { useEffect } from 'react';
import '../../styles/main.css';

/**
 * 기본 모달 컴포넌트
 * 모든 모달의 베이스가 되는 공통 컴포넌트
 */
const BaseModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium', // small, medium, large, fullscreen
  type = 'default', // default, confirm, alert
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  stackLevel = 1
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
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  const overlayClasses = [
    'mg-modal-overlay',
    isOpen ? 'mg-modal-overlay--visible' : '',
    stackLevel > 1 ? `mg-modal-overlay--stack-${stackLevel}` : '',
    className
  ].filter(Boolean).join(' ');

  const modalClasses = [
    'mg-modal',
    `mg-modal--${size}`,
    type !== 'default' ? `mg-modal--${type}` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={overlayClasses}
      onClick={handleBackdropClick}
      data-backdrop-click={closeOnOverlayClick}
    >
      <div className={modalClasses}>
        {title && (
          <div className="mg-modal__header">
            <h2 className="mg-modal__title">{title}</h2>
            {showCloseButton && (
              <button 
                className="mg-modal__close"
                onClick={onClose}
                aria-label="닫기"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="mg-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
