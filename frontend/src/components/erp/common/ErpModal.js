import React, { useEffect } from 'react';

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
  style = {},
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

  const getSizeStyle = () => {
    const sizes = {
      small: {
        width: '400px',
        maxWidth: '90vw'
      },
      medium: {
        width: '600px',
        maxWidth: '90vw'
      },
      large: {
        width: '800px',
        maxWidth: '90vw'
      },
      fullscreen: {
        width: '95vw',
        height: '95vh'
      }
    };
    return sizes[size] || sizes.medium;
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    maxHeight: '90vh',
    overflow: 'auto',
    ...getSizeStyle(),
    ...style
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e0e0e0'
  };

  const titleStyle = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: '600',
    color: '#333333',
    margin: 0
  };

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: 'var(--font-size-xxl)',
    color: '#666666',
    cursor: 'pointer',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s ease'
  };

  const contentStyle = {
    padding: '24px'
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={modalStyle} className={className}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {showCloseButton && (
            <button
              style={closeButtonStyle}
              onClick={onClose}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ×
            </button>
          )}
        </div>
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ErpModal;
