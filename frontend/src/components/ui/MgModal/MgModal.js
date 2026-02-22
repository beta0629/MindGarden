/**
 * MgModal - B0KlA 스타일 공통 모달 컴포넌트
 * size: full | medium | small
 *
 * @author MindGarden
 * @since 2025-02-22
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import './MgModal.css';

const SIZE_CLASS_MAP = {
  full: 'mg-v2-ad-modal--full',
  medium: 'mg-v2-ad-modal--medium',
  small: 'mg-v2-ad-modal--small'
};

const MgModal = ({
  isOpen = false,
  onClose = null,
  children,
  size = 'medium',
  title = '',
  subtitle = '',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  header,
  footer
}) => {
  useEffect(() => {
    if (!closeOnEscape || !onClose) return;

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
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const modalClasses = ['mg-v2-ad-modal', SIZE_CLASS_MAP[size] || SIZE_CLASS_MAP.medium].filter(Boolean).join(' ');

  const closeBtn = showCloseButton && onClose && (
    <button
      type="button"
      className="mg-v2-ad-modal__close-btn"
      onClick={onClose}
      aria-label="닫기"
    >
      <X size={20} strokeWidth={2} />
    </button>
  );

  const renderHeader = () => {
    const hasCustomHeader = header !== undefined && header !== null;
    const hasTitleBlock = title || showCloseButton;
    if (!hasCustomHeader && !hasTitleBlock) return null;
    return (
      <div className="mg-v2-ad-modal__header">
        {hasCustomHeader ? (
          header
        ) : (
          <div>
            {title && (
              <h2 id="mg-modal-title" className="mg-v2-ad-modal__title">
                {title}
              </h2>
            )}
            {subtitle && <p className="mg-v2-ad-modal__subtitle">{subtitle}</p>}
          </div>
        )}
        {closeBtn}
      </div>
    );
  };

  const portalTarget = document.body;

  return ReactDOM.createPortal(
    <div
      className="mg-v2-ad-modal-backdrop mg-v2-ad-b0kla"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'mg-modal-title' : undefined}
    >
      <div className={modalClasses} onClick={(e) => e.stopPropagation()}>
        {renderHeader()}

        <div className="mg-v2-ad-modal__body">{children}</div>

        {(footer !== undefined && footer !== null) && (
          <div className="mg-v2-ad-modal__footer">{footer}</div>
        )}
      </div>
    </div>,
    portalTarget
  );
};

export const MgModalHeader = ({ children, className = '', ...props }) => (
  <div className={`mg-v2-ad-modal__header ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const MgModalBody = ({ children, className = '', ...props }) => (
  <div className={`mg-v2-ad-modal__body ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const MgModalFooter = ({ children, className = '', ...props }) => (
  <div className={`mg-v2-ad-modal__footer ${className}`.trim()} {...props}>
    {children}
  </div>
);

export default MgModal;
