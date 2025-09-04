import React from 'react';
import './Modal.css';

/**
 * 공통 모달 컴포넌트
 * 기본 모달 구조를 제공하는 베이스 컴포넌트
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  actions, // 버튼 영역을 위한 props
  size = 'medium', // small, medium, large, fullscreen
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'modal-small';
      case 'large': return 'modal-large';
      case 'fullscreen': return 'modal-fullscreen';
      default: return 'modal-medium';
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-container ${getSizeClass()} ${className}`}>
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            {showCloseButton && (
              <button className="modal-close" onClick={onClose}>
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
        
        {actions && (
          <div className="modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
