import React, { useEffect } from 'react';
import './ErpModal.css';

/**
 * ERP 공통 모달 컴포넌트
 */
const ErpModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
  className = ''
}) => {
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="erp-modal-overlay" onClick={handleOverlayClick}>
      <div className={`erp-modal erp-modal--${size} ${className}`}>
        <div className="erp-modal-header">
          <h2 className="erp-modal-title">{title}</h2>
          {showCloseButton && (
            <button
              className="erp-modal-close"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
        <div className="erp-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ErpModal;
