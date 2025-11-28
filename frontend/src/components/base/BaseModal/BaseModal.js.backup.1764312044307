import React, { useEffect } from 'react';
import styles from './BaseModal.module.css';

const BaseModal = ({ 
  children, 
  className = '', 
  isOpen = false,
  onClose,
  size = 'medium',
  type = 'default',
  backdropClick = true,
  showCloseButton = true,
  title = '',
  subtitle = '',
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

  const overlayClasses = [
    'mg-modal-overlay',
    'mg-modal-overlay--visible',
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
      data-backdrop-click={backdropClick}
      {...props}
    >
      <div className={modalClasses}>
        {title && (
          <div className="mg-modal__header">
            <h2 className="mg-modal__title">{title}</h2>
            {subtitle && (
              <p className="mg-modal__subtitle">{subtitle}</p>
            )}
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
